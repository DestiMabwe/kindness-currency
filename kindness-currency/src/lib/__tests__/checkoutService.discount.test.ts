import { describe, it, expect, vi, beforeEach } from 'vitest'

// Discount-code behaviour of checkoutService: what the buyer is charged, that a 100% code never
// touches Paystack, and that a refused code never leaves a fulfilled order behind.

const orders = {
  createPendingOrder: vi.fn(),
  getOrderByReference: vi.fn(),
  markOrderPaid: vi.fn(),
  markOrderFailed: vi.fn(),
  grantPurchasedInstances: vi.fn(),
  redeemDiscountForOrder: vi.fn(),
}
vi.mock('@/lib/orderRepository', () => ({ createOrderRepository: vi.fn().mockReturnValue(orders) }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))
vi.mock('@/lib/origin', () => ({ getOrigin: vi.fn().mockResolvedValue('https://kindnesscurrency.app') }))

const validateForUser = vi.fn()
vi.mock('@/lib/discountCodeRepository', () => ({ createDiscountCodeRepository: () => ({ validateForUser }) }))

const initializeTransaction = vi.fn()
const verifyTransaction = vi.fn()
vi.mock('@/lib/paystack/client', () => ({
  createPaystackClient: vi.fn().mockReturnValue({ initializeTransaction, verifyTransaction }),
}))

const getRegion = vi.fn()
vi.mock('@/lib/region', () => ({ getRegion }))

const ONE_BOOK = [{ slug: 'mothers_day', qty: 1 }] // R19.99 in ZA -> 1999 cents
const code = (percentOff: number) => ({ success: true as const, code: { id: 'code-1', code: 'TESTER', percentOff, label: 'tester' } })

async function checkout(discountCode?: string, items = ONE_BOOK) {
  const { initiateCartCheckout } = await import('../checkoutService')
  return initiateCartCheckout({ userId: 'user-1', email: 'a@example.com', items, callbackPath: '/cart/complete', discountCode })
}

describe('checkoutService discount codes', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.values(orders).forEach((fn) => fn.mockReset())
    orders.createPendingOrder.mockResolvedValue({ success: true, orderId: 'order-1' })
    orders.markOrderPaid.mockResolvedValue(true)
    orders.grantPurchasedInstances.mockResolvedValue({ success: true })
    orders.redeemDiscountForOrder.mockResolvedValue({ success: true })
    validateForUser.mockReset()
    initializeTransaction.mockReset().mockResolvedValue({ success: true, authorizationUrl: 'https://paystack.test/pay', accessCode: 'abc' })
    verifyTransaction.mockReset()
    getRegion.mockReset().mockResolvedValue('ZA')
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_xxx'
  })

  it('charges the discounted amount through Paystack and records the discount on the order', async () => {
    validateForUser.mockResolvedValue(code(50))

    const result = await checkout('tester')

    expect(result).toEqual({ success: true, accessCode: 'abc' })
    expect(validateForUser).toHaveBeenCalledWith('tester', 'user-1')
    expect(orders.createPendingOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 999, discountCodeId: 'code-1', discountCents: 1000 })
    )
    expect(initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 999 }))
    // Redemption is recorded at fulfilment, not now — an abandoned Paystack window must not burn a use.
    expect(orders.redeemDiscountForOrder).not.toHaveBeenCalled()
  })

  it('applies the code on top of 3-for-2, not instead of it', async () => {
    validateForUser.mockResolvedValue(code(50))

    // 3 books: the cheapest is free, so 2 x 1999 = 3998 -> 50% off = 1999
    await checkout('tester', [{ slug: 'mothers_day', qty: 3 }])

    expect(orders.createPendingOrder).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 1999, discountCents: 1999 }))
  })

  it('never charges under the Paystack minimum — a near-100% code is raised to R1.00', async () => {
    validateForUser.mockResolvedValue(code(99))

    await checkout('tester')

    expect(initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 100 }))
  })

  describe('a 100% code', () => {
    it('creates a paid, fulfilled order without ever calling Paystack', async () => {
      validateForUser.mockResolvedValue(code(100))

      const result = await checkout('tester')

      expect(result).toMatchObject({ success: true, free: true })
      expect(result).toHaveProperty('reference', expect.stringMatching(/^kc_free_/))
      expect(initializeTransaction).not.toHaveBeenCalled()
      expect(orders.createPendingOrder).toHaveBeenCalledWith(
        expect.objectContaining({ amountCents: 0, discountCodeId: 'code-1', discountCents: 1999 })
      )
      expect(orders.redeemDiscountForOrder).toHaveBeenCalledWith('order-1', true)
      expect(orders.markOrderPaid).toHaveBeenCalledWith('order-1')
      expect(orders.grantPurchasedInstances).toHaveBeenCalledWith('order-1', 'user-1', ONE_BOOK)
    })

    it('grants nothing and fails the order if the code was used up in the meantime', async () => {
      validateForUser.mockResolvedValue(code(100))
      orders.redeemDiscountForOrder.mockResolvedValue({ success: false, error: 'That code has been fully used.' })

      const result = await checkout('tester')

      expect(result).toEqual({ success: false, error: 'That code has been fully used.' })
      expect(orders.markOrderFailed).toHaveBeenCalledWith('order-1')
      expect(orders.markOrderPaid).not.toHaveBeenCalled()
      expect(orders.grantPurchasedInstances).not.toHaveBeenCalled()
    })

    it('does not report success if granting the purchased instances fails', async () => {
      validateForUser.mockResolvedValue(code(100))
      orders.grantPurchasedInstances.mockResolvedValue({ success: false })

      const result = await checkout('tester')

      expect(result.success).toBe(false)
    })
  })

  it('refuses a bad code outright — no order, no Paystack call', async () => {
    validateForUser.mockResolvedValue({ success: false, error: 'That code has expired.' })

    const result = await checkout('old')

    expect(result).toEqual({ success: false, error: 'That code has expired.' })
    expect(orders.createPendingOrder).not.toHaveBeenCalled()
    expect(initializeTransaction).not.toHaveBeenCalled()
  })

  it('leaves checkout exactly as before when there is no code, or only blank spaces', async () => {
    await checkout(undefined)
    await checkout('   ')

    expect(validateForUser).not.toHaveBeenCalled()
    expect(orders.createPendingOrder).toHaveBeenCalledTimes(2)
    expect(orders.createPendingOrder).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 1999 }))
    expect(orders.createPendingOrder).toHaveBeenCalledWith(expect.not.objectContaining({ discountCodeId: expect.anything() }))
  })

  describe('fulfilment after a Paystack payment', () => {
    it('records the redemption once, when this call is the one that marks the order paid', async () => {
      orders.getOrderByReference.mockResolvedValue({ id: 'order-1', user_id: 'user-1', status: 'pending', cart_snapshot: ONE_BOOK, amount_cents: 999 })
      verifyTransaction.mockResolvedValue({ success: true, status: 'success', reference: 'kc_1', amountCents: 999, currency: 'ZAR' })
      const { verifyAndFulfillCheckout } = await import('../checkoutService')

      await verifyAndFulfillCheckout('kc_1')

      expect(orders.redeemDiscountForOrder).toHaveBeenCalledWith('order-1', false)
    })

    it('does not record it again when the webhook already won the race', async () => {
      orders.getOrderByReference.mockResolvedValue({ id: 'order-1', user_id: 'user-1', status: 'pending', cart_snapshot: ONE_BOOK, amount_cents: 999 })
      verifyTransaction.mockResolvedValue({ success: true, status: 'success', reference: 'kc_1', amountCents: 999, currency: 'ZAR' })
      orders.markOrderPaid.mockResolvedValue(false)
      const { verifyAndFulfillCheckout } = await import('../checkoutService')

      await verifyAndFulfillCheckout('kc_1')

      expect(orders.redeemDiscountForOrder).not.toHaveBeenCalled()
    })

    it('treats an already-paid free order as paid without asking Paystack', async () => {
      orders.getOrderByReference.mockResolvedValue({ id: 'order-1', user_id: 'user-1', status: 'paid', cart_snapshot: ONE_BOOK, amount_cents: 0 })
      const { verifyAndFulfillCheckout } = await import('../checkoutService')

      const result = await verifyAndFulfillCheckout('kc_free_1')

      expect(result).toEqual({ paid: true, cartSnapshot: ONE_BOOK, amountCents: 0 })
      expect(verifyTransaction).not.toHaveBeenCalled()
    })
  })
})
