import { describe, it, expect, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { createRedemptionEngine } from '../redemptionEngine'

function makeSupabase({
  readResult,
  updateResult,
}: {
  readResult: { data: unknown; error: unknown }
  updateResult?: { data: unknown; error: unknown }
}) {
  const readChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(readResult),
  }
  const writeChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(updateResult ?? { data: null, error: null }),
  }
  const from = vi.fn().mockReturnValueOnce(readChain).mockReturnValueOnce(writeChain)
  return { supabase: { from }, readChain, writeChain }
}

const couponRow = (overrides = {}) => ({
  id: 'cccccccc-0000-4000-8000-000000000001',
  status: 'sent',
  redeemed_at: null,
  coupon_sets: { pin_code: 'HASHED', sender_name: 'Jordan' },
  ...overrides,
})

describe('RedemptionEngine', () => {
  describe('PIN verification', () => {
    it('correct PIN redeems the coupon and sets status to redeemed', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      const { supabase, writeChain } = makeSupabase({
        readResult: { data: couponRow(), error: null },
        updateResult: { data: { id: 'cccccccc-0000-4000-8000-000000000001', status: 'redeemed', redeemed_at: '2026-01-01T00:00:00.000Z' }, error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: 'cccccccc-0000-4000-8000-000000000001', pin: '1234' })

      expect(result).toEqual({
        success: true,
        coupon: { id: 'cccccccc-0000-4000-8000-000000000001', status: 'redeemed', redeemedAt: '2026-01-01T00:00:00.000Z' },
      })
      expect(writeChain.update).toHaveBeenCalledWith({ status: 'redeemed', redeemed_at: expect.any(String) })
    })

    it('wrong PIN returns a soft error without changing status', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)
      const { supabase, writeChain } = makeSupabase({ readResult: { data: couponRow(), error: null } })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: 'cccccccc-0000-4000-8000-000000000001', pin: '0000' })

      expect(result).toEqual({
        success: false,
        error: "That PIN doesn't match. Check your message from Jordan.",
      })
      expect(writeChain.update).not.toHaveBeenCalled()
    })
  })

  describe('idempotency', () => {
    it('redeeming an already-redeemed coupon returns success without a second write', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      const { supabase, writeChain } = makeSupabase({
        readResult: { data: couponRow({ status: 'redeemed', redeemed_at: '2026-01-01T00:00:00.000Z' }), error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: 'cccccccc-0000-4000-8000-000000000001', pin: '1234' })

      expect(result).toEqual({
        success: true,
        coupon: { id: 'cccccccc-0000-4000-8000-000000000001', status: 'redeemed', redeemedAt: '2026-01-01T00:00:00.000Z' },
      })
      expect(writeChain.update).not.toHaveBeenCalled()
    })
  })

  describe('Zod validation', () => {
    it('rejects a payload missing required fields before touching the database', async () => {
      const { supabase, readChain } = makeSupabase({ readResult: { data: null, error: null } })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: 'cccccccc-0000-4000-8000-000000000001' })

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
      expect(readChain.select).not.toHaveBeenCalled()
    })

    it('rejects a non-4-digit PIN before touching the database', async () => {
      const { supabase, readChain } = makeSupabase({ readResult: { data: null, error: null } })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: 'cccccccc-0000-4000-8000-000000000001', pin: '12' })

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
      expect(readChain.select).not.toHaveBeenCalled()
    })
  })

  describe('missing coupon', () => {
    it('returns a generic error when the coupon does not exist', async () => {
      const { supabase } = makeSupabase({ readResult: { data: null, error: { message: 'no rows' } } })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: 'dddddddd-0000-4000-8000-000000000001', pin: '1234' })

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
    })
  })
})
