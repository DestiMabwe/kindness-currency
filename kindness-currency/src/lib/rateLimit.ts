import type { SupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Tunable limits, one place. All windows use the same increment_rate_limit() Postgres RPC
// (supabase/migrations/20260917000001_add_rate_limits.sql); PIN lockout is separate (see
// redemptionEngine.ts's use of the record_pin_attempt RPC instead).
export const RATE_LIMITS = {
  authByIp: { limit: 10, windowSeconds: 10 * 60 },
  authByEmail: { limit: 3, windowSeconds: 10 * 60 },
  checkoutByUser: { limit: 10, windowSeconds: 60 },
  sendByUser: { limit: 20, windowSeconds: 60 * 60 },
  sendByIp: { limit: 5, windowSeconds: 60 * 60 },
} as const

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

/** The caller's IP as Vercel forwards it — used as a rate-limit key wherever no authenticated
 * user is available yet (anonymous sends, auth attempts before login). Server Actions have no
 * request object of their own but can still call headers(), same as getOrigin()/getRegion(). */
export async function getCallerIp(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || headersList.get('x-real-ip') || 'unknown'
}

/** Atomically increments the counter for `key`'s current fixed window and reports whether this
 * call was still within `limit`. Fails open (allowed: true) on an unexpected DB error — a rate
 * limiter that itself takes the app down on a transient DB hiccup is worse than one that
 * occasionally under-limits. */
export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): Promise<RateLimitResult> {
  const { data: count, error } = await supabase.rpc('increment_rate_limit', {
    p_key: key,
    p_window_seconds: windowSeconds,
  })

  if (error || typeof count !== 'number') return { allowed: true, retryAfterSeconds: 0 }

  const allowed = count <= limit
  const nowSeconds = Math.floor(Date.now() / 1000)
  const retryAfterSeconds = allowed ? 0 : windowSeconds - (nowSeconds % windowSeconds)
  return { allowed, retryAfterSeconds }
}
