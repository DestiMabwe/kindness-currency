import type { SupabaseClient } from '@supabase/supabase-js'

export type Template = {
  id: string
  slug: string
  name: string
  theme: string | null
  color_mood: string | null
  decorative_element: string | null
  emotional_tone: string | null
  is_age_restricted: boolean
  is_active: boolean
  sort_order: number
}

export type TemplateCoupon = {
  id: string
  template_id: string
  sort_order: number
  service_title: string
  micro_copy: string | null
  fine_print: string | null
}

export type TemplateWithCoupons = Template & {
  template_coupons: TemplateCoupon[]
}

export function createTemplateRepository(supabase: SupabaseClient) {
  return {
    async getActiveTemplates(): Promise<Template[]> {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },

    async getTemplateWithCoupons(slug: string): Promise<TemplateWithCoupons | null> {
      const { data, error } = await supabase
        .from('templates')
        .select('*, template_coupons(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error || !data) return null

      return {
        ...data,
        template_coupons: [...data.template_coupons].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      }
    },
  }
}
