'use server'

import { createClient } from '@/lib/supabase/server'
import { initiateCartCheckout, type InitiateCheckoutResult } from '@/lib/checkoutService'
import type { CartLineItem } from '@/lib/pricing'

export async function initiateCartCheckoutAction(items: CartLineItem[]): Promise<InitiateCheckoutResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user?.email) return { success: false, error: 'Not logged in' }

  return initiateCartCheckout({ userId: user.id, email: user.email, items, callbackPath: '/cart/complete' })
}
