import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

// TEMPORARY diagnostic for the /give/[id] "templates embed empty" investigation — logs only the
// key's role claim (or format prefix for the newer sb_secret_/sb_publishable_ key style), never
// the key material itself. Remove once the root cause is confirmed.
try {
  const parts = serviceRoleKey.split('.')
  if (parts.length === 3) {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
    console.error('[diag] SUPABASE_SERVICE_ROLE_KEY role claim:', payload.role)
  } else {
    console.error('[diag] SUPABASE_SERVICE_ROLE_KEY prefix:', serviceRoleKey.slice(0, 12))
  }
} catch (e) {
  console.error('[diag] SUPABASE_SERVICE_ROLE_KEY inspection failed', e)
}

/**
 * Privileged, server-only client used for all coupon_sets/coupons/templates
 * reads and writes. Bypasses RLS — never import this from a component file
 * or expose it to the browser. The recipient page has no auth requirement,
 * so this is the only way to read a coupon set for /give/[id].
 */
export function createServiceClient() {
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
