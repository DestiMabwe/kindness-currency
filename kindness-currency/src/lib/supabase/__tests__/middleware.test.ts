import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { updateSession } from '../middleware'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

type CookieToSet = Parameters<SetAllCookies>[0]

// Simulates what Supabase's real client does: while checking the session inside
// getUser(), if the access token needs refreshing it invokes the `setAll` cookie
// callback we handed it. `refreshedCookies`, when given, reproduces that.
function mockSupabaseClient(refreshedCookies?: CookieToSet) {
  let capturedSetAll: SetAllCookies | undefined
  const getUser = vi.fn().mockImplementation(async () => {
    if (refreshedCookies) capturedSetAll?.(refreshedCookies, {})
    return { data: { user: null }, error: null }
  })
  vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
    capturedSetAll = options?.cookies?.setAll
    return { auth: { getUser } } as never
  })
  return { getUser }
}

describe('updateSession', () => {
  beforeEach(() => {
    vi.mocked(createServerClient).mockReset()
  })

  it('returns a response for a plain request', async () => {
    mockSupabaseClient()
    const request = new NextRequest('http://localhost:3000/')

    const response = await updateSession(request)

    expect(response).toBeInstanceOf(Response)
  })

  it('carries a refreshed cookie through to the response when Supabase refreshes the session', async () => {
    mockSupabaseClient([
      { name: 'sb-access-token', value: 'new-refreshed-token', options: { path: '/' } },
    ])
    const request = new NextRequest('http://localhost:3000/')

    const response = await updateSession(request)

    expect(response.cookies.get('sb-access-token')?.value).toBe('new-refreshed-token')
  })

  it('passes the request through untouched when nothing needs refreshing', async () => {
    mockSupabaseClient()
    const request = new NextRequest('http://localhost:3000/give/abc123')

    const response = await updateSession(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.cookies.getAll()).toHaveLength(0)
  })
})
