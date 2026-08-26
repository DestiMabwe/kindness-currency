'use server'

import { createFeatureInterestRepository, type RecordFeatureInterestResult } from '@/lib/featureInterestRepository'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function recordFeatureInterestAction(input: unknown): Promise<RecordFeatureInterestResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return createFeatureInterestRepository(createServiceClient()).recordInterest(input, user?.id ?? null)
}
