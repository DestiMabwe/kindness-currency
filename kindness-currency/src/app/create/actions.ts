'use server'

import { createCouponSetRepository, type SaveCouponSetResult } from '@/lib/couponSetRepository'
import { createOrderRepository } from '@/lib/orderRepository'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { initiateSingleCheckout, verifyAndFulfillCheckout, type InitiateCheckoutResult, type VerifyAndFulfillResult } from '@/lib/checkoutService'

async function getAuthedUser() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  return user
}

/** Always free — writes status='draft', no entitlement check. */
export async function saveDraftAction(input: unknown): Promise<SaveCouponSetResult> {
  const user = await getAuthedUser()
  return createCouponSetRepository(createServiceClient()).saveCouponSet(input, user?.id ?? null, 'draft')
}

/**
 * Writes status='sent'. If the template/gesture requires payment and no unconsumed instance is
 * available, returns paymentRequired:true instead of writing anything — the caller (builder UI)
 * is expected to redirect to initiateSendCheckoutAction in that case.
 */
export async function sendCouponSetAction(input: unknown): Promise<SaveCouponSetResult> {
  const user = await getAuthedUser()
  return createCouponSetRepository(createServiceClient()).saveCouponSet(input, user?.id ?? null, 'sent')
}

/**
 * Starts a Paystack checkout for exactly one unit of one template/gesture — the single-send
 * counterpart to the cart's initiateCartCheckoutAction. `product` distinguishes a normal send from
 * the "Make This Gift Yours" gesture-unlock upsell, which charges GESTURE_UNLOCK_PRICE instead of
 * the gesture's (zero) base price for the same slug — see resolveCheckoutPrice in pricing.ts.
 */
export async function initiateSendCheckoutAction(slug: string, product: 'base' | 'gestureUnlock' = 'base'): Promise<InitiateCheckoutResult> {
  const user = await getAuthedUser()
  if (!user?.email) return { success: false, error: 'Not logged in' }

  return initiateSingleCheckout({
    userId: user.id,
    email: user.email,
    slug,
    product,
    callbackPath: '/create',
  })
}

/** Fast-path fallback for the checkout return: verifies the reference directly with Paystack and
 * fulfills it if paid, in case the webhook hasn't landed yet. Safe to call more than once. */
export async function verifyCheckoutAction(reference: string): Promise<VerifyAndFulfillResult> {
  return verifyAndFulfillCheckout(reference)
}

/**
 * Whether the signed-in sender already has an unconsumed purchased_instances row for this
 * template — used to gate entry into the coupon editor itself (Step 3 of the builder), not just
 * the final Send, so a bundle template can't be fully personalized for free before payment.
 * Always false for a logged-out visitor: purchased_instances is keyed to a real user_id, so there
 * is nothing to check without one. Single-use gestures never go through this gate (see
 * CouponSetBuilder — they're handled entirely by GestureFlow instead).
 */
export async function checkTemplateEntitlementAction(slug: string): Promise<{ entitled: boolean }> {
  const user = await getAuthedUser()
  if (!user) return { entitled: false }
  const instances = await createOrderRepository(createServiceClient()).getUnconsumedInstancesForUser(user.id)
  return { entitled: instances.some((instance) => instance.slug === slug) }
}

export async function linkSenderAction(setId: string) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return { success: false as const, error: 'Not logged in' }

  return createCouponSetRepository(createServiceClient()).linkSender(setId, user.id)
}
