import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiateCartCheckoutAction } from '../actions'

const getUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ auth: { getUser: () => getUser() } }),
}))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))

const initiateCartCheckout = vi.fn()
vi.mock('@/lib/checkoutService', () => ({
  initiateCartCheckout: (params: unknown) => initiateCartCheckout(params),
}))

const checkRateLimit = vi.fn()
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  RATE_LIMITS: { checkoutByUser: { limit: 10, windowSeconds: 60 } },
}))

describe('initiateCartCheckoutAction', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-1', email: 'alex@example.com' } } })
    initiateCartCheckout.mockReset().mockResolvedValue({ success: true, authorizationUrl: 'https://paystack.test/pay' })
    checkRateLimit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
  })

  it('checks out normally when under the rate limit', async () => {
    const items = [{ slug: 'mothers_day', qty: 1 }]

    const result = await initiateCartCheckoutAction(items)

    expect(result).toEqual({ success: true, authorizationUrl: 'https://paystack.test/pay' })
    expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'checkout:user:user-1', expect.anything())
    expect(initiateCartCheckout).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'alex@example.com',
      items,
      callbackPath: '/cart/complete',
    })
  })

  it('rejects the request and never calls checkoutService once the per-user limit is exceeded', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 })

    const result = await initiateCartCheckoutAction([{ slug: 'mothers_day', qty: 1 }])

    expect(result).toEqual({ success: false, error: "You're checking out a bit fast — please wait a moment and try again." })
    expect(initiateCartCheckout).not.toHaveBeenCalled()
  })

  it('still refuses a logged-out request before ever checking the rate limit', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const result = await initiateCartCheckoutAction([{ slug: 'mothers_day', qty: 1 }])

    expect(result).toEqual({ success: false, error: 'Not logged in' })
    expect(checkRateLimit).not.toHaveBeenCalled()
  })
})
