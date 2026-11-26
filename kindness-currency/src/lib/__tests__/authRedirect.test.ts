import { describe, it, expect } from 'vitest'
import { safeNextPath, resolveLoginPage, loginHref } from '../authRedirect'

describe('safeNextPath', () => {
  it('keeps a plain on-site path', () => {
    expect(safeNextPath('/cart')).toBe('/cart')
  })

  it('drops the query string and hash so ?reference= or ?authError= are never replayed', () => {
    expect(safeNextPath('/cart/complete?reference=abc&authError=1#top')).toBe('/cart/complete')
  })

  it('still rejects an unsafe path hidden behind a query string', () => {
    expect(safeNextPath('//evil.com?x=1')).toBe('/')
  })

  it.each([
    ['nothing', null],
    ['empty', ''],
    ['an absolute URL', 'https://evil.com'],
    ['a protocol-relative URL', '//evil.com'],
    ['a backslash trick browsers read as //', '/\\evil.com'],
    ['a path without a leading slash', 'cart'],
    ['a scheme', 'javascript:alert(1)'],
    ['a newline', '/cart\n//evil.com'],
  ])('falls back to / for %s', (_label, raw) => {
    expect(safeNextPath(raw)).toBe('/')
  })
})

describe('resolveLoginPage', () => {
  it('sends someone who is already signed in straight to where they were going', () => {
    expect(resolveLoginPage({ loggedIn: true, next: '/cart' })).toEqual({ kind: 'redirect', to: '/cart' })
  })

  it('never redirects a signed-in visitor off-site', () => {
    expect(resolveLoginPage({ loggedIn: true, next: '//evil.com' })).toEqual({ kind: 'redirect', to: '/' })
  })

  it('shows the form for a signed-out visitor, defaulting to Sign Up and the home page', () => {
    expect(resolveLoginPage({ loggedIn: false })).toEqual({ kind: 'form', next: '/', initialMode: 'signup', authFailed: false })
  })

  it('opens on Log In when mode=login is asked for, and ignores any other mode', () => {
    expect(resolveLoginPage({ loggedIn: false, mode: 'login' })).toMatchObject({ initialMode: 'login' })
    expect(resolveLoginPage({ loggedIn: false, mode: 'admin' })).toMatchObject({ initialMode: 'signup' })
  })

  it('flags a failed emailed link only for authError=1, and keeps where they were going', () => {
    expect(resolveLoginPage({ loggedIn: false, authError: '1', next: '/cart' })).toMatchObject({ authFailed: true, next: '/cart' })
    expect(resolveLoginPage({ loggedIn: false, authError: 'yes' })).toMatchObject({ authFailed: false })
  })
})

describe('loginHref', () => {
  it('links to /login and remembers the page to come back to', () => {
    expect(loginHref('/cart')).toBe('/login?next=%2Fcart')
  })

  it('can open on the Log In tab', () => {
    expect(loginHref('/profile', 'login')).toBe('/login?mode=login&next=%2Fprofile')
  })

  it('drops query strings and refuses off-site paths, so the link itself can never be turned into a redirect', () => {
    expect(loginHref('/cart/complete?reference=abc')).toBe('/login?next=%2Fcart%2Fcomplete')
    expect(loginHref('//evil.com')).toBe('/login?next=%2F')
  })
})
