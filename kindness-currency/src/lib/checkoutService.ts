import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { createOrderRepository } from '@/lib/orderRepository'
import { createDiscountCodeRepository } from '@/lib/discountCodeRepository'
import { applyPercentDiscount } from '@/lib/discount'
import { createPaystackClient } from '@/lib/paystack/client'
import { getOrigin } from '@/lib/origin'
import { getRegion } from '@/lib/region'
import { flags } from '@/lib/flags'
import { CartCheckoutInputSchema } from '@/schemas/checkoutSchema'
import { cartTotals, settlementLinesForCart, resolveSettlementPrice, type CartLineItem } from '@/lib/pricing'
import { settlementBucketForRegion, SETTLEMENT_PAIRED_BUNDLE_PRICE_ZAR } from '@/lib/geoPricing'

export type InitiateCheckoutResult = { success: true; accessCode: string } | { success: false; error: string }

/** The cart's result: same as a normal checkout, plus `free: true` when a 100%-off code made the
 * order cost nothing — it's already paid and fulfilled, so there's no Paystack window to open and
 * the caller goes straight to /cart/complete with this reference. */
export type InitiateCartCheckoutResult = InitiateCheckoutResult | { success: true; free: true; reference: string }

// Paystack only ever settles this merchant account in ZAR.
const ORDER_CURRENCY = 'ZAR'

const GENERIC_ERROR ='Something went wrong starting checkout. Please try again.'

function requirePaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('Missing environment variable: PAYSTACK_SECRET_KEY')
  return key
}

/** Shared by every checkout entry point once each has resolved its own charge amount — creates
 * the pending order, then the Paystack transaction. The only place a Paystack call is made. */
async function createOrderAndInitialize(params: {
  userId: string
  email: string
  amountCents: number
  cartSnapshot: CartLineItem[]
  callbackPath: string
  /** Already-validated discount: amountCents is the discounted charge; this is what to record. */
  discount?: { codeId: string; discountCents: number }
}): Promise<InitiateCheckoutResult> {
  if (params.amountCents <= 0) return { success: false, error: GENERIC_ERROR }

  const supabase = createServiceClient()
  const orders = createOrderRepository(supabase)
  const reference = `kc_${randomUUID()}`

  const created = await orders.createPendingOrder({
    userId: params.userId,
    email: params.email,
    amountCents: params.amountCents,
    currency: ORDER_CURRENCY,
    reference,
    cartSnapshot: params.cartSnapshot,
    discountCodeId: params.discount?.codeId,
    discountCents: params.discount?.discountCents,
  })
  if (!created.success) return { success: false, error: created.error }

  const origin = await getOrigin()
  const callbackUrl = `${origin}${params.callbackPath}${params.callbackPath.includes('?') ? '&' : '?'}reference=${encodeURIComponent(reference)}`

  const paystack = createPaystackClient(requirePaystackSecretKey())
  const initialized = await paystack.initializeTransaction({
    email: params.email,
    amountCents: params.amountCents,
    currency: ORDER_CURRENCY,
    reference,
    callbackUrl,
  })

  if (!initialized.success) return { success: false, error: GENERIC_ERROR }
  return { success: true, accessCode: initialized.accessCode }
}

/**
 * A 100%-off order: nothing to charge, so no Paystack call at all. The order is created pending
 * (amount 0), the code is redeemed strictly (no money has moved, so an already-used or exhausted
 * code is refused outright, with the code row locked against a concurrent buyer), and only then is
 * it marked paid and fulfilled through the same markOrderPaid/grantPurchasedInstances pair a
 * Paystack order uses. If redemption is refused the order is marked failed so nothing is granted.
 */
async function createFreeOrder(params: {
  userId: string
  email: string
  cartSnapshot: CartLineItem[]
  discount: { codeId: string; discountCents: number }
}): Promise<InitiateCartCheckoutResult> {
  const orders = createOrderRepository(createServiceClient())
  const reference = `kc_free_${randomUUID()}`

  const created = await orders.createPendingOrder({
    userId: params.userId,
    email: params.email,
    amountCents: 0,
    currency: ORDER_CURRENCY,
    reference,
    cartSnapshot: params.cartSnapshot,
    discountCodeId: params.discount.codeId,
    discountCents: params.discount.discountCents,
  })
  if (!created.success) return { success: false, error: created.error }

  const redeemed = await orders.redeemDiscountForOrder(created.orderId, true)
  if (!redeemed.success) {
    await orders.markOrderFailed(created.orderId)
    return { success: false, error: redeemed.error }
  }

  const won = await orders.markOrderPaid(created.orderId)
  if (won) {
    const granted = await orders.grantPurchasedInstances(created.orderId, params.userId, params.cartSnapshot)
    if (!granted.success) return { success: false, error: GENERIC_ERROR }
  }
  return { success: true, free: true, reference }
}

/**
 * The cart's multi-line checkout — the charge amount is always recomputed here from {slug, qty}
 * pairs against the live settlement tables (3-for-2 + paired-bundle math included), never taken
 * from the caller. Rejects the whole request if any line's slug doesn't resolve to a real,
 * purchasable price rather than silently billing a smaller subset.
 *
 * Charges the visitor's settlement bucket (South Africa vs. everyone else), not their display
 * currency — Paystack only ever settles in ZAR, so what a US/UK visitor *sees* on the cart page
 * (geoPricing.ts's display tables) and what they're actually *charged* here are deliberately
 * different lookups over the same slugs.
 */
export async function initiateCartCheckout(params: {
  userId: string
  email: string
  items: CartLineItem[]
  callbackPath: string
  /** Optional code the buyer typed. Only the text is trusted from the client — it's looked up,
   * validated and turned into a percentage here, then applied on top of 3-for-2 and bundle math. */
  discountCode?: string
}): Promise<InitiateCartCheckoutResult> {
  const parsed = CartCheckoutInputSchema.safeParse(params.items)
  if (!parsed.success) return { success: false, error: GENERIC_ERROR }

  const bucket = settlementBucketForRegion(await getRegion())
  const lines = settlementLinesForCart(parsed.data, bucket)
  if (lines.length !== parsed.data.length) return { success: false, error: GENERIC_ERROR }

  const { total } = cartTotals(lines, SETTLEMENT_PAIRED_BUNDLE_PRICE_ZAR[bucket])
  const totalCents = Math.round(total * 100)

  if (!flags.discountCodes || !params.discountCode?.trim()) {
    return createOrderAndInitialize({
      userId: params.userId,
      email: params.email,
      amountCents: totalCents,
      cartSnapshot: parsed.data,
      callbackPath: params.callbackPath,
    })
  }

  const validated = await createDiscountCodeRepository(createServiceClient()).validateForUser(params.discountCode, params.userId)
  if (!validated.success) return { success: false, error: validated.error }

  const { discountCents, finalCents } = applyPercentDiscount(totalCents, validated.code.percentOff)
  const discount = { codeId: validated.code.id, discountCents }

  if (finalCents === 0) {
    return createFreeOrder({ userId: params.userId, email: params.email, cartSnapshot: parsed.data, discount })
  }
  return createOrderAndInitialize({
    userId: params.userId,
    email: params.email,
    amountCents: finalCents,
    cartSnapshot: parsed.data,
    callbackPath: params.callbackPath,
    discount,
  })
}

/**
 * A single unit of one template/gesture — the direct-send counterpart to initiateCartCheckout.
 * `product` distinguishes a normal paid send from the "Make This Gift Yours" gesture-unlock
 * upsell, which charges the region's gesture-unlock price for an otherwise-free slug instead of
 * its (zero) base price — see resolveSettlementPrice in pricing.ts, the only place that number is
 * resolved. Same ZAR-settlement-vs-display-price split as initiateCartCheckout above.
 */
export async function initiateSingleCheckout(params: {
  userId: string
  email: string
  slug: string
  product: 'base' | 'gestureUnlock'
  callbackPath: string
}): Promise<InitiateCheckoutResult> {
  const bucket = settlementBucketForRegion(await getRegion())
  const price = resolveSettlementPrice(params.slug, params.product, bucket)
  if (price === null) return { success: false, error: GENERIC_ERROR }

  return createOrderAndInitialize({
    userId: params.userId,
    email: params.email,
    amountCents: Math.round(price * 100),
    cartSnapshot: [{ slug: params.slug, qty: 1 }],
    callbackPath: params.callbackPath,
  })
}

/**
 * Verifies a reference directly against Paystack and fulfills it if paid — the fast-path fallback
 * called from a checkout return page/effect in case the webhook hasn't landed yet. Safe to race
 * the webhook: markOrderPaid's conditional update means only whichever call arrives first actually
 * grants instances.
 */
export type VerifyAndFulfillResult = { paid: false } | { paid: true; cartSnapshot: CartLineItem[]; amountCents: number }

export async function verifyAndFulfillCheckout(reference: string): Promise<VerifyAndFulfillResult> {
  const supabase = createServiceClient()
  const orders = createOrderRepository(supabase)
  const order = await orders.getOrderByReference(reference)
  if (!order) return { paid: false }
  if (order.status === 'paid') return { paid: true, cartSnapshot: order.cart_snapshot, amountCents: order.amount_cents }

  const paystack = createPaystackClient(requirePaystackSecretKey())
  const verified = await paystack.verifyTransaction(reference)
  if (!verified.success || verified.status !== 'success') return { paid: false }

  // Same guard as the webhook: never fulfil for less than the order was priced at, or in another currency.
  if (verified.amountCents !== order.amount_cents || verified.currency !== ORDER_CURRENCY) {
    console.error(`Paystack verify amount/currency mismatch for ${reference}: got ${verified.amountCents} ${verified.currency}, expected ${order.amount_cents} ${ORDER_CURRENCY}`)
    return { paid: false }
  }

  const won = await orders.markOrderPaid(order.id)
  if (won) {
    await orders.grantPurchasedInstances(order.id, order.user_id, order.cart_snapshot)
    await orders.redeemDiscountForOrder(order.id, false)
  }
  return { paid: true, cartSnapshot: order.cart_snapshot, amountCents: order.amount_cents }
}
