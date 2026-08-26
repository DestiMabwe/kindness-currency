import { describe, it, expect, vi } from 'vitest'
import { createAdminRepository } from '../adminRepository'

function makeSupabase({
  templates,
  sets,
}: {
  templates: { id: string; name: string }[]
  sets: { template_id: string }[]
}) {
  const from = vi.fn((table: string) => {
    if (table === 'templates') return { select: vi.fn().mockResolvedValue({ data: templates, error: null }) }
    if (table === 'coupon_sets') return { select: vi.fn().mockResolvedValue({ data: sets, error: null }) }
    throw new Error(`unexpected table: ${table}`)
  })
  return { from }
}

function makeComingSoonSupabase({
  comingSoonTemplates,
  signups,
}: {
  comingSoonTemplates: { slug: string; name: string }[]
  signups: { template_slug: string }[]
}) {
  const eq = vi.fn().mockResolvedValue({ data: comingSoonTemplates, error: null })
  const from = vi.fn((table: string) => {
    if (table === 'coming_soon_templates') return { select: vi.fn().mockReturnValue({ eq }) }
    if (table === 'early_access_signups') return { select: vi.fn().mockResolvedValue({ data: signups, error: null }) }
    throw new Error(`unexpected table: ${table}`)
  })
  return { from, eq }
}

describe('AdminRepository', () => {
  describe('getPopularTemplates', () => {
    it('counts coupon_sets per template, most-popular first', async () => {
      const supabase = makeSupabase({
        templates: [
          { id: 't1', name: "Mom's Promise Tokens" },
          { id: 't2', name: "Valentine's Love Passes" },
        ],
        sets: [{ template_id: 't2' }, { template_id: 't1' }, { template_id: 't2' }, { template_id: 't2' }],
      })
      const repo = createAdminRepository(supabase as never)

      const result = await repo.getPopularTemplates()

      expect(result).toEqual([
        { templateId: 't2', name: "Valentine's Love Passes", count: 3 },
        { templateId: 't1', name: "Mom's Promise Tokens", count: 1 },
      ])
    })

    it('still lists a template with zero coupon sets, rather than omitting it', async () => {
      const supabase = makeSupabase({
        templates: [
          { id: 't1', name: "Mom's Promise Tokens" },
          { id: 't2', name: "Bestie's Surprise Passes" },
        ],
        sets: [{ template_id: 't1' }],
      })
      const repo = createAdminRepository(supabase as never)

      const result = await repo.getPopularTemplates()

      expect(result).toEqual([
        { templateId: 't1', name: "Mom's Promise Tokens", count: 1 },
        { templateId: 't2', name: "Bestie's Surprise Passes", count: 0 },
      ])
    })
  })

  describe('getComingSoonTemplateInterest', () => {
    it('only queries active coming-soon templates', async () => {
      const supabase = makeComingSoonSupabase({ comingSoonTemplates: [], signups: [] })
      const repo = createAdminRepository(supabase as never)

      await repo.getComingSoonTemplateInterest()

      expect(supabase.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('counts early-access signups per template, most-requested first', async () => {
      const supabase = makeComingSoonSupabase({
        comingSoonTemplates: [
          { slug: 'dads', name: "Dad's Promise Tokens" },
          { slug: 'siblings', name: 'Sibling Adventure Tokens' },
        ],
        signups: [{ template_slug: 'siblings' }, { template_slug: 'dads' }, { template_slug: 'siblings' }],
      })
      const repo = createAdminRepository(supabase as never)

      const result = await repo.getComingSoonTemplateInterest()

      expect(result).toEqual([
        { templateSlug: 'siblings', name: 'Sibling Adventure Tokens', count: 2 },
        { templateSlug: 'dads', name: "Dad's Promise Tokens", count: 1 },
      ])
    })

    it('still lists a template with zero signups, rather than omitting it', async () => {
      const supabase = makeComingSoonSupabase({
        comingSoonTemplates: [
          { slug: 'dads', name: "Dad's Promise Tokens" },
          { slug: 'christmas', name: 'Christmas Joy Tokens' },
        ],
        signups: [{ template_slug: 'dads' }],
      })
      const repo = createAdminRepository(supabase as never)

      const result = await repo.getComingSoonTemplateInterest()

      expect(result).toEqual([
        { templateSlug: 'dads', name: "Dad's Promise Tokens", count: 1 },
        { templateSlug: 'christmas', name: 'Christmas Joy Tokens', count: 0 },
      ])
    })

    it('counts a paired idea (Made By Him / Made By Her) separately, not combined', async () => {
      const supabase = makeComingSoonSupabase({
        comingSoonTemplates: [
          { slug: 'made-by-him', name: "Made By Him: Lover's Promises" },
          { slug: 'made-by-her', name: "Made By Her: Lover's Promises" },
        ],
        signups: [
          { template_slug: 'made-by-him' },
          { template_slug: 'made-by-him' },
          { template_slug: 'made-by-him' },
          { template_slug: 'made-by-her' },
        ],
      })
      const repo = createAdminRepository(supabase as never)

      const result = await repo.getComingSoonTemplateInterest()

      expect(result).toEqual([
        { templateSlug: 'made-by-him', name: "Made By Him: Lover's Promises", count: 3 },
        { templateSlug: 'made-by-her', name: "Made By Her: Lover's Promises", count: 1 },
      ])
    })
  })
})
