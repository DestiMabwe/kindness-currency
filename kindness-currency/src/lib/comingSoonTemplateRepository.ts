import type { SupabaseClient } from '@supabase/supabase-js'

export type ComingSoonTemplate = {
  id: string
  slug: string
  name: string
  blurb_points: string[]
  cover_image_path: string
  is_active: boolean
  sort_order: number
}

export function createComingSoonTemplateRepository(supabase: SupabaseClient) {
  return {
    async getActiveComingSoonTemplates(): Promise<ComingSoonTemplate[]> {
      const { data, error } = await supabase
        .from('coming_soon_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
  }
}
