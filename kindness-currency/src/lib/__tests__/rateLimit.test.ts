import { describe, it, expect, vi } from 'vitest'

const headersGet = vi.fn()
vi.mock('next/headers', () => ({ headers: () => Promise.resolve({ get: (name: string) => headersGet(name) }) }))

function fakeSupabase(rpcResult: { data: unknown; error: unknown }) {
  return { rpc: vi.fn().mockResolvedValue(rpcResult) } as never
}

describe('checkRateLimit', () => {
  it('allows a count at or under the limit', async () => {
    const { checkRateLimit } = await import('../rateLimit')

    const result = await checkRateLimit(fakeSupabase({ data: 3, error: null }), 'k', { limit: 3, windowSeconds: 60 })

    expect(result.allowed).toBe(true)
  })

  it('denies a count over the limit and reports a positive retryAfterSeconds', async () => {
    const { checkRateLimit } = await import('../rateLimit')

    const result = await checkRateLimit(fakeSupabase({ data: 4, error: null }), 'k', { limit: 3, windowSeconds: 60 })

    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60)
  })

  it('fails open on an unexpected DB error rather than blocking everyone', async () => {
    const { checkRateLimit } = await import('../rateLimit')

    const result = await checkRateLimit(fakeSupabase({ data: null, error: { message: 'db down' } }), 'k', { limit: 3, windowSeconds: 60 })

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 })
  })
})

describe('getCallerIp', () => {
  it('takes the first address from a comma-separated x-forwarded-for header', async () => {
    headersGet.mockImplementation((name: string) => (name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null))
    const { getCallerIp } = await import('../rateLimit')

    expect(await getCallerIp()).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', async () => {
    headersGet.mockImplementation((name: string) => (name === 'x-real-ip' ? '9.9.9.9' : null))
    const { getCallerIp } = await import('../rateLimit')

    expect(await getCallerIp()).toBe('9.9.9.9')
  })

  it('falls back to "unknown" when neither header is present (e.g. local dev)', async () => {
    headersGet.mockReturnValue(null)
    const { getCallerIp } = await import('../rateLimit')

    expect(await getCallerIp()).toBe('unknown')
  })
})
