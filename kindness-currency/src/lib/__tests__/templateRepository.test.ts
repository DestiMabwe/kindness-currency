import { describe, it, expect, vi } from 'vitest'
import { createTemplateRepository } from '../templateRepository'

function makeChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(resolvedValue),
    single: vi.fn().mockResolvedValue(resolvedValue),
  }
  const supabase = { from: vi.fn().mockReturnValue(chain) }
  return { supabase, chain }
}

const activeTemplate = (overrides = {}) => ({
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  slug: 'mothers_day',
  name: "Mom's Promise Tokens",
  theme: 'Promise',
  color_mood: null,
  decorative_element: 'Flower',
  emotional_tone: null,
  is_age_restricted: false,
  is_active: true,
  sort_order: 1,
  ...overrides,
})

describe('TemplateRepository', () => {
  const coupon = (overrides = {}) => ({
    id: 'cccccccc-0000-0000-0000-000000000001',
    template_id: 'aaaaaaaa-0000-0000-0000-000000000001',
    sort_order: 1,
    service_title: 'One Home-Cooked Meal',
    micro_copy: 'Made with extra love',
    fine_print: 'No expiry',
    ...overrides,
  })

  describe('getActiveTemplates', () => {
    it('returns the templates the database provides', async () => {
      const templates = [activeTemplate({ sort_order: 1 }), activeTemplate({ slug: 'valentines', sort_order: 2 })]
      const { supabase } = makeChain({ data: templates, error: null })
      const repo = createTemplateRepository(supabase as never)

      const result = await repo.getActiveTemplates()

      expect(result).toEqual(templates)
    })

    it('filters to active templates only', async () => {
      const { supabase, chain } = makeChain({ data: [], error: null })
      const repo = createTemplateRepository(supabase as never)

      await repo.getActiveTemplates()

      expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('returns an empty array when no templates exist', async () => {
      const { supabase } = makeChain({ data: null, error: null })
      const repo = createTemplateRepository(supabase as never)

      const result = await repo.getActiveTemplates()

      expect(result).toEqual([])
    })
  })

  describe('getTemplateWithCoupons', () => {
    it('returns the template with its coupons for a known slug', async () => {
      const template = {
        ...activeTemplate(),
        template_coupons: [coupon({ sort_order: 1 }), coupon({ sort_order: 2, service_title: 'One Errand Run' })],
      }
      const { supabase } = makeChain({ data: template, error: null })
      const repo = createTemplateRepository(supabase as never)

      const result = await repo.getTemplateWithCoupons('mothers_day')

      expect(result).toEqual(template)
    })

    it('returns null for an unknown slug', async () => {
      const { supabase } = makeChain({ data: null, error: { code: 'PGRST116', message: 'no rows' } })
      const repo = createTemplateRepository(supabase as never)

      const result = await repo.getTemplateWithCoupons('unknown')

      expect(result).toBeNull()
    })

    it('returns coupons sorted by sort_order', async () => {
      const template = {
        ...activeTemplate(),
        template_coupons: [
          coupon({ sort_order: 2, service_title: 'One Errand Run' }),
          coupon({ sort_order: 1, service_title: 'One Home-Cooked Meal' }),
        ],
      }
      const { supabase } = makeChain({ data: template, error: null })
      const repo = createTemplateRepository(supabase as never)

      const result = await repo.getTemplateWithCoupons('mothers_day')

      expect(result?.template_coupons[0]?.sort_order).toBe(1)
      expect(result?.template_coupons[1]?.sort_order).toBe(2)
    })
  })

  describe('getActiveTemplatesWithCoupons', () => {
    it('returns each active template with its coupons sorted by sort_order', async () => {
      const templates = [
        {
          ...activeTemplate({ sort_order: 1 }),
          template_coupons: [coupon({ sort_order: 2 }), coupon({ sort_order: 1, service_title: 'One Errand Run' })],
        },
      ]
      const { supabase, chain } = makeChain({ data: templates, error: null })
      const repo = createTemplateRepository(supabase as never)

      const result = await repo.getActiveTemplatesWithCoupons()

      expect(chain.eq).toHaveBeenCalledWith('is_active', true)
      expect(result[0]?.template_coupons.map((c) => c.sort_order)).toEqual([1, 2])
    })

    it('returns an empty array when no templates exist', async () => {
      const { supabase } = makeChain({ data: null, error: null })
      const repo = createTemplateRepository(supabase as never)

      const result = await repo.getActiveTemplatesWithCoupons()

      expect(result).toEqual([])
    })
  })
})
