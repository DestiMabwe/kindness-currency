import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { createOrderRepository } from '@/lib/orderRepository'

// checkoutService only ever creates ZAR orders (Paystack settles in ZAR).
const ORDER_CURRENCY = 'ZAR'

const ChargeSuccessEventSchema = z.object({
  event: z.literal('charge.success'),
  data: z.object({ reference: z.string().min(1), amount: z.number(), currency: z.string() }),
})

/**
 * Paystack's source of truth for fulfillment (the checkout return page is a fast-path fallback in
 * case this hasn't landed yet — both call the same idempotent markOrderPaid/grantPurchasedInstances
 * pair, so whichever arrives first wins and the other is a no-op).
 *
 * App Router route handlers have no body-parser to fight, so request.text() gives the untouched
 * raw body straight away — required for the signature check, since re-serializing a parsed body
 * would not byte-for-byte match what Paystack signed.
 */
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature')
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex')

  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const parsed = ChargeSuccessEventSchema.safeParse(JSON.parse(rawBody))
  if (!parsed.success) return NextResponse.json({ received: true })
  const { reference, amount, currency } = parsed.data.data

  const orders = createOrderRepository(createServiceClient())
  const order = await orders.getOrderByReference(reference)
  if (!order) return NextResponse.json({ received: true })

  // Never fulfil an order for less than it was priced at (or in another currency). 200, not 4xx:
  // Paystack would retry a mismatch forever and it can't self-correct, so we log it and move on.
  if (amount !== order.amount_cents || currency !== ORDER_CURRENCY) {
    console.error(`Paystack webhook amount/currency mismatch for ${reference}: got ${amount} ${currency}, expected ${order.amount_cents} ${ORDER_CURRENCY}`)
    return NextResponse.json({ received: true })
  }

  const won = await orders.markOrderPaid(order.id)
  if (won) await orders.grantPurchasedInstances(order.id, order.user_id, order.cart_snapshot)

  return NextResponse.json({ received: true })
}
