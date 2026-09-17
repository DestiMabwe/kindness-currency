import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { devInstantLoginAction, checkAuthRateLimitAction } from '../actions'

const generateLink = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ auth: { admin: { generateLink: (input: unknown) => generateLink(input) } } }),
}))

const checkRateLimit = vi.fn()
const getCallerIp = vi.fn()
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  getCallerIp: () => getCallerIp(),
  RATE_LIMITS: { authByIp: { limit: 10, windowSeconds: 600 }, authByEmail: { limit: 3, windowSeconds: 600 } },
}))

describe('devInstantLoginAction', () => {
  afterEach(() => {
    generateLink.mockReset()
    vi.unstubAllEnvs()
  })

  // This action skips proof of email ownership entirely (no inbox round trip) — it exists purely
  // as a local/demo convenience. If its production gate ever breaks, anyone could log in as
  // anyone in production just by typing their email. These tests exist specifically to catch that
  // regression, not just to exercise the happy path.
  describe('in production', () => {
    it('refuses to log in and never touches the admin API', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      const result = await devInstantLoginAction('alex@example.com')

      expect(result).toEqual({ success: false, error: 'Not available in production.' })
      expect(generateLink).not.toHaveBeenCalled()
    })

    it('refuses even for an empty email, before any other validation runs', async () => {
      vi.stubEnv('NODE_ENV', 'production')

      const result = await devInstantLoginAction('')

      expect(result).toEqual({ success: false, error: 'Not available in production.' })
      expect(generateLink).not.toHaveBeenCalled()
    })
  })

  describe('outside production', () => {
    it('generates a magic-link token hash for a valid email', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      generateLink.mockResolvedValue({ data: { properties: { hashed_token: 'hashed-token-1' } }, error: null })

      const result = await devInstantLoginAction('alex@example.com')

      expect(generateLink).toHaveBeenCalledWith({ type: 'magiclink', email: 'alex@example.com' })
      expect(result).toEqual({ success: true, tokenHash: 'hashed-token-1' })
    })

    it('trims the email before calling the admin API', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      generateLink.mockResolvedValue({ data: { properties: { hashed_token: 'hashed-token-1' } }, error: null })

      await devInstantLoginAction('  alex@example.com  ')

      expect(generateLink).toHaveBeenCalledWith({ type: 'magiclink', email: 'alex@example.com' })
    })

    it('rejects an empty email without calling the admin API', async () => {
      vi.stubEnv('NODE_ENV', 'test')

      const result = await devInstantLoginAction('   ')

      expect(result).toEqual({ success: false, error: 'Enter an email ♥' })
      expect(generateLink).not.toHaveBeenCalled()
    })

    it('returns a generic error if the admin API call fails', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      generateLink.mockResolvedValue({ data: null, error: { message: 'user not found' } })

      const result = await devInstantLoginAction('nobody@example.com')

      expect(result).toEqual({ success: false, error: 'Could not log in with that email.' })
    })

    it('returns a generic error if no token hash comes back, even without an explicit error', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      generateLink.mockResolvedValue({ data: { properties: {} }, error: null })

      const result = await devInstantLoginAction('alex@example.com')

      expect(result).toEqual({ success: false, error: 'Could not log in with that email.' })
    })
  })
})

describe('checkAuthRateLimitAction', () => {
  beforeEach(() => {
    checkRateLimit.mockReset()
    getCallerIp.mockReset().mockResolvedValue('1.2.3.4')
  })

  it('allows the request when both the IP and email counters are under their limits', async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })

    const result = await checkAuthRateLimitAction('alex@example.com')

    expect(result).toEqual({ allowed: true })
    expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'auth:ip:1.2.3.4', expect.anything())
    expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'auth:email:alex@example.com', expect.anything())
  })

  it('blocks on the IP limit alone, without ever checking the email (none given, e.g. Google sign-in)', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 120 })

    const result = await checkAuthRateLimitAction()

    expect(result).toEqual({
      allowed: false,
      error: 'Too many attempts from this device — please wait a few minutes and try again.',
    })
    expect(checkRateLimit).toHaveBeenCalledTimes(1)
  })

  it('blocks on the email limit even when the IP counter is fine', async () => {
    checkRateLimit.mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 }).mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 300 })

    const result = await checkAuthRateLimitAction('alex@example.com')

    expect(result).toEqual({
      allowed: false,
      error: "You've requested a few of these recently — please wait a few minutes before trying again.",
    })
  })

  it('lowercases and trims the email before using it as a rate-limit key', async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })

    await checkAuthRateLimitAction('  Alex@Example.com  ')

    expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), 'auth:email:alex@example.com', expect.anything())
  })
})
