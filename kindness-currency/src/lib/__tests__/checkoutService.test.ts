import { describe, it, expect, vi, beforeEach } from 'vitest'

// Regression coverage for the exact bug this session found: checkoutService used to hardcode
// `currency: 'USD'`, which Paystack's South African merchant account rejects outright
// (`unsupported_currency`) — every real checkout was failing silently. It must always settle in
// ZAR now, using the visitor's region only to pick the SA-vs-international bucketed amount, never
// their display currency.

const createPendingOrder = vi.fn()
const orders = { createPendingOrder, getOrderByReference: vi.fn(), markOrderPaid: vi.fn(), grantPurchasedInstances: vi.fn(), redeemDiscountForOrder: vi.fn() }
vi.mock('@/lib/orderRepository', () => ({ createOrderRepository: vi.fn().mockReturnValue(orders) }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))
vi.mock('@/lib/origin', () => ({ getOrigin: vi.fn().mockResolvedValue('https://kindnesscurrency.app') }))

const initializeTransaction = vi.fn()
const verifyTransaction = vi.fn()
vi.mock('@/lib/paystack/client', () => ({
  createPaystackClient: vi.fn().mockReturnValue({ initializeTransaction, verifyTransaction }),
}))

const getRegion = vi.fn()
vi.mock('@/lib/region', () => ({ getRegion }))

describe('checkoutService', () => {
  beforeEach(() => {
    vi.resetModules()
    createPendingOrder.mockReset().mockResolvedValue({ success: true, orderId: 'order-1' })
    initializeTransaction.mockReset().mockResolvedValue({ success: true, authorizationUrl: 'https://paystack.test/pay', accessCode: 'abc' })
    getRegion.mockReset()
    verifyTransaction.mockReset()
    orders.getOrderByReference.mockReset()
    orders.markOrderPaid.mockReset()
    orders.grantPurchasedInstances.mockReset()
    orders.redeemDiscountForOrder.mockReset()
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_xxx'
  })

  describe('initiateCartCheckout', () => {
    it('charges a South African visitor the SA display amount directly, in ZAR', async () => {
      getRegion.mockResolvedValue('ZA')
      const { initiateCartCheckout } = await import('../checkoutService')

      const result = await initiateCartCheckout({
        userId: 'user-1',
        email: 'a@example.com',
        items: [{ slug: 'mothers_day', qty: 1 }],
        callbackPath: '/cart/complete',
      })

      expect(result.success).toBe(true)
      expect(createPendingOrder).toHaveBeenCalledWith(expect.objectContaining({ currency: 'ZAR', amountCents: 1999 }))
      expect(initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({ currency: 'ZAR', amountCents: 1999 }))
    })

    it('charges a US visitor the international ZAR bucket, not a USD amount and not the SA amount', async () => {
      getRegion.mockResolvedValue('US')
      const { initiateCartCheckout } = await import('../checkoutService')

      const result = await initiateCartCheckout({
        userId: 'user-1',
        email: 'a@example.com',
        items: [{ slug: 'mothers_day', qty: 1 }],
        callbackPath: '/cart/complete',
      })

      expect(result.success).toBe(true)
      expect(createPendingOrder).toHaveBeenCalledWith(expect.objectContaining({ currency: 'ZAR', amountCents: 5499 }))
      expect(initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({ currency: 'ZAR', amountCents: 5499 }))
    })

    it('does not apply the 3-for-2 discount when a paid gesture is what brings the cart to 3 units', async () => {
      getRegion.mockResolvedValue('ZA')
      const { initiateCartCheckout } = await import('../checkoutService')

      // 2 coupon books (R19.99 each) + 1 paid gesture (R14.99) — 3 total units, but only 2 are
      // coupon books, so the cheapest-unit-free discount must not fire server-side either.
      const result = await initiateCartCheckout({
        userId: 'user-1',
        email: 'a@example.com',
        items: [
          { slug: 'mothers_day', qty: 1 },
          { slug: 'birthday', qty: 1 },
          { slug: 'celebration', qty: 1 },
        ],
        callbackPath: '/cart/complete',
      })

      expect(result.success).toBe(true)
      expect(createPendingOrder).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 5497 }))
      expect(initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 5497 }))
    })

    it('charges a UK visitor the same international ZAR bucket as a US visitor', async () => {
      getRegion.mockResolvedValue('UK')
      const { initiateCartCheckout } = await import('../checkoutService')

      await initiateCartCheckout({
        userId: 'user-1',
        email: 'a@example.com',
        items: [{ slug: 'mothers_day', qty: 1 }],
        callbackPath: '/cart/complete',
      })

      expect(initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({ currency: 'ZAR', amountCents: 5499 }))
    })
  })

  describe('initiateSingleCheckout', () => {
    it('charges the region-bucketed ZAR gesture-unlock amount for a gestureUnlock product', async () => {
      getRegion.mockResolvedValue('ZA')
      const { initiateSingleCheckout } = await import('../checkoutService')

      await initiateSingleCheckout({
        userId: 'user-1',
        email: 'a@example.com',
        slug: 'relief',
        product: 'gestureUnlock',
        callbackPath: '/create',
      })

      expect(initializeTransaction).toHaveBeenCalledWith(expect.objectContaining({ currency: 'ZAR', amountCents: 1499 }))
    })

    it('rejects a gestureUnlock product for a slug that is not a free gesture', async () => {
      getRegion.mockResolvedValue('US')
      const { initiateSingleCheckout } = await import('../checkoutService')

      const result = await initiateSingleCheckout({
        userId: 'user-1',
        email: 'a@example.com',
        slug: 'mothers_day',
        product: 'gestureUnlock',
        callbackPath: '/create',
      })

      expect(result.success).toBe(false)
      expect(initializeTransaction).not.toHaveBeenCalled()
    })
  })

  describe('verifyAndFulfillCheckout', () => {
    const pendingOrder = { id: 'order-1', user_id: 'user-1', status: 'pending', amount_cents: 5000, cart_snapshot: [{ slug: 'mothers_day', qty: 1 }] }

    it('fulfils the order when Paystack reports a successful charge for the exact amount in ZAR', async () => {
      orders.getOrderByReference.mockResolvedValue(pendingOrder)
      orders.markOrderPaid.mockResolvedValue(true)
      verifyTransaction.mockResolvedValue({ success: true, status: 'success', reference: 'kc_1', amountCents: 5000, currency: 'ZAR' })
      const { verifyAndFulfillCheckout } = await import('../checkoutService')

      const result = await verifyAndFulfillCheckout('kc_1')

      expect(result).toEqual({ paid: true, cartSnapshot: pendingOrder.cart_snapshot, amountCents: 5000 })
      expect(orders.grantPurchasedInstances).toHaveBeenCalledWith('order-1', 'user-1', pendingOrder.cart_snapshot)
    })

    it.each([
      ['a lower amount than the order', { amountCents: 100, currency: 'ZAR' }],
      ['a different currency', { amountCents: 5000, currency: 'USD' }],
    ])('does not fulfil the order when Paystack reports %s', async (_label, charged) => {
      orders.getOrderByReference.mockResolvedValue(pendingOrder)
      verifyTransaction.mockResolvedValue({ success: true, status: 'success', reference: 'kc_1', ...charged })
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { verifyAndFulfillCheckout } = await import('../checkoutService')

      const result = await verifyAndFulfillCheckout('kc_1')

      expect(result).toEqual({ paid: false })
      expect(orders.markOrderPaid).not.toHaveBeenCalled()
      expect(orders.grantPurchasedInstances).not.toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })
})
