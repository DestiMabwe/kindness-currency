'use server'

import { createRedemptionEngine } from '@/lib/redemptionEngine'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

/** The signed-in sender enters the PIN the recipient gave them. The engine checks the user owns
 * the coupon's set, so the session user — never a client-supplied id — is what's passed in. */
export async function redeemCouponAction(input: { couponId: string; pin: string }) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return { success: false as const, error: 'Not logged in' }

  return createRedemptionEngine(createServiceClient()).redeemCoupon(input, user.id)
}
