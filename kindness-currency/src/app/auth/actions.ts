'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, getCallerIp, RATE_LIMITS } from '@/lib/rateLimit'

export type DevInstantLoginResult = { success: true; tokenHash: string } | { success: false; error: string }

const GENERIC_ERROR = 'Could not log in with that email.'

export type AuthRateLimitResult = { allowed: true } | { allowed: false; error: string }

/**
 * Pre-check AuthGate calls before ever hitting Supabase's auth API — the sign-in/sign-up OTP and
 * Google OAuth calls go straight from the browser to Supabase (no server code of ours in
 * between), so this is the only interception point we have. Doesn't fully close the door on
 * someone bypassing the UI and calling Supabase directly with the public anon key, but Supabase's
 * own built-in per-email OTP limit already bounds that case; this stops anyone going through the
 * actual app from spamming a magic link to a stranger's inbox or brute-forcing sign-in attempts.
 */
export async function checkAuthRateLimitAction(email?: string): Promise<AuthRateLimitResult> {
  const supabase = createServiceClient()
  const ip = await getCallerIp()

  const ipResult = await checkRateLimit(supabase, `auth:ip:${ip}`, RATE_LIMITS.authByIp)
  if (!ipResult.allowed) {
    return { allowed: false, error: 'Too many attempts from this device — please wait a few minutes and try again.' }
  }

  if (email) {
    const emailResult = await checkRateLimit(supabase, `auth:email:${email.trim().toLowerCase()}`, RATE_LIMITS.authByEmail)
    if (!emailResult.allowed) {
      return { allowed: false, error: "You've requested a few of these recently — please wait a few minutes before trying again." }
    }
  }

  return { allowed: true }
}

/**
 * Demo/dev only: logs an existing user in immediately from just their email,
 * no inbox round trip. Uses the admin API to generate a magic-link token
 * server-side and hands back only the hashed token — the client verifies it
 * via verifyOtp to establish the session. Hard-blocked outside development
 * because it skips proof of email ownership entirely.
 */
export async function devInstantLoginAction(email: string): Promise<DevInstantLoginResult> {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Not available in production.' }
  }

  const trimmed = email.trim()
  if (!trimmed) return { success: false, error: 'Enter an email ♥' }

  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.admin.generateLink({ type: 'magiclink', email: trimmed })

  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) return { success: false, error: GENERIC_ERROR }

  return { success: true, tokenHash }
}
