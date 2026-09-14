import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createOrderRepository } from '@/lib/orderRepository'

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

  const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } }
  if (event.event !== 'charge.success' || !event.data?.reference) {
    return NextResponse.json({ received: true })
  }

  const orders = createOrderRepository(createServiceClient())
  const order = await orders.getOrderByReference(event.data.reference)
  if (!order) return NextResponse.json({ received: true })

  const won = await orders.markOrderPaid(order.id)
  if (won) await orders.grantPurchasedInstances(order.id, order.user_id, order.cart_snapshot)

  return NextResponse.json({ received: true })
}
