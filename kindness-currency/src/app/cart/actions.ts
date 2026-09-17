'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { initiateCartCheckout, type InitiateCheckoutResult } from '@/lib/checkoutService'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'
import type { CartLineItem } from '@/lib/pricing'

const RATE_LIMITED_ERROR = "You're checking out a bit fast — please wait a moment and try again."

export async function initiateCartCheckoutAction(items: CartLineItem[]): Promise<InitiateCheckoutResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user?.email) return { success: false, error: 'Not logged in' }

  const { allowed } = await checkRateLimit(createServiceClient(), `checkout:user:${user.id}`, RATE_LIMITS.checkoutByUser)
  if (!allowed) return { success: false, error: RATE_LIMITED_ERROR }

  return initiateCartCheckout({ userId: user.id, email: user.email, items, callbackPath: '/cart/complete' })
}
