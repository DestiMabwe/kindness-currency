import type { SupabaseClient } from '@supabase/supabase-js'
import { FeedbackInputSchema } from '@/schemas/feedbackSchema'

export type SubmitFeedbackResult = { success: true } | { success: false; error: string }

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export function createFeedbackRepository(supabase: SupabaseClient) {
  return {
    async submitFeedback(input: unknown, userId: string | null): Promise<SubmitFeedbackResult> {
      const parsed = FeedbackInputSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: GENERIC_ERROR }

      const { error } = await supabase.from('feedback').insert({
        type: parsed.data.type,
        message: parsed.data.message,
        email: parsed.data.email ?? null,
        user_id: userId,
      })

      if (error) return { success: false, error: GENERIC_ERROR }
      return { success: true }
    },
  }
}
