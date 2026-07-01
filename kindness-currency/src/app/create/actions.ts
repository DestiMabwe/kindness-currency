'use server'

import { createCouponSetRepository, type SaveCouponSetResult } from '@/lib/couponSetRepository'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function saveCouponSetAction(input: unknown): Promise<SaveCouponSetResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return { success: false, error: 'Please verify your email first.' }

  return createCouponSetRepository(createServiceClient()).saveCouponSet(input, user.id)
}
