import { z } from 'zod'

export const FeatureInterestSlugSchema = z.enum(['custom_coupons'])

export const FeatureInterestInputSchema = z.object({
  feature: FeatureInterestSlugSchema,
  email: z.string().email(),
})

export type FeatureInterestSlug = z.infer<typeof FeatureInterestSlugSchema>
export type FeatureInterestInput = z.infer<typeof FeatureInterestInputSchema>
