import { describe, it, expect, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { createCouponSetRepository } from '../couponSetRepository'

function makeSupabase({
  setResult,
  couponsResult,
}: {
  setResult: { data: unknown; error: unknown }
  couponsResult?: { data: unknown; error: unknown }
}) {
  const setChain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(setResult),
  }
  const couponsChain = {
    insert: vi.fn().mockResolvedValue(couponsResult ?? { data: null, error: null }),
  }
  const from = vi.fn().mockReturnValueOnce(setChain).mockReturnValueOnce(couponsChain)
  return { supabase: { from }, setChain, couponsChain }
}

const validInput = () => ({
  template_id: 'aaaaaaaa-0000-4000-8000-000000000001',
  sender_name: 'Alex',
  recipient_name: 'Mom',
  coupons: Array.from({ length: 8 }, (_, i) => ({
    service_title: `Coupon ${i + 1}`,
    micro_copy: 'A warm line',
    fine_print: 'Fine print',
    font_choice: 'playfair' as const,
    background_color: '#FFF8F0',
    background_effect: 'none' as const,
    sort_order: i + 1,
  })),
})

describe('CouponSetRepository', () => {
  describe('saveCouponSet', () => {
    it('generates a 4-digit PIN, stores only its bcrypt hash, and returns the plaintext PIN once', async () => {
      const { supabase, setChain } = makeSupabase({
        setResult: { data: { id: 'set-1' }, error: null },
        couponsResult: { data: null, error: null },
      })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), 'user-1')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('expected success')
      expect(result.pin).toMatch(/^\d{4}$/)
      expect(result.id).toBe('set-1')

      const insertedSet = setChain.insert.mock.calls[0][0]
      expect(insertedSet.pin_code).not.toBe(result.pin)
      expect(await bcrypt.compare(result.pin, insertedSet.pin_code)).toBe(true)
      expect(insertedSet.user_id).toBe('user-1')
    })

    it('saves with a null user_id for an anonymous sender', async () => {
      const { supabase, setChain } = makeSupabase({
        setResult: { data: { id: 'set-1' }, error: null },
        couponsResult: { data: null, error: null },
      })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), null)

      expect(result.success).toBe(true)
      const insertedSet = setChain.insert.mock.calls[0][0]
      expect(insertedSet.user_id).toBeNull()
    })

    it('inserts all 8 coupons tied to the new set id', async () => {
      const { supabase, couponsChain } = makeSupabase({
        setResult: { data: { id: 'set-1' }, error: null },
        couponsResult: { data: null, error: null },
      })
      const repo = createCouponSetRepository(supabase as never)

      await repo.saveCouponSet(validInput(), 'user-1')

      const insertedCoupons = couponsChain.insert.mock.calls[0][0]
      expect(insertedCoupons).toHaveLength(8)
      expect(insertedCoupons.every((c: { set_id: string }) => c.set_id === 'set-1')).toBe(true)
    })

    it('rejects a payload without exactly 8 coupons before touching the database', async () => {
      const { supabase, setChain } = makeSupabase({ setResult: { data: null, error: null } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet({ ...validInput(), coupons: validInput().coupons.slice(0, 3) }, 'user-1')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
      expect(setChain.insert).not.toHaveBeenCalled()
    })

    it('returns an error if the coupon_sets insert fails', async () => {
      const { supabase } = makeSupabase({ setResult: { data: null, error: { message: 'db error' } } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), 'user-1')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
    })

    it('persists sender_message through to the insert when provided', async () => {
      const { supabase, setChain } = makeSupabase({
        setResult: { data: { id: 'set-1' }, error: null },
        couponsResult: { data: null, error: null },
      })
      const repo = createCouponSetRepository(supabase as never)

      await repo.saveCouponSet({ ...validInput(), sender_message: 'Thinking of you every day.' }, 'user-1')

      expect(setChain.insert.mock.calls[0][0].sender_message).toBe('Thinking of you every day.')
    })

    it('does not require a sender_message', async () => {
      const { supabase } = makeSupabase({
        setResult: { data: { id: 'set-1' }, error: null },
        couponsResult: { data: null, error: null },
      })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), 'user-1')

      expect(result.success).toBe(true)
    })
  })

  describe('getCouponSetsForUser', () => {
    function makeSentSupabase(resolvedValue: { data: unknown; error: unknown }) {
      const order = vi.fn().mockResolvedValue(resolvedValue)
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })
      return { supabase: { from }, eq }
    }

    it('includes opened_at so the sender status badge can be derived', async () => {
      const { supabase } = makeSentSupabase({
        data: [
          {
            id: 'set-1',
            recipient_name: 'Mom',
            status: 'sent',
            created_at: '2026-08-20T00:00:00Z',
            opened_at: '2026-08-21T00:00:00Z',
            templates: { name: "Mom's Promise Tokens" },
            coupons: [{ id: 'c1', status: 'sent' }],
          },
        ],
        error: null,
      })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.getCouponSetsForUser('user-1')

      expect(result[0].openedAt).toBe('2026-08-21T00:00:00Z')
    })

    it('returns a null openedAt for a set that has never been opened', async () => {
      const { supabase } = makeSentSupabase({
        data: [
          {
            id: 'set-1',
            recipient_name: 'Mom',
            status: 'sent',
            created_at: '2026-08-20T00:00:00Z',
            opened_at: null,
            templates: { name: "Mom's Promise Tokens" },
            coupons: [{ id: 'c1', status: 'sent' }],
          },
        ],
        error: null,
      })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.getCouponSetsForUser('user-1')

      expect(result[0].openedAt).toBeNull()
    })
  })

  describe('linkRecipient', () => {
    function makeLinkSupabase(updateResult: { error: unknown }) {
      const eq = vi.fn().mockResolvedValue(updateResult)
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })
      return { supabase: { from }, update, eq }
    }

    it("sets the coupon set's recipient_user_id to the given user", async () => {
      const { supabase, update, eq } = makeLinkSupabase({ error: null })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.linkRecipient('set-1', 'recipient-user-1')

      expect(result).toEqual({ success: true })
      expect(update).toHaveBeenCalledWith({ recipient_user_id: 'recipient-user-1' })
      expect(eq).toHaveBeenCalledWith('id', 'set-1')
    })

    it('succeeds again, unchanged, when called a second time for the same user', async () => {
      const { supabase } = makeLinkSupabase({ error: null })
      const repo = createCouponSetRepository(supabase as never)

      await repo.linkRecipient('set-1', 'recipient-user-1')
      const secondResult = await repo.linkRecipient('set-1', 'recipient-user-1')

      expect(secondResult).toEqual({ success: true })
    })

    it('returns an error result if the update fails', async () => {
      const { supabase } = makeLinkSupabase({ error: { message: 'db error' } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.linkRecipient('set-1', 'recipient-user-1')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
    })
  })

  describe('linkSender', () => {
    function makeLinkSenderSupabase(updateResult: { error: unknown }) {
      const is = vi.fn().mockResolvedValue(updateResult)
      const eq = vi.fn().mockReturnValue({ is })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })
      return { supabase: { from }, update, eq, is }
    }

    it("sets the coupon set's user_id to the given user, only where it was still null", async () => {
      const { supabase, update, eq, is } = makeLinkSenderSupabase({ error: null })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.linkSender('set-1', 'sender-user-1')

      expect(result).toEqual({ success: true })
      expect(update).toHaveBeenCalledWith({ user_id: 'sender-user-1' })
      expect(eq).toHaveBeenCalledWith('id', 'set-1')
      expect(is).toHaveBeenCalledWith('user_id', null)
    })

    it('returns an error result if the update fails', async () => {
      const { supabase } = makeLinkSenderSupabase({ error: { message: 'db error' } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.linkSender('set-1', 'sender-user-1')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
    })
  })

  describe('getCouponSetsForRecipient', () => {
    function makeReceivedSupabase(resolvedValue: { data: unknown; error: unknown }) {
      const order = vi.fn().mockResolvedValue(resolvedValue)
      const eq = vi.fn().mockReturnValue({ order })
      const select = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ select })
      return { supabase: { from }, from, eq }
    }

    it('queries by recipient_user_id, not user_id', async () => {
      const { supabase, from, eq } = makeReceivedSupabase({ data: [], error: null })
      const repo = createCouponSetRepository(supabase as never)

      await repo.getCouponSetsForRecipient('user-1')

      expect(from).toHaveBeenCalledWith('coupon_sets')
      expect(eq).toHaveBeenCalledWith('recipient_user_id', 'user-1')
    })

    it('returns each set with the sender name, template name, and coupon statuses', async () => {
      const { supabase } = makeReceivedSupabase({
        data: [
          {
            id: 'set-1',
            sender_name: 'Jordan',
            status: 'sent',
            created_at: '2026-08-20T00:00:00Z',
            templates: { name: "Valentine's Love Passes" },
            coupons: [
              { id: 'c1', status: 'redeemed' },
              { id: 'c2', status: 'sent' },
            ],
          },
        ],
        error: null,
      })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.getCouponSetsForRecipient('user-1')

      expect(result).toEqual([
        {
          id: 'set-1',
          sender_name: 'Jordan',
          status: 'sent',
          created_at: '2026-08-20T00:00:00Z',
          templateName: "Valentine's Love Passes",
          coupons: [
            { id: 'c1', status: 'redeemed' },
            { id: 'c2', status: 'sent' },
          ],
        },
      ])
    })

    it('returns an empty list when nothing has been received yet', async () => {
      const { supabase } = makeReceivedSupabase({ data: [], error: null })
      const repo = createCouponSetRepository(supabase as never)

      expect(await repo.getCouponSetsForRecipient('user-1')).toEqual([])
    })
  })
})
