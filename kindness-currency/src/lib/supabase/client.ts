import { createBrowserClient } from '@supabase/ssr'

// Next.js only inlines NEXT_PUBLIC_ vars into the browser bundle for statically
// analyzable `process.env.NEXT_PUBLIC_X` references — a dynamic `process.env[name]`
// lookup (fine in server-only modules) can't be inlined and is undefined at runtime here.
function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
