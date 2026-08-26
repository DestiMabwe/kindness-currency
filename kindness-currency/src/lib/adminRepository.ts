import type { SupabaseClient } from '@supabase/supabase-js'

export type PopularTemplate = { templateId: string; name: string; count: number }

export function createAdminRepository(supabase: SupabaseClient) {
  return {
    /** Every template with its coupon_sets count, most-popular first. Templates with no sets yet still appear, at 0. */
    async getPopularTemplates(): Promise<PopularTemplate[]> {
      const [{ data: templates, error: templatesError }, { data: sets, error: setsError }] = await Promise.all([
        supabase.from('templates').select('id, name'),
        supabase.from('coupon_sets').select('template_id'),
      ])

      if (templatesError) throw templatesError
      if (setsError) throw setsError

      const counts = new Map<string, number>()
      for (const row of sets ?? []) {
        counts.set(row.template_id, (counts.get(row.template_id) ?? 0) + 1)
      }

      return (templates ?? [])
        .map((template) => ({ templateId: template.id, name: template.name, count: counts.get(template.id) ?? 0 }))
        .sort((a, b) => b.count - a.count)
    },
  }
}
