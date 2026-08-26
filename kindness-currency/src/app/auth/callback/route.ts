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

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${isSafeRedirectPath(next) ? next : DEFAULT_REDIRECT}`)
}
