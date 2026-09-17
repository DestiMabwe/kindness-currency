import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiateSendCheckoutAction, sendCouponSetAction } from '../actions'

const getUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ auth: { getUser: () => getUser() } }),
}))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))

const initiateSingleCheckout = vi.fn()
vi.mock('@/lib/checkoutService', () => ({
  initiateSingleCheckout: (params: unknown) => initiateSingleCheckout(params),
  verifyAndFulfillCheckout: vi.fn(),
}))

const saveCouponSet = vi.fn()
vi.mock('@/lib/couponSetRepository', () => ({
  createCouponSetRepository: vi.fn().mockReturnValue({ saveCouponSet: (...args: unknown[]) => saveCouponSet(...args) }),
}))

vi.mock('@/lib/orderRepository', () => ({ createOrderRepository: vi.fn() }))

const checkRateLimit = vi.fn()
const getCallerIp = vi.fn()
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  getCallerIp: () => getCallerIp(),
  RATE_LIMITS: {
    checkoutByUser: { limit: 10, windowSeconds: 60 },
    sendByUser: { limit: 20, windowSeconds: 3600 },
    sendByIp: { limit: 5, windowSeconds: 3600 },
  },
}))

describe('initiateSendCheckoutAction', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-1', email: 'alex@example.com' } } })
    initiateSingleCheckout.mockReset().mockResolvedValue({ success: true, accessCode: 'access-code-1' })
    checkRateLimit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
  })

  it('shares the checkout:user: key namespace with the cart checkout action', async () => {
    await initiateSendCheckoutAction('mothers_day')

    expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'checkout:user:user-1', expect.anything())
    expect(initiateSingleCheckout).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'alex@example.com',
      slug: 'mothers_day',
      product: 'base',
      callbackPath: '/create',
    })
  })

  it('rejects the request once the per-user checkout limit is exceeded', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 10 })

    const result = await initiateSendCheckoutAction('mothers_day')

    expect(result).toEqual({ success: false, error: "You're checking out a bit fast — please wait a moment and try again." })
    expect(initiateSingleCheckout).not.toHaveBeenCalled()
  })
})

describe('sendCouponSetAction', () => {
  beforeEach(() => {
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'user-1', email: 'alex@example.com' } } })
    saveCouponSet.mockReset().mockResolvedValue({ success: true, id: 'set-1', pin: '1234' })
    checkRateLimit.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
    getCallerIp.mockReset().mockResolvedValue('1.2.3.4')
  })

  it('rate-limits by user id when logged in', async () => {
    await sendCouponSetAction({ some: 'input' })

    expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'send:user:user-1', expect.anything())
    expect(saveCouponSet).toHaveBeenCalledWith({ some: 'input' }, 'user-1', 'sent')
  })

  it('falls back to an IP-keyed limit for an anonymous sender', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    await sendCouponSetAction({ some: 'input' })

    expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'send:ip:1.2.3.4', expect.anything())
    expect(saveCouponSet).toHaveBeenCalledWith({ some: 'input' }, null, 'sent')
  })

  it('rejects the send and never touches the repository once the limit is exceeded', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 })

    const result = await sendCouponSetAction({ some: 'input' })

    expect(result).toEqual({ success: false, error: "You're sending a bit fast — please wait a moment and try again." })
    expect(saveCouponSet).not.toHaveBeenCalled()
  })
})
