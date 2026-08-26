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
})
