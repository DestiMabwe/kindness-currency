import type { SupabaseClient } from '@supabase/supabase-js'
import { EarlyAccessSignupInputSchema } from '@/schemas/earlyAccessSignupSchema'

export type SignUpForEarlyAccessResult =
  | { success: true; alreadySignedUp: false }
  | { success: true; alreadySignedUp: true }
  | { success: false; error: string }

const GENERIC_ERROR = 'Something went wrong. Please try again.'
const UNIQUE_VIOLATION = '23505'

export function createEarlyAccessSignupRepository(supabase: SupabaseClient) {
  return {
    async signUpForEarlyAccess(input: unknown): Promise<SignUpForEarlyAccessResult> {
      const parsed = EarlyAccessSignupInputSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: GENERIC_ERROR }

      const { error } = await supabase.from('early_access_signups').insert({
        email: parsed.data.email,
        name: parsed.data.name,
        template_slug: parsed.data.templateSlug,
      })

      if (error) {
        if (error.code === UNIQUE_VIOLATION) return { success: true, alreadySignedUp: true }
        return { success: false, error: GENERIC_ERROR }
      }

      return { success: true, alreadySignedUp: false }
    },
  }
}
