'use server'

import { createRedemptionEngine } from '@/lib/redemptionEngine'
import { createCouponSetRepository } from '@/lib/couponSetRepository'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function redeemCouponAction(input: { couponId: string; pin: string }) {
  return createRedemptionEngine(createServiceClient()).redeemCoupon(input)
}

export async function linkRecipientAction(setId: string) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return { success: false, error: 'Not logged in' } as const

  return createCouponSetRepository(createServiceClient()).linkRecipient(setId, user.id)
}
