import type { SupabaseClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { RedeemInputSchema, type CouponStatus } from '@/schemas/couponSchema'
import { ctaCopy } from '@/constants/ctaCopy'

export type RedeemResult =
  | { success: true; coupon: { id: string; status: CouponStatus; redeemedAt: string | null } }
  | { success: false; error: string }

type CouponRow = {
  id: string
  status: CouponStatus
  redeemed_at: string | null
  coupon_sets:
    | { id: string; pin_code: string; sender_name: string; pin_locked_until: string | null }
    | { id: string; pin_code: string; sender_name: string; pin_locked_until: string | null }[]
    | null
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

/** Records one PIN attempt's outcome via the record_pin_attempt() RPC (see
 * supabase/migrations/20260917000001_add_rate_limits.sql) and returns the active lock time, if
 * any. Fails open (no lock reported) on an unexpected DB error, same fail-open stance as
 * checkRateLimit in rateLimit.ts — the lockout is defense in depth, not the only gate. */
async function recordPinAttempt(supabase: SupabaseClient, setId: string, success: boolean): Promise<string | null> {
  const { data, error } = await supabase.rpc('record_pin_attempt', { p_set_id: setId, p_success: success })
  return error ? null : (data ?? null)
}

export function createRedemptionEngine(supabase: SupabaseClient) {
  return {
    /**
     * Validates the PIN against the coupon's parent set, marks the coupon
     * redeemed, and returns its updated state. Idempotent: redeeming an
     * already-redeemed coupon (correct PIN) succeeds without a second write.
     */
    async redeemCoupon(input: unknown): Promise<RedeemResult> {
      const parsed = RedeemInputSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: GENERIC_ERROR }
      const { couponId, pin } = parsed.data

      const { data: coupon, error: readError } = await supabase
        .from('coupons')
        .select('id, status, redeemed_at, coupon_sets(id, pin_code, sender_name, pin_locked_until)')
        .eq('id', couponId)
        .single<CouponRow>()

      if (readError || !coupon) return { success: false, error: GENERIC_ERROR }

      const set = Array.isArray(coupon.coupon_sets) ? coupon.coupon_sets[0] : coupon.coupon_sets
      if (!set) return { success: false, error: GENERIC_ERROR }

      // Locked out ahead of the bcrypt comparison — a locked attacker gets no further timing
      // signal or CPU cost from us, and the whole set locks (not just this one coupon), so
      // guessing against a different coupon in the same set can't be used to route around it.
      if (set.pin_locked_until && new Date(set.pin_locked_until) > new Date()) {
        return { success: false, error: ctaCopy.pinLockedError }
      }

      const pinMatches = await bcrypt.compare(pin, set.pin_code)
      const lockedUntil = await recordPinAttempt(supabase, set.id, pinMatches)
      if (lockedUntil) return { success: false, error: ctaCopy.pinLockedError }
      if (!pinMatches) return { success: false, error: ctaCopy.pinWrongError(set.sender_name) }

      if (coupon.status === 'redeemed') {
        return { success: true, coupon: { id: coupon.id, status: 'redeemed', redeemedAt: coupon.redeemed_at } }
      }

      const redeemedAt = new Date().toISOString()
      const { data: updated, error: updateError } = await supabase
        .from('coupons')
        .update({ status: 'redeemed', redeemed_at: redeemedAt })
        .eq('id', couponId)
        .eq('status', coupon.status)
        .select('id, status, redeemed_at')
        .single<{ id: string; status: CouponStatus; redeemed_at: string | null }>()

      if (updateError || !updated) {
        // Lost a race with a concurrent redemption — the end state is what the
        // caller wanted, so this is still a success, not an error.
        return { success: true, coupon: { id: couponId, status: 'redeemed', redeemedAt } }
      }

      return { success: true, coupon: { id: updated.id, status: updated.status, redeemedAt: updated.redeemed_at } }
    },
  }
}
