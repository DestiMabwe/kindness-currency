import type { SupabaseClient } from '@supabase/supabase-js'
import { FeedbackInputSchema } from '@/schemas/feedbackSchema'

export type SubmitFeedbackResult = { success: true } | { success: false; error: string }
export type FeedbackEntry = { id: string; type: string; message: string; email: string | null; createdAt: string }

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

    /**
     * Every feedback row, newest first, with a real contact email even for
     * logged-in senders who didn't type one — resolved from their account via
     * the Supabase admin API, so the admin always has something to follow up on.
     */
    async getAllFeedback(): Promise<FeedbackEntry[]> {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, type, message, email, user_id, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error

      const rows = data ?? []
      const missingUserIds = [...new Set(rows.filter((row) => !row.email && row.user_id).map((row) => row.user_id as string))]

      const emailByUserId = new Map<string, string>()
      if (missingUserIds.length > 0) {
        const { data: userList, error: userError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        if (userError) throw userError
        for (const user of userList.users) {
          if (user.email) emailByUserId.set(user.id, user.email)
        }
      }

      return rows.map((row) => ({
        id: row.id,
        type: row.type,
        message: row.message,
        email: row.email ?? (row.user_id ? (emailByUserId.get(row.user_id) ?? null) : null),
        createdAt: row.created_at,
      }))
    },
  }
}
