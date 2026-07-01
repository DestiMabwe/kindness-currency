'use server'

import { createRedemptionEngine } from '@/lib/redemptionEngine'
import { createServiceClient } from '@/lib/supabase/service'

export async function redeemCouponAction(input: { couponId: string; pin: string }) {
  return createRedemptionEngine(createServiceClient()).redeemCoupon(input)
}
