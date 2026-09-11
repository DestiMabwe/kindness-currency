import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_REDIRECT = '/create'

// Only ever redirect to a same-origin relative path — `next` is caller-supplied
// (via AuthGate's redirectTo) and reflected straight into this URL, so a bare
// path check keeps it from being turned into an open redirect.
export function isSafeRedirectPath(path: string | null): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//')
}

// Supabase redirects the magic link click here with ?code=... The redirect
// target is whatever `emailRedirectTo` AuthGate set (window.location.origin
// at send time), so this is environment-aware without any config. `next`
// carries which page the auth flow was started from — defaults to /create
// for older links (sent before `next` existed) or any caller that omits it.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const target = isSafeRedirectPath(next) ? next : DEFAULT_REDIRECT

  if (!code) {
    return NextResponse.redirect(`${origin}${target}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  // A failed exchange (expired/already-used code, or a link opened on a different device than
  // the one that requested it — the PKCE verifier lives in that device's cookies) must not
  // silently land the sender on `target` looking successful while actually still logged out.
  // The `authError` flag lets the destination page tell them the link didn't work and offer a
  // real retry, instead of the void CouponSetBuilder used to redirect them into.
  if (error) {
    const failureUrl = new URL(`${origin}${target}`)
    failureUrl.searchParams.set('authError', '1')
    return NextResponse.redirect(failureUrl.toString())
  }

  return NextResponse.redirect(`${origin}${target}`)
}
