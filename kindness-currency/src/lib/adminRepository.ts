import type { SupabaseClient } from '@supabase/supabase-js'

export type PopularTemplate = { templateId: string; name: string; count: number }
export type ComingSoonTemplateInterest = { templateSlug: string; name: string; count: number }
export type EarlyAccessSignupEntry = { email: string; name: string; templateName: string; createdAt: string }

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

    /**
     * Early-access signup count per active coming-soon template, most-requested first —
     * lets the admin prioritize which one to build next. Paired ideas (e.g. Made By
     * Him / Made By Her) are counted separately, not combined. Retired (inactive)
     * templates are excluded, since this drives a "build next" decision, not history.
     */
    async getComingSoonTemplateInterest(): Promise<ComingSoonTemplateInterest[]> {
      const [{ data: templates, error: templatesError }, { data: signups, error: signupsError }] = await Promise.all([
        supabase.from('coming_soon_templates').select('slug, name').eq('is_active', true),
        supabase.from('early_access_signups').select('template_slug'),
      ])

      if (templatesError) throw templatesError
      if (signupsError) throw signupsError

      const counts = new Map<string, number>()
      for (const row of signups ?? []) {
        counts.set(row.template_slug, (counts.get(row.template_slug) ?? 0) + 1)
      }

      return (templates ?? [])
        .map((template) => ({ templateSlug: template.slug, name: template.name, count: counts.get(template.slug) ?? 0 }))
        .sort((a, b) => b.count - a.count)
    },

    /** Every coming-soon early-access signup, newest first, with the template's display name, for admin follow-up. */
    async getEarlyAccessSignupList(): Promise<EarlyAccessSignupEntry[]> {
      const [{ data: signups, error: signupsError }, { data: templates, error: templatesError }] = await Promise.all([
        supabase.from('early_access_signups').select('email, name, template_slug, created_at').order('created_at', { ascending: false }),
        supabase.from('coming_soon_templates').select('slug, name'),
      ])

      if (signupsError) throw signupsError
      if (templatesError) throw templatesError

      const nameBySlug = new Map((templates ?? []).map((template) => [template.slug, template.name]))

      return (signups ?? []).map((row) => ({
        email: row.email,
        name: row.name,
        templateName: nameBySlug.get(row.template_slug) ?? row.template_slug,
        createdAt: row.created_at,
      }))
    },
  }
}
