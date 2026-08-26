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
  expiry_date: '2026-12-25',
  recipient_user_id: null,
  sender_message: null,
  opened_at: null,
  reminder_frequency: null,
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

    it('returns the expiry date so the recipient page can show it', async () => {
      const { supabase } = makeChain({ data: row(), error: null })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('set-1')

      expect(result?.expiry_date).toBe('2026-12-25')
    })

    it('returns the recipient_user_id so the page can tell if this viewer already linked it', async () => {
      const { supabase } = makeChain({ data: row({ recipient_user_id: 'user-1' }), error: null })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('set-1')

      expect(result?.recipient_user_id).toBe('user-1')
    })

    it('returns null for an unknown id', async () => {
      const { supabase } = makeChain({ data: null, error: { code: 'PGRST116', message: 'no rows' } })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('missing')

      expect(result).toBeNull()
    })

    it('returns the sender_message when one was written', async () => {
      const { supabase } = makeChain({ data: row({ sender_message: 'Thinking of you every day.' }), error: null })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('set-1')

      expect(result?.sender_message).toBe('Thinking of you every day.')
    })

    it('returns a null sender_message when none was written', async () => {
      const { supabase } = makeChain({ data: row(), error: null })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('set-1')

      expect(result?.sender_message).toBeNull()
    })

    it('returns the reminder_frequency when one was chosen', async () => {
      const { supabase } = makeChain({ data: row({ reminder_frequency: 'monthly' }), error: null })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.getCouponSetForRecipient('set-1')

      expect(result?.reminder_frequency).toBe('monthly')
    })
  })

  describe('setReminderFrequency', () => {
    function makeSetReminderSupabase(resolvedValue: { data: unknown; error: unknown }) {
      const eq = vi.fn().mockResolvedValue(resolvedValue)
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })
      return { supabase: { from }, update, eq }
    }

    it('stores the chosen frequency for the set', async () => {
      const { supabase, update, eq } = makeSetReminderSupabase({ data: null, error: null })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.setReminderFrequency('set-1', 'quarterly')

      expect(update).toHaveBeenCalledWith({ reminder_frequency: 'quarterly' })
      expect(eq).toHaveBeenCalledWith('id', 'set-1')
      expect(result).toEqual({ success: true })
    })

    it('clears the frequency when passed null', async () => {
      const { supabase, update } = makeSetReminderSupabase({ data: null, error: null })
      const repo = createGiveRepository(supabase as never)

      await repo.setReminderFrequency('set-1', null)

      expect(update).toHaveBeenCalledWith({ reminder_frequency: null })
    })

    it('returns failure when the update errors', async () => {
      const { supabase } = makeSetReminderSupabase({ data: null, error: { message: 'boom' } })
      const repo = createGiveRepository(supabase as never)

      const result = await repo.setReminderFrequency('set-1', 'monthly')

      expect(result).toEqual({ success: false })
    })
  })

  describe('markOpened', () => {
    function makeMarkOpenedSupabase() {
      const is = vi.fn().mockResolvedValue({ data: null, error: null })
      const eq = vi.fn().mockReturnValue({ is })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })
      return { supabase: { from }, update, eq, is }
    }

    it('sets opened_at to now for the given set', async () => {
      const { supabase, update, eq, is } = makeMarkOpenedSupabase()
      const repo = createGiveRepository(supabase as never)

      await repo.markOpened('set-1')

      expect(update).toHaveBeenCalledWith(expect.objectContaining({ opened_at: expect.any(String) }))
      expect(eq).toHaveBeenCalledWith('id', 'set-1')
      expect(is).toHaveBeenCalledWith('opened_at', null)
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
