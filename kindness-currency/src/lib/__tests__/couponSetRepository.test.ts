import { describe, it, expect, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { createCouponSetRepository } from '../couponSetRepository'

function makeSupabase({
  template = { slug: 'mothers_day', is_single_use: false },
  templateError = null,
  rpcResult = { data: 'set-1', error: null },
}: {
  template?: { slug: string; is_single_use: boolean } | null
  templateError?: unknown
  rpcResult?: { data: unknown; error: unknown }
} = {}) {
  const templateChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: template, error: templateError }),
  }
  const from = vi.fn().mockReturnValue(templateChain)
  const rpc = vi.fn().mockResolvedValue(rpcResult)
  return { supabase: { from, rpc }, from, rpc, templateChain }
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
      const { supabase, rpc } = makeSupabase()
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), 'user-1', 'sent')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('expected success')
      expect(result.pin).toMatch(/^\d{4}$/)
      expect(result.id).toBe('set-1')

      const rpcArgs = rpc.mock.calls[0][1]
      expect(rpcArgs.p_set.pin_code).not.toBe(result.pin)
      expect(await bcrypt.compare(result.pin, rpcArgs.p_set.pin_code)).toBe(true)
      expect(rpcArgs.p_user_id).toBe('user-1')
    })

    it('saves with a null user_id for an anonymous sender', async () => {
      const { supabase, rpc } = makeSupabase()
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), null, 'draft')

      expect(result.success).toBe(true)
      expect(rpc.mock.calls[0][1].p_user_id).toBeNull()
    })

    it('passes all 8 coupons through to the RPC call', async () => {
      const { supabase, rpc } = makeSupabase()
      const repo = createCouponSetRepository(supabase as never)

      await repo.saveCouponSet(validInput(), 'user-1', 'sent')

      expect(rpc.mock.calls[0][1].p_coupons).toHaveLength(8)
    })

    it('rejects a payload with no coupons before touching the database', async () => {
      const { supabase, from, rpc } = makeSupabase()
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet({ ...validInput(), coupons: [] }, 'user-1', 'sent')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
      expect(from).not.toHaveBeenCalled()
      expect(rpc).not.toHaveBeenCalled()
    })

    it('rejects a payload with more than 8 coupons before touching the database', async () => {
      const { supabase, rpc } = makeSupabase()
      const repo = createCouponSetRepository(supabase as never)

      const extra = { ...validInput().coupons[0], sort_order: 9 }
      const result = await repo.saveCouponSet({ ...validInput(), coupons: [...validInput().coupons, extra] }, 'user-1', 'sent')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
      expect(rpc).not.toHaveBeenCalled()
    })

    it('accepts a single-coupon payload, as a single-use gesture set sends', async () => {
      const { supabase, rpc } = makeSupabase({ template: { slug: 'relief', is_single_use: true } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet({ ...validInput(), coupons: validInput().coupons.slice(0, 1) }, 'user-1', 'draft')

      expect(result.success).toBe(true)
      expect(rpc.mock.calls[0][1].p_coupons).toHaveLength(1)
    })

    it('returns an error if the RPC call fails for a reason other than payment', async () => {
      const { supabase } = makeSupabase({ rpcResult: { data: null, error: { message: 'db error' } } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), 'user-1', 'sent')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
    })

    it('returns paymentRequired when the RPC raises PAYMENT_REQUIRED, without a generic error', async () => {
      const { supabase } = makeSupabase({ rpcResult: { data: null, error: { message: 'PAYMENT_REQUIRED' } } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), 'user-1', 'sent')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('expected failure')
      expect(result.paymentRequired).toBe(true)
    })

    it('returns an error when the template lookup fails', async () => {
      const { supabase } = makeSupabase({ template: null, templateError: { message: 'not found' } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), 'user-1', 'sent')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
    })

    it('persists sender_message through to the RPC call when provided', async () => {
      const { supabase, rpc } = makeSupabase()
      const repo = createCouponSetRepository(supabase as never)

      await repo.saveCouponSet({ ...validInput(), sender_message: 'Thinking of you every day.' }, 'user-1', 'sent')

      expect(rpc.mock.calls[0][1].p_set.sender_message).toBe('Thinking of you every day.')
    })

    it('does not require a sender_message', async () => {
      const { supabase } = makeSupabase()
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.saveCouponSet(validInput(), 'user-1', 'sent')

      expect(result.success).toBe(true)
    })

    describe('requiresPaymentForSend (p_requires_payment passed to the RPC)', () => {
      it('never requires payment for a draft, regardless of template', async () => {
        const { supabase, rpc } = makeSupabase({ template: { slug: 'mothers_day', is_single_use: false } })
        const repo = createCouponSetRepository(supabase as never)

        await repo.saveCouponSet(validInput(), 'user-1', 'draft')

        expect(rpc.mock.calls[0][1].p_requires_payment).toBe(false)
      })

      it('always requires payment when sending a bundle template', async () => {
        const { supabase, rpc } = makeSupabase({ template: { slug: 'mothers_day', is_single_use: false } })
        const repo = createCouponSetRepository(supabase as never)

        await repo.saveCouponSet(validInput(), 'user-1', 'sent')

        expect(rpc.mock.calls[0][1].p_requires_payment).toBe(true)
      })

      it('requires payment when sending a gesture whose base price is nonzero', async () => {
        const { supabase, rpc } = makeSupabase({ template: { slug: 'celebration', is_single_use: true } })
        const repo = createCouponSetRepository(supabase as never)

        await repo.saveCouponSet({ ...validInput(), coupons: validInput().coupons.slice(0, 1) }, 'user-1', 'sent')

        expect(rpc.mock.calls[0][1].p_requires_payment).toBe(true)
      })

      it('does not require payment for a free gesture sent with its unmodified default text', async () => {
        const { supabase, rpc } = makeSupabase({ template: { slug: 'relief', is_single_use: true } })
        const repo = createCouponSetRepository(supabase as never)
        const coupon = {
          service_title: 'Rescue Mission',
          micro_copy: 'Let me take over something for you — you choose what',
          fine_print: "Redeemable whenever it's heavy",
          font_choice: 'playfair' as const,
          background_effect: 'none' as const,
          sort_order: 1,
        }

        await repo.saveCouponSet({ ...validInput(), coupons: [coupon] }, 'user-1', 'sent')

        expect(rpc.mock.calls[0][1].p_requires_payment).toBe(false)
      })

      it('requires payment for a free gesture sent with customized text (the unlock)', async () => {
        const { supabase, rpc } = makeSupabase({ template: { slug: 'relief', is_single_use: true } })
        const repo = createCouponSetRepository(supabase as never)
        const coupon = {
          service_title: 'My Own Title',
          micro_copy: 'Let me take over something for you — you choose what',
          fine_print: "Redeemable whenever it's heavy",
          font_choice: 'playfair' as const,
          background_effect: 'none' as const,
          sort_order: 1,
        }

        await repo.saveCouponSet({ ...validInput(), coupons: [coupon] }, 'user-1', 'sent')

        expect(rpc.mock.calls[0][1].p_requires_payment).toBe(true)
      })
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

  describe('getCouponSetDetailForSender', () => {
    function makeDetailSupabase(resolvedValue: { data: unknown; error: unknown }) {
      const single = vi.fn().mockResolvedValue(resolvedValue)
      const eqUser = vi.fn().mockReturnValue({ single })
      const eqId = vi.fn().mockReturnValue({ eq: eqUser })
      const select = vi.fn().mockReturnValue({ eq: eqId })
      const from = vi.fn().mockReturnValue({ select })
      return { supabase: { from }, eqId, eqUser }
    }

    it('scopes the lookup to both the set id and the owning user', async () => {
      const { supabase, eqId, eqUser } = makeDetailSupabase({ data: null, error: { message: 'not found' } })
      const repo = createCouponSetRepository(supabase as never)

      await repo.getCouponSetDetailForSender('set-1', 'user-1')

      expect(eqId).toHaveBeenCalledWith('id', 'set-1')
      expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('returns null when the set does not exist or is not owned by this user', async () => {
      const { supabase } = makeDetailSupabase({ data: null, error: { message: 'not found' } })
      const repo = createCouponSetRepository(supabase as never)

      expect(await repo.getCouponSetDetailForSender('set-1', 'user-1')).toBeNull()
    })

    it('maps template slug and per-coupon redemption detail, sorted by sort_order', async () => {
      const { supabase } = makeDetailSupabase({
        data: {
          id: 'set-1',
          recipient_name: 'Mom',
          status: 'sent',
          created_at: '2026-08-20T00:00:00Z',
          opened_at: '2026-08-21T00:00:00Z',
          templates: { name: "Mom's Promise Tokens", slug: 'mothers_day' },
          coupons: [
            { id: 'c2', service_title: 'Second', status: 'sent', redeemed_at: null, sort_order: 2 },
            { id: 'c1', service_title: 'First', status: 'redeemed', redeemed_at: '2026-08-22T00:00:00Z', sort_order: 1 },
          ],
        },
        error: null,
      })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.getCouponSetDetailForSender('set-1', 'user-1')

      expect(result?.templateSlug).toBe('mothers_day')
      expect(result?.coupons.map((c) => c.id)).toEqual(['c1', 'c2'])
      expect(result?.coupons[0].redeemed_at).toBe('2026-08-22T00:00:00Z')
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

  describe('resetPin', () => {
    function makeResetPinSupabase(updateResult: { data: unknown; error: unknown }) {
      const single = vi.fn().mockResolvedValue(updateResult)
      const select = vi.fn().mockReturnValue({ single })
      const eqOwner = vi.fn().mockReturnValue({ select })
      const eqId = vi.fn().mockReturnValue({ eq: eqOwner })
      const update = vi.fn().mockReturnValue({ eq: eqId })
      const from = vi.fn().mockReturnValue({ update })
      return { supabase: { from }, update, eqId, eqOwner }
    }

    it('generates a new 4-digit PIN, stores only its bcrypt hash, and returns the plaintext PIN once', async () => {
      const { supabase, update } = makeResetPinSupabase({ data: { id: 'set-1' }, error: null })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.resetPin('set-1', 'user-1')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('expected success')
      expect(result.pin).toMatch(/^\d{4}$/)
      const updatedFields = update.mock.calls[0][0]
      expect(updatedFields.pin_code).not.toBe(result.pin)
      expect(await bcrypt.compare(result.pin, updatedFields.pin_code)).toBe(true)
    })

    it("only updates the set if it belongs to the given user", async () => {
      const { supabase, eqId, eqOwner } = makeResetPinSupabase({ data: { id: 'set-1' }, error: null })
      const repo = createCouponSetRepository(supabase as never)

      await repo.resetPin('set-1', 'user-1')

      expect(eqId).toHaveBeenCalledWith('id', 'set-1')
      expect(eqOwner).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('returns an error result when the set is not owned by the given user', async () => {
      const { supabase } = makeResetPinSupabase({ data: null, error: null })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.resetPin('set-1', 'someone-else')

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
    })

    it('returns an error result if the update fails', async () => {
      const { supabase } = makeResetPinSupabase({ data: null, error: { message: 'db error' } })
      const repo = createCouponSetRepository(supabase as never)

      const result = await repo.resetPin('set-1', 'user-1')

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
