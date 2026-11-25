import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiateCartCheckoutAction, previewDiscountCodeAction } from '../actions'

const getUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ auth: { getUser: () => getUser() } }),
}))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))

const initiateCartCheckout = vi.fn()
vi.mock('@/lib/checkoutService', () => ({
  initiateCartCheckout: (params: unknown) => initiateCartCheckout(params),
}))

const validateForUser = vi.fn()
vi.mock('@/lib/discountCodeRepository', () => ({ createDiscountCodeRepository: () => ({ validateForUser }) }))

const checkRateLimit = vi.fn()
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  RATE_LIMITS: { checkoutByUser: { limit: 10, windowSeconds: 60 }, discountCodeByUser: { limit: 10, windowSeconds: 600 } },
}))

const ITEMS = [{ slug: 'mothers_day', qty: 1 }]

describe('discount code server actions', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-1', email: 'alex@example.com' } } })
    initiateCartCheckout.mockReset().mockResolvedValue({ success: true, accessCode: 'access-code-1' })
    validateForUser.mockReset()
    checkRateLimit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
  })

  describe('previewDiscountCodeAction', () => {
    it('returns the percentage for a usable code', async () => {
      validateForUser.mockResolvedValue({ success: true, code: { id: 'c1', code: 'TESTER', percentOff: 100, label: 'tester' } })

      const result = await previewDiscountCodeAction('tester')

      expect(result).toEqual({ success: true, code: 'TESTER', percentOff: 100 })
      expect(validateForUser).toHaveBeenCalledWith('tester', 'user-1')
    })

    it('passes the reason through when a code is refused', async () => {
      validateForUser.mockResolvedValue({ success: false, error: 'That code has expired.' })

      expect(await previewDiscountCodeAction('old')).toEqual({ success: false, error: 'That code has expired.' })
    })

    it('refuses a logged-out visitor without touching the database', async () => {
      getUser.mockResolvedValue({ data: { user: null } })

      const result = await previewDiscountCodeAction('tester')

      expect(result.success).toBe(false)
      expect(validateForUser).not.toHaveBeenCalled()
      expect(checkRateLimit).not.toHaveBeenCalled()
    })

    it('stops a guesser once the per-user code limit is hit, before looking anything up', async () => {
      checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 120 })

      const result = await previewDiscountCodeAction('guess')

      expect(result).toEqual({ success: false, error: expect.stringContaining('a bit fast') })
      expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'discount:user:user-1', expect.anything())
      expect(validateForUser).not.toHaveBeenCalled()
    })
  })

  describe('initiateCartCheckoutAction with a code', () => {
    it('hands the trimmed code text to checkout, and nothing else about price', async () => {
      await initiateCartCheckoutAction(ITEMS, '  tester ')

      expect(initiateCartCheckout).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'alex@example.com',
        items: ITEMS,
        callbackPath: '/cart/complete',
        discountCode: 'tester',
      })
    })

    it('counts a code attempt against the tighter code limit and refuses once exhausted', async () => {
      checkRateLimit.mockImplementation(async (_s: unknown, key: string) => ({ allowed: !key.startsWith('discount:'), retryAfterSeconds: 60 }))

      const result = await initiateCartCheckoutAction(ITEMS, 'guess')

      expect(result.success).toBe(false)
      expect(initiateCartCheckout).not.toHaveBeenCalled()
    })

    it('does not touch the code limit when no code was entered', async () => {
      await initiateCartCheckoutAction(ITEMS)

      expect(checkRateLimit).toHaveBeenCalledTimes(1)
      expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'checkout:user:user-1', expect.anything())
    })

    it('returns a free-order result untouched so the cart can skip the payment window', async () => {
      initiateCartCheckout.mockResolvedValue({ success: true, free: true, reference: 'kc_free_1' })

      expect(await initiateCartCheckoutAction(ITEMS, 'tester')).toEqual({ success: true, free: true, reference: 'kc_free_1' })
    })
  })
})
