import type { SupabaseClient } from '@supabase/supabase-js'

export function createCampaignBannerRepository(supabase: SupabaseClient) {
  return {
    /** The single active banner for right now, or null if none — the slot then renders nothing. */
    async getActiveBanner(): Promise<{ message: string } | null> {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('campaign_banners')
        .select('message')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ message: string }>()

      if (error || !data) return null
      return data
    },
  }
}
