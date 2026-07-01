import { describe, it, expect, vi } from 'vitest'
import { createGiveRepository, sortCouponsForDisplay } from '../giveRepository'

function makeChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
  }
  const supabase = { from: vi.fn().mockReturnValue(chain) }
  return { supabase, chain }
}

const row = (overrides = {}) => ({
  id: 'set-1',
  sender_name: 'Jordan',
  recipient_name: 'Sam',
  templates: { slug: 'valentines' },
  coupons: [
    {
      id: 'c1',
      sort_order: 2,
      service_title: 'One Massage',
      micro_copy: 'Full focus',
      fine_print: 'Duration negotiable',
      font_choice: 'playfair',
      background_color: '#FFF8F0',
      background_effect: 'none',
      status: 'sent',
    },
    {
      id: 'c2',
      sort_order: 1,
      service_title: 'One Romantic Dinner In',
      micro_copy: 'Candles',
      fine_print: 'Redeemable any evening',
      font_choice: 'playfair',
      background_color: '#FFF8F0',
      background_effect: 'none',
      status: 'sent',
    },
  ],
  ...overrides,
})

describe('GiveRepository', () => {
  describe('getCouponSetForRecipient', () => {
    it('never selects pin_code from coupon_sets', async () => {
      const { supabase, chain } = makeChain({ data: row(), error: null })
      const repo = createGiveRepository(supabase as never)

      await repo.getCouponSetForRecipient('set-1')

      const selectArg = chain.select.mock.calls[0][0] as string
      expect(selectArg).not.toMatch(/pin_code/)
    })

    it('returns coupons sorted by sort_order', async () => {
      const { supabase } = makeChain({ data: row(), error: null })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('set-1')

      expect(result?.coupons.map((c) => c.sort_order)).toEqual([1, 2])
    })

    it('flattens the joined template to its slug', async () => {
      const { supabase } = makeChain({ data: row(), error: null })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('set-1')

      expect(result?.template_slug).toBe('valentines')
    })

    it('returns null for an unknown id', async () => {
      const { supabase } = makeChain({ data: null, error: { code: 'PGRST116', message: 'no rows' } })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('missing')

      expect(result).toBeNull()
    })
  })

  describe('sortCouponsForDisplay', () => {
    it('moves redeemed coupons to the bottom of the stack', () => {
      const input = [
        { sort_order: 1, status: 'redeemed' as const },
        { sort_order: 2, status: 'sent' as const },
        { sort_order: 3, status: 'sent' as const },
      ]

      const result = sortCouponsForDisplay(input)

      expect(result.map((c) => c.sort_order)).toEqual([2, 3, 1])
    })

    it('preserves sort_order among non-redeemed coupons', () => {
      const input = [
        { sort_order: 3, status: 'sent' as const },
        { sort_order: 1, status: 'sent' as const },
        { sort_order: 2, status: 'sent' as const },
      ]

      const result = sortCouponsForDisplay(input)

      expect(result.map((c) => c.sort_order)).toEqual([1, 2, 3])
    })
  })
})
