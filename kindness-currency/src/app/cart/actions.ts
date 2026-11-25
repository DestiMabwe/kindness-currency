'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { initiateCartCheckout, type InitiateCartCheckoutResult } from '@/lib/checkoutService'
import { createDiscountCodeRepository } from '@/lib/discountCodeRepository'
import { DISCOUNT_ERRORS } from '@/lib/discount'
import { flags } from '@/lib/flags'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit'
import type { CartLineItem } from '@/lib/pricing'

const RATE_LIMITED_ERROR = "You're checking out a bit fast — please wait a moment and try again."

export type PreviewDiscountCodeResult =
  | { success: true; code: string; percentOff: number }
  | { success: false; error: string }

export async function initiateCartCheckoutAction(items: CartLineItem[], discountCode?: string): Promise<InitiateCartCheckoutResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user?.email) return { success: false, error: 'Not logged in' }

  const supabase = createServiceClient()
  const { allowed } = await checkRateLimit(supabase, `checkout:user:${user.id}`, RATE_LIMITS.checkoutByUser)
  if (!allowed) return { success: false, error: RATE_LIMITED_ERROR }

  // A code attempt is also a probe at someone's code, so it draws from its own, tighter budget.
  const code = flags.discountCodes ? discountCode?.trim() : undefined
  if (code) {
    const codeLimit = await checkRateLimit(supabase, `discount:user:${user.id}`, RATE_LIMITS.discountCodeByUser)
    if (!codeLimit.allowed) return { success: false, error: DISCOUNT_ERRORS.rateLimited }
  }

  return initiateCartCheckout({ userId: user.id, email: user.email, items, callbackPath: '/cart/complete', discountCode: code })
}

/**
 * Tells the cart whether a typed code is usable, and what percentage it takes off, so the buyer
 * sees the new total before paying. Display only — checkout re-validates and recomputes the real
 * charge itself, so nothing returned here is ever trusted.
 */
export async function previewDiscountCodeAction(code: string): Promise<PreviewDiscountCodeResult> {
  if (!flags.discountCodes) return { success: false, error: DISCOUNT_ERRORS.notFound }

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return { success: false, error: 'Please log in to use a code.' }

  const supabase = createServiceClient()
  const { allowed } = await checkRateLimit(supabase, `discount:user:${user.id}`, RATE_LIMITS.discountCodeByUser)
  if (!allowed) return { success: false, error: DISCOUNT_ERRORS.rateLimited }

  const result = await createDiscountCodeRepository(supabase).validateForUser(code, user.id)
  if (!result.success) return { success: false, error: result.error }
  return { success: true, code: result.code.code, percentOff: result.code.percentOff }
}
