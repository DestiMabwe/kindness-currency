import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'

const exchangeCodeForSession = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ auth: { exchangeCodeForSession: (code: string) => exchangeCodeForSession(code) } }),
}))

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

  it('sends a failed exchange to /login with the error flag and where to go afterwards', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: 'invalid or expired code' } })

    const response = await GET(new Request('https://kindnesscurrency.example/auth/callback?code=stale&next=%2Fcart'))

    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('authError')).toBe('1')
    expect(location.searchParams.get('next')).toBe('/cart')
  })

  it('never redirects off-site, even when next is crafted', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const response = await GET(new Request('https://kindnesscurrency.example/auth/callback?code=abc&next=%2F%5Cevil.com'))

    expect(response.headers.get('location')).toBe('https://kindnesscurrency.example/create')
  })
})
