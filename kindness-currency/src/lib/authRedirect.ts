// `next` comes from a URL anyone can craft, then ends up in a redirect — so only a plain on-site
// path is ever returned. Everything else collapses to the fallback.
const ON_SITE_PATH = /^\/(?![/\\])[^\\\s]*$/

export function safeNextPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback
  // Query and hash are dropped on purpose: state like ?reference= or ?authError= must not be replayed.
  const path = raw.split(/[?#]/, 1)[0]
  return ON_SITE_PATH.test(path) ? path : fallback
}

export type LoginPageParams = {
  loggedIn: boolean
  next?: string | null
  mode?: string | null
  authError?: string | null
}

export type LoginPagePlan =
  | { kind: 'redirect'; to: string }
  | { kind: 'form'; next: string; initialMode: 'signup' | 'login'; authFailed: boolean }

// What /login should do for a given visit — kept out of the page so it can be tested directly.
export function resolveLoginPage({ loggedIn, next, mode, authError }: LoginPageParams): LoginPagePlan {
  const safeNext = safeNextPath(next)
  if (loggedIn) return { kind: 'redirect', to: safeNext }
  return {
    kind: 'form',
    next: safeNext,
    initialMode: mode === 'login' ? 'login' : 'signup',
    authFailed: authError === '1',
  }
}

// Every "log in / sign up" button is a link built here, so `next` is always sanitised the same way.
export function loginHref(currentPath: string, mode?: 'login' | 'signup'): string {
  const params = new URLSearchParams()
  if (mode) params.set('mode', mode)
  params.set('next', safeNextPath(currentPath))
  return `/login?${params.toString()}`
}
