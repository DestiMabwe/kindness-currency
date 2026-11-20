// @vitest-environment node
import { describe, it, expect } from 'vitest'
import nextConfig, { securityHeaders } from '../../../next.config'

const headerValue = (key: string) => securityHeaders.find((h) => h.key === key)?.value

describe('security headers', () => {
  it('applies to every route', async () => {
    const rules = (await nextConfig.headers?.()) ?? []

    expect(rules).toEqual([{ source: '/:path*', headers: securityHeaders }])
  })

  it('stops the site being framed or content-sniffed', () => {
    expect(headerValue('X-Frame-Options')).toBe('DENY')
    expect(headerValue('Content-Security-Policy')).toBe("frame-ancestors 'none'")
    expect(headerValue('X-Content-Type-Options')).toBe('nosniff')
  })

  it('keeps the secret /give/[uuid] path out of cross-origin referrers', () => {
    expect(headerValue('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it("doesn't restrict `payment`, which Paystack's iframe checkout needs", () => {
    expect(headerValue('Permissions-Policy')).not.toMatch(/payment/)
  })

  it("doesn't set a script/connect CSP that could break Paystack, Supabase or Google sign-in", () => {
    expect(headerValue('Content-Security-Policy')).not.toMatch(/script-src|connect-src|default-src/)
  })
})
