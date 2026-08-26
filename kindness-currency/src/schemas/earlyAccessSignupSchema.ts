import { z } from 'zod'

// Must stay in sync with the `slug` values seeded into coming_soon_templates
// (supabase/seed.sql). Kept here rather than read from the DB so the schema
// stays synchronous and usable at the validation boundary.
export const COMING_SOON_TEMPLATE_SLUGS = [
  'dads',
  'siblings',
  'made-by-him',
  'made-by-her',
  'long-distance-lovers',
  'meal-coupons',
  'movie-marathon',
  'shopping-spree',
  'travel-buddies',
  'christmas',
] as const

export const EarlyAccessSignupInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  templateSlug: z.enum(COMING_SOON_TEMPLATE_SLUGS),
})

export type EarlyAccessSignupInput = z.infer<typeof EarlyAccessSignupInputSchema>
