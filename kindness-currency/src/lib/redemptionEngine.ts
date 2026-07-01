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
  coupon_sets: { pin_code: string; sender_name: string } | { pin_code: string; sender_name: string }[] | null
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

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
        .select('id, status, redeemed_at, coupon_sets(pin_code, sender_name)')
        .eq('id', couponId)
        .single<CouponRow>()

      if (readError || !coupon) return { success: false, error: GENERIC_ERROR }

      const set = Array.isArray(coupon.coupon_sets) ? coupon.coupon_sets[0] : coupon.coupon_sets
      if (!set) return { success: false, error: GENERIC_ERROR }

      const pinMatches = await bcrypt.compare(pin, set.pin_code)
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
