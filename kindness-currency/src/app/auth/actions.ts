'use server'

import { createServiceClient } from '@/lib/supabase/service'

export type DevInstantLoginResult = { success: true; tokenHash: string } | { success: false; error: string }

const GENERIC_ERROR = 'Could not log in with that email.'

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
