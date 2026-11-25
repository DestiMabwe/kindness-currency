import { z } from 'zod'

// What a buyer types into the cart's code field. Normalized here, once, so lookup is
// case-insensitive and ignores stray spaces — codes are stored uppercase.
export const DiscountCodeInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .transform((value) => value.toUpperCase())

export const DiscountCodeRowSchema = z.object({
  id: z.string(),
  code: z.string(),
  percent_off: z.number().int().min(1).max(100),
  label: z.string(),
  max_redemptions: z.number().int().positive().nullable(),
  expires_at: z.string().nullable(),
  is_active: z.boolean(),
})

export type DiscountCodeRow = z.infer<typeof DiscountCodeRowSchema>
