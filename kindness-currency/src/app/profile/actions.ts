'use server'

import { createCouponSetRepository } from '@/lib/couponSetRepository'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function resetPinAction(setId: string) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return { success: false as const, error: 'Not logged in' }

  return createCouponSetRepository(createServiceClient()).resetPin(setId, user.id)
}
