import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSafeRedirectPath, GET } from '../route'

const exchangeCodeForSession = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ auth: { exchangeCodeForSession: (code: string) => exchangeCodeForSession(code) } }),
}))

describe('isSafeRedirectPath', () => {
  it('accepts a plain relative path', () => {
    expect(isSafeRedirectPath('/give/set-1')).toBe(true)
  })

  it('accepts the root path', () => {
    expect(isSafeRedirectPath('/')).toBe(true)
  })

  it('rejects null (no next param)', () => {
    expect(isSafeRedirectPath(null)).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isSafeRedirectPath('')).toBe(false)
  })

  it('rejects a protocol-relative path (open-redirect vector)', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false)
  })

  it('rejects an absolute URL to another origin', () => {
    expect(isSafeRedirectPath('https://evil.com')).toBe(false)
  })

  it('rejects a path with no leading slash', () => {
    expect(isSafeRedirectPath('create')).toBe(false)
  })
})

describe('GET', () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset()
  })

  it('redirects to next on a successful code exchange, with no error flag', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const response = await GET(new Request('https://kindnesscurrency.example/auth/callback?code=abc123&next=%2Fgive%2Fset-1'))

    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc123')
    expect(response.headers.get('location')).toBe('https://kindnesscurrency.example/give/set-1')
  })

  it('falls back to /create when next is missing', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const response = await GET(new Request('https://kindnesscurrency.example/auth/callback?code=abc123'))

    expect(response.headers.get('location')).toBe('https://kindnesscurrency.example/create')
  })

  it('redirects straight through when there is no code at all, without touching the client', async () => {
    const response = await GET(new Request('https://kindnesscurrency.example/auth/callback?next=%2Fcreate'))

    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('https://kindnesscurrency.example/create')
  })

  it('flags a failed exchange instead of silently redirecting as if it succeeded', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: 'invalid or expired code' } })

    const response = await GET(new Request('https://kindnesscurrency.example/auth/callback?code=stale&next=%2Fcreate'))

    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/create')
    expect(location.searchParams.get('authError')).toBe('1')
  })
})
