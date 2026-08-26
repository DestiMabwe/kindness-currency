'use server'

import { createCouponSetRepository, type SaveCouponSetResult } from '@/lib/couponSetRepository'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function saveCouponSetAction(input: unknown): Promise<SaveCouponSetResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return createCouponSetRepository(createServiceClient()).saveCouponSet(input, user?.id ?? null)
}

export async function linkSenderAction(setId: string) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return { success: false as const, error: 'Not logged in' }

  return createCouponSetRepository(createServiceClient()).linkSender(setId, user.id)
}
