import { z } from 'zod'

export const FeedbackTypeSchema = z.enum(['bug', 'suggestion', 'question', 'other'])

export const FeedbackInputSchema = z.object({
  type: FeedbackTypeSchema,
  message: z.string().min(1),
  email: z.string().email().optional(),
})

export type FeedbackType = z.infer<typeof FeedbackTypeSchema>
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>
