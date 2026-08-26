import { z } from 'zod'

export const FeedbackTypeSchema = z.enum(['bug', 'suggestion', 'question', 'other'])

export const FeedbackInputSchema = z.object({
  type: FeedbackTypeSchema,
  message: z.string().min(1),
  email: z.string().email().optional(),
})

export type FeedbackType = z.infer<typeof FeedbackTypeSchema>
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>

// Single source of truth for display labels — used by both the submission
// form's type picker and the admin dashboard's breakdown/filter.
export const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'question', label: 'Question' },
  { value: 'other', label: 'Other' },
]
