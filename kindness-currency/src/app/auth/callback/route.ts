import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase redirects the magic link click here with ?code=... The redirect
// target is whatever `emailRedirectTo` AuthGate set (window.location.origin
// at send time), so this is environment-aware without any config.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/create`)
}
