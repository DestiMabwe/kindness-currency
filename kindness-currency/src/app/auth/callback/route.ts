import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/authRedirect'

const DEFAULT_REDIRECT = '/create'

// Supabase redirects the magic link click here with ?code=... The redirect
// target is whatever `emailRedirectTo` AuthGate set (window.location.origin
// at send time), so this is environment-aware without any config. `next`
// carries which page the auth flow was started from — defaults to /create
// for older links (sent before `next` existed) or any caller that omits it.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` is crafted-by-anyone input reflected into a redirect; safeNextPath keeps it on-site.
  const target = safeNextPath(searchParams.get('next'), DEFAULT_REDIRECT)

  if (!code) {
    return NextResponse.redirect(`${origin}${target}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  // A failed exchange (expired/already-used code, or a link opened on a different device than
  // the one that requested it — the PKCE verifier lives in that device's cookies) must not
  // silently land the sender on `target` looking successful while still logged out. /login
  // explains what happened and offers a new code; `next` carries where they were headed.
  if (error) {
    const failureUrl = new URL(`${origin}/login`)
    failureUrl.searchParams.set('authError', '1')
    failureUrl.searchParams.set('next', target)
    return NextResponse.redirect(failureUrl.toString())
  }

  return NextResponse.redirect(`${origin}${target}`)
}
