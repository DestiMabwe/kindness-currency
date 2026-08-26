import type { SupabaseClient } from '@supabase/supabase-js'
import { FeatureInterestInputSchema, type FeatureInterestSlug } from '@/schemas/featureInterestSchema'

export type RecordFeatureInterestResult = { success: true } | { success: false; error: string }
export type FeatureInterestCount = { feature: FeatureInterestSlug; count: number }
export type FeatureInterestSignup = { email: string; createdAt: string }

const GENERIC_ERROR = 'Something went wrong. Please try again.'
const KNOWN_FEATURES: FeatureInterestSlug[] = ['custom_coupons']

export function createFeatureInterestRepository(supabase: SupabaseClient) {
  return {
    async recordInterest(input: unknown, userId: string | null): Promise<RecordFeatureInterestResult> {
      const parsed = FeatureInterestInputSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: GENERIC_ERROR }

      const { error } = await supabase.from('feature_interest').insert({
        feature: parsed.data.feature,
        email: parsed.data.email,
        user_id: userId,
      })

      if (error) return { success: false, error: GENERIC_ERROR }
      return { success: true }
    },

    /** Signup counts per feature, zero-filled for any feature with no rows yet. */
    async getInterestCounts(): Promise<FeatureInterestCount[]> {
      const { data, error } = await supabase.from('feature_interest').select('feature')
      if (error) throw error

      const counts = new Map<string, number>(KNOWN_FEATURES.map((feature) => [feature, 0]))
      for (const row of data ?? []) {
        counts.set(row.feature, (counts.get(row.feature) ?? 0) + 1)
      }

      return KNOWN_FEATURES.map((feature) => ({ feature, count: counts.get(feature) ?? 0 }))
    },

    /** Every Custom Coupon Book waitlist signup, newest first, for admin follow-up. */
    async getAllSignups(): Promise<FeatureInterestSignup[]> {
      const { data, error } = await supabase
        .from('feature_interest')
        .select('email, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error

      return (data ?? []).map((row) => ({ email: row.email, createdAt: row.created_at }))
    },
  }
}
