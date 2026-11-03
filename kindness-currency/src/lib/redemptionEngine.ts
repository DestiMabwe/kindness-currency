import { randomInt } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { GeneratePinInputSchema, RedeemCouponInputSchema, type CouponStatus } from '@/schemas/couponSchema'
import { ctaCopy } from '@/constants/ctaCopy'

export type GeneratePinResult =
  | { success: true; pin: string; expiresAt: string }
  | { success: false; error: string }

export type RedeemResult =
  | { success: true; coupon: { id: string; status: CouponStatus; redeemedAt: string | null } }
  | { success: false; error: string }

type CouponRow = {
  id: string
  status: CouponStatus
  redeemed_at: string | null
  coupon_sets:
    | { id: string; user_id: string | null; recipient_name: string }
    | { id: string; user_id: string | null; recipient_name: string }[]
    | null
}

type OtpRow = { id: string; pin_hash: string; expires_at: string; attempts: number }

const GENERIC_ERROR = 'Something went wrong. Please try again.'
const PIN_TTL_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5

/** Uniform 4-digit PIN from the OS CSPRNG, zero-padded ("0042"). Never Math.random. */
function randomPin(): string {
  return randomInt(0, 10000).toString().padStart(4, '0')
}

export function createRedemptionEngine(supabase: SupabaseClient) {
  return {
    /**
     * Recipient-side (no login). Issues a fresh 5-minute PIN for one coupon and returns the raw
     * PIN exactly once — only its bcrypt hash is stored. Any PIN still live for the coupon is
     * retired first, so there is only ever one valid PIN per coupon. Per-coupon and per-IP rate
     * limiting happens in the server action, like every other rate limit in this codebase.
     */
    async generatePin(input: unknown): Promise<GeneratePinResult> {
      const parsed = GeneratePinInputSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: GENERIC_ERROR }
      const { couponId } = parsed.data

      const { data: coupon, error: readError } = await supabase
        .from('coupons')
        .select('id, status')
        .eq('id', couponId)
        .single<{ id: string; status: CouponStatus }>()

      if (readError || !coupon) return { success: false, error: GENERIC_ERROR }
      if (coupon.status === 'redeemed') return { success: false, error: ctaCopy.pinAlreadyRedeemed }

      // Retire the previous live PIN. The partial unique index on redemption_otps(coupon_id)
      // WHERE consumed_at IS NULL is the real guarantee; this keeps the common path clean.
      await supabase
        .from('redemption_otps')
        .update({ consumed_at: new Date().toISOString() })
        .eq('coupon_id', couponId)
        .is('consumed_at', null)

      const pin = randomPin()
      const expiresAt = new Date(Date.now() + PIN_TTL_MS).toISOString()
      const { error: insertError } = await supabase
        .from('redemption_otps')
        .insert({ coupon_id: couponId, pin_hash: await bcrypt.hash(pin, 10), expires_at: expiresAt })

      // Includes the unique-index violation when two generates race — one of them loses, softly.
      if (insertError) return { success: false, error: GENERIC_ERROR }

      return { success: true, pin, expiresAt }
    },

    /**
     * Sender-side. `userId` is the signed-in sender from the server action's session — it must
     * own the coupon's set. Verifies the PIN against the coupon's live, unexpired OTP, marks the
     * coupon redeemed, and consumes the OTP. Idempotent: an already-redeemed coupon succeeds
     * without a second write (the OTP is consumed on first redeem, so there is no PIN left to
     * re-check — ownership has already been verified).
     */
    async redeemCoupon(input: unknown, userId: string): Promise<RedeemResult> {
      const parsed = RedeemCouponInputSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: GENERIC_ERROR }
      const { couponId, pin } = parsed.data

      const { data: coupon, error: readError } = await supabase
        .from('coupons')
        .select('id, status, redeemed_at, coupon_sets(id, user_id, recipient_name)')
        .eq('id', couponId)
        .single<CouponRow>()

      if (readError || !coupon) return { success: false, error: GENERIC_ERROR }

      const set = Array.isArray(coupon.coupon_sets) ? coupon.coupon_sets[0] : coupon.coupon_sets
      // A non-owner gets the same generic error as a missing coupon, so this can't be used to
      // probe which coupon ids exist.
      if (!set || set.user_id !== userId) return { success: false, error: GENERIC_ERROR }

      if (coupon.status === 'redeemed') {
        return { success: true, coupon: { id: coupon.id, status: 'redeemed', redeemedAt: coupon.redeemed_at } }
      }

      const wrongPin: RedeemResult = { success: false, error: ctaCopy.pinWrongError(set.recipient_name) }

      const { data: otp } = await supabase
        .from('redemption_otps')
        .select('id, pin_hash, expires_at, attempts')
        .eq('coupon_id', couponId)
        .is('consumed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<OtpRow>()

      // Missing, expired and burned-out OTPs all look the same as a wrong PIN, and are rejected
      // before bcrypt runs — a dead OTP costs us no CPU and gives no timing signal.
      if (!otp || new Date(otp.expires_at) <= new Date() || otp.attempts >= MAX_ATTEMPTS) return wrongPin

      if (!(await bcrypt.compare(pin, otp.pin_hash))) {
        // Atomic in Postgres; kills the OTP on the 5th wrong guess. Fails open on DB error —
        // the 5-minute expiry still bounds the attacker.
        await supabase.rpc('record_otp_failure', { p_otp_id: otp.id })
        return wrongPin
      }

      const redeemedAt = new Date().toISOString()
      const { data: updated, error: updateError } = await supabase
        .from('coupons')
        .update({ status: 'redeemed', redeemed_at: redeemedAt })
        .eq('id', couponId)
        .eq('status', coupon.status)
        .select('id, status, redeemed_at')
        .single<{ id: string; status: CouponStatus; redeemed_at: string | null }>()

      await supabase.from('redemption_otps').update({ consumed_at: redeemedAt }).eq('id', otp.id)

      if (updateError || !updated) {
        // Lost a race with a concurrent redemption — the end state is what the caller wanted,
        // so this is still a success, not an error.
        return { success: true, coupon: { id: couponId, status: 'redeemed', redeemedAt } }
      }

      return { success: true, coupon: { id: updated.id, status: updated.status, redeemedAt: updated.redeemed_at } }
    },
  }
}
