'use server'

import { createRedemptionEngine } from '@/lib/redemptionEngine'
import { createCouponSetRepository } from '@/lib/couponSetRepository'
import { createGiveRepository } from '@/lib/giveRepository'
import { checkRateLimit, getCallerIp, RATE_LIMITS } from '@/lib/rateLimit'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { GeneratePinInputSchema, ReminderFrequencySchema } from '@/schemas/couponSchema'
import { ctaCopy } from '@/constants/ctaCopy'

/** Recipient taps "Generate Redemption PIN" — no login, so it's rate limited per coupon and per
 * IP. The sender confirms the PIN on their own tracking page (see profile/actions.ts). */
export async function generatePinAction(couponId: string) {
  const supabase = createServiceClient()

  const byCoupon = await checkRateLimit(supabase, `pin:coupon:${couponId}`, RATE_LIMITS.generatePinByCoupon)
  if (!byCoupon.allowed) return { success: false, error: ctaCopy.pinRateLimited } as const

  const byIp = await checkRateLimit(supabase, `pin:ip:${await getCallerIp()}`, RATE_LIMITS.generatePinByIp)
  if (!byIp.allowed) return { success: false, error: ctaCopy.pinRateLimited } as const

  return createRedemptionEngine(supabase).generatePin({ couponId })
}

/** Polled by the recipient's PIN screen while a PIN is showing, to notice the sender's confirmation. */
export async function getCouponStatusAction(couponId: string) {
  const parsed = GeneratePinInputSchema.safeParse({ couponId })
  if (!parsed.success) return null
  return createGiveRepository(createServiceClient()).getCouponStatus(parsed.data.couponId)
}

export async function linkRecipientAction(setId: string) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return { success: false, error: 'Not logged in' } as const

  return createCouponSetRepository(createServiceClient()).linkRecipient(setId, user.id)
}

export async function setReminderFrequencyAction(setId: string, frequency: unknown) {
  const parsed = frequency === null ? { success: true as const, data: null } : ReminderFrequencySchema.safeParse(frequency)
  if (!parsed.success) return { success: false as const }

  return createGiveRepository(createServiceClient()).setReminderFrequency(setId, parsed.data)
}
