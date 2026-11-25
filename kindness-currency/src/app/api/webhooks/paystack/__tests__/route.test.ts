import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto'

const getOrderByReference = vi.fn()
const markOrderPaid = vi.fn()
const grantPurchasedInstances = vi.fn()
const redeemDiscountForOrder = vi.fn()
const createOrderRepository = vi.fn().mockReturnValue({ getOrderByReference, markOrderPaid, grantPurchasedInstances, redeemDiscountForOrder })
vi.mock('@/lib/orderRepository', () => ({ createOrderRepository }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))

const SECRET = 'test-paystack-secret'

function signedRequest(body: unknown, secret = SECRET) {
  const raw = JSON.stringify(body)
  const signature = createHmac('sha512', secret).update(raw).digest('hex')
  return new Request('https://example.com/api/webhooks/paystack', {
    method: 'POST',
    headers: { 'x-paystack-signature': signature },
    body: raw,
  })
}

function chargeSuccess(data: Record<string, unknown> = {}) {
  return { event: 'charge.success', data: { reference: 'kc_1', amount: 5000, currency: 'ZAR', ...data } }
}

describe('POST /api/webhooks/paystack', () => {
  beforeEach(() => {
    vi.resetModules()
    getOrderByReference.mockReset()
    markOrderPaid.mockReset()
    grantPurchasedInstances.mockReset()
    redeemDiscountForOrder.mockReset()
    process.env.PAYSTACK_SECRET_KEY = SECRET
  })

  it('rejects a request with an invalid signature', async () => {
    const { POST } = await import('../route')
    const request = signedRequest({ event: 'charge.success', data: { reference: 'kc_1' } }, 'wrong-secret')

    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(getOrderByReference).not.toHaveBeenCalled()
  })

  it('rejects a request with no signature header at all', async () => {
    const { POST } = await import('../route')
    const raw = JSON.stringify({ event: 'charge.success', data: { reference: 'kc_1' } })
    const request = new Request('https://example.com/api/webhooks/paystack', { method: 'POST', body: raw })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('ignores an event that is not charge.success without touching the database', async () => {
    const { POST } = await import('../route')
    const request = signedRequest({ event: 'charge.failed', data: { reference: 'kc_1' } })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(getOrderByReference).not.toHaveBeenCalled()
  })

  it('marks the order paid and grants instances on a valid charge.success', async () => {
    getOrderByReference.mockResolvedValue({ id: 'order-1', user_id: 'user-1', amount_cents: 5000, cart_snapshot: [{ slug: 'mothers_day', qty: 1 }] })
    markOrderPaid.mockResolvedValue(true)
    const { POST } = await import('../route')
    const request = signedRequest(chargeSuccess())

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(markOrderPaid).toHaveBeenCalledWith('order-1')
    expect(grantPurchasedInstances).toHaveBeenCalledWith('order-1', 'user-1', [{ slug: 'mothers_day', qty: 1 }])
    // The order's discount code (if any) is recorded as used once the payment is confirmed.
    expect(redeemDiscountForOrder).toHaveBeenCalledWith('order-1', false)
  })

  it('does not grant instances twice for the same order on a duplicate webhook delivery', async () => {
    getOrderByReference.mockResolvedValue({ id: 'order-1', user_id: 'user-1', amount_cents: 5000, cart_snapshot: [{ slug: 'mothers_day', qty: 1 }] })
    // markOrderPaid's conditional update returns false once the order is already 'paid' —
    // simulating the second delivery arriving after the first already won the race.
    markOrderPaid.mockResolvedValue(false)
    const { POST } = await import('../route')
    const request = signedRequest(chargeSuccess())

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(grantPurchasedInstances).not.toHaveBeenCalled()
    expect(redeemDiscountForOrder).not.toHaveBeenCalled()
  })

  it('returns 200 without error when the reference matches no known order', async () => {
    getOrderByReference.mockResolvedValue(null)
    const { POST } = await import('../route')
    const request = signedRequest(chargeSuccess({ reference: 'kc_unknown' }))

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(markOrderPaid).not.toHaveBeenCalled()
  })

  it.each([
    ['a lower amount than the order', { amount: 100 }],
    ['a different currency', { currency: 'USD' }],
  ])('does not fulfil an order when charge.success reports %s', async (_label, override) => {
    getOrderByReference.mockResolvedValue({ id: 'order-1', user_id: 'user-1', amount_cents: 5000, cart_snapshot: [{ slug: 'mothers_day', qty: 1 }] })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { POST } = await import('../route')

    const response = await POST(signedRequest(chargeSuccess(override)))

    expect(response.status).toBe(200)
    expect(markOrderPaid).not.toHaveBeenCalled()
    expect(grantPurchasedInstances).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('ignores a charge.success payload with no amount without touching the database', async () => {
    const { POST } = await import('../route')

    const response = await POST(signedRequest({ event: 'charge.success', data: { reference: 'kc_1' } }))

    expect(response.status).toBe(200)
    expect(getOrderByReference).not.toHaveBeenCalled()
  })
})
