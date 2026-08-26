'use server'

import { createFeedbackRepository, type SubmitFeedbackResult } from '@/lib/feedbackRepository'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function submitFeedbackAction(input: unknown): Promise<SubmitFeedbackResult> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return createFeedbackRepository(createServiceClient()).submitFeedback(input, user?.id ?? null)
}
