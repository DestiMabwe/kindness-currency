import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

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
