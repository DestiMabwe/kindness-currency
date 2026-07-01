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
  })
})
