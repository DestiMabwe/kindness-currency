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
  is_single_use: boolean
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
    /** Bundle templates only — see getActiveSingleUseTemplates for the one-coupon gesture templates. */
    async getActiveTemplates(): Promise<Template[]> {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_single_use', false)
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },

    /**
     * The one-coupon "gesture" templates behind the single-use gallery on /create — real DB rows
     * so each has a genuine id for coupon_sets.template_id, distinguished from bundle templates by
     * is_single_use (a boolean, not a template_type TEXT enum — see CLAUDE.md's ban on that).
     * Content (motif, price, message starter) stays in src/lib/singleUseGestures.ts; only the
     * identity (id, slug, name) is needed from here.
     */
    async getActiveSingleUseTemplates(): Promise<Template[]> {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_single_use', true)
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

    /** All active bundle templates with their default coupons, for /create to hold entirely client-side. */
    async getActiveTemplatesWithCoupons(): Promise<TemplateWithCoupons[]> {
      const { data, error } = await supabase
        .from('templates')
        .select('*, template_coupons(*)')
        .eq('is_active', true)
        .eq('is_single_use', false)
        .order('sort_order')

      if (error || !data) return []

      return data.map((template) => ({
        ...template,
        template_coupons: [...template.template_coupons].sort(
          (a: TemplateCoupon, b: TemplateCoupon) => a.sort_order - b.sort_order
        ),
      }))
    },
  }
}
