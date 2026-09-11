import { describe, it, expect, vi, afterEach } from 'vitest'
import { devInstantLoginAction } from '../actions'

const generateLink = vi.fn()
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ auth: { admin: { generateLink: (input: unknown) => generateLink(input) } } }),
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
