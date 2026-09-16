import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { createOrderRepository } from '@/lib/orderRepository'
import { createPaystackClient } from '@/lib/paystack/client'
import { getOrigin } from '@/lib/origin'
import { getRegion } from '@/lib/region'
import { CartCheckoutInputSchema } from '@/schemas/checkoutSchema'
import { cartTotals, settlementLinesForCart, resolveSettlementPrice, type CartLineItem } from '@/lib/pricing'
import { settlementBucketForRegion, SETTLEMENT_PAIRED_BUNDLE_PRICE_ZAR } from '@/lib/geoPricing'

export type InitiateCheckoutResult = { success: true; authorizationUrl: string } | { success: false; error: string }

const GENERIC_ERROR = 'Something went wrong starting checkout. Please try again.'

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
}): Promise<InitiateCheckoutResult> {
  if (params.amountCents <= 0) return { success: false, error: GENERIC_ERROR }

  const supabase = createServiceClient()
  const orders = createOrderRepository(supabase)
  const reference = `kc_${randomUUID()}`

  const created = await orders.createPendingOrder({
    userId: params.userId,
    email: params.email,
    amountCents: params.amountCents,
    currency: 'ZAR',
    reference,
    cartSnapshot: params.cartSnapshot,
  })
  if (!created.success) return { success: false, error: created.error }

  const origin = await getOrigin()
  const callbackUrl = `${origin}${params.callbackPath}${params.callbackPath.includes('?') ? '&' : '?'}reference=${encodeURIComponent(reference)}`

  const paystack = createPaystackClient(requirePaystackSecretKey())
  const initialized = await paystack.initializeTransaction({
    email: params.email,
    amountCents: params.amountCents,
    currency: 'ZAR',
    reference,
    callbackUrl,
  })

  if (!initialized.success) return { success: false, error: GENERIC_ERROR }
  return { success: true, authorizationUrl: initialized.authorizationUrl }
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
}): Promise<InitiateCheckoutResult> {
  const parsed = CartCheckoutInputSchema.safeParse(params.items)
  if (!parsed.success) return { success: false, error: GENERIC_ERROR }

  const bucket = settlementBucketForRegion(await getRegion())
  const lines = settlementLinesForCart(parsed.data, bucket)
  if (lines.length !== parsed.data.length) return { success: false, error: GENERIC_ERROR }

  const { total } = cartTotals(lines, SETTLEMENT_PAIRED_BUNDLE_PRICE_ZAR[bucket])
  return createOrderAndInitialize({
    userId: params.userId,
    email: params.email,
    amountCents: Math.round(total * 100),
    cartSnapshot: parsed.data,
    callbackPath: params.callbackPath,
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

  const won = await orders.markOrderPaid(order.id)
  if (won) await orders.grantPurchasedInstances(order.id, order.user_id, order.cart_snapshot)
  return { paid: true, cartSnapshot: order.cart_snapshot, amountCents: order.amount_cents }
}
