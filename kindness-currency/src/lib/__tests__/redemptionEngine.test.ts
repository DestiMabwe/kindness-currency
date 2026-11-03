import { describe, it, expect, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { createRedemptionEngine } from '../redemptionEngine'
import { ctaCopy } from '@/constants/ctaCopy'

const COUPON_ID = 'cccccccc-0000-4000-8000-000000000001'
const OTP_ID = 'oooooooo-0000-4000-8000-000000000001'
const SENDER_ID = 'uuuuuuuu-0000-4000-8000-000000000001'
const OTHER_USER_ID = 'uuuuuuuu-0000-4000-8000-000000000002'
const GENERIC_ERROR = 'Something went wrong. Please try again.'
const FUTURE = () => new Date(Date.now() + 4 * 60 * 1000).toISOString()
const PAST = () => new Date(Date.now() - 60 * 1000).toISOString()

type Op = 'select' | 'update' | 'insert'
type Call = { table: string; op: Op; payload?: unknown; filters: [string, unknown][] }
type Result = { data: unknown; error: unknown }

/** A table-aware fake of the slice of the Supabase query builder the engine uses. Results are
 * keyed by `${table}.${op}`; every query is recorded so tests can assert on what was written. */
function makeSupabase(results: Partial<Record<`${string}.${Op}`, Result>>, rpcResults: Record<string, Result> = {}) {
  const calls: Call[] = []
  const rpc = vi.fn(async (name: string) => rpcResults[name] ?? { data: null, error: null })

  const from = (table: string) => {
    const call: Call = { table, op: 'select', filters: [] }
    calls.push(call)
    const chain: Record<string, unknown> = {
      select: () => chain,
      update: (payload: unknown) => ((call.op = 'update'), (call.payload = payload), chain),
      insert: (payload: unknown) => ((call.op = 'insert'), (call.payload = payload), chain),
      eq: (col: string, val: unknown) => (call.filters.push([col, val]), chain),
      is: (col: string, val: unknown) => (call.filters.push([col, val]), chain),
      order: () => chain,
      limit: () => chain,
      single: () => chain,
      maybeSingle: () => chain,
      then: (resolve: (r: Result) => unknown) =>
        resolve(results[`${table}.${call.op}`] ?? { data: null, error: null }),
    }
    return chain
  }

  return { supabase: { from, rpc }, calls, rpc }
}

const couponRow = (overrides: Record<string, unknown> = {}) => ({
  id: COUPON_ID,
  status: 'sent',
  redeemed_at: null,
  coupon_sets: { id: 'ssssssss-0000-4000-8000-000000000001', user_id: SENDER_ID, recipient_name: 'Maya' },
  ...overrides,
})

const otpRow = (pin: string, overrides: Record<string, unknown> = {}) => ({
  id: OTP_ID,
  pin_hash: bcrypt.hashSync(pin, 4), // low cost: speed only, same algorithm as production
  expires_at: FUTURE(),
  attempts: 0,
  ...overrides,
})

const writesTo = (calls: Call[], table: string, op: Op) => calls.filter((c) => c.table === table && c.op === op)

describe('RedemptionEngine', () => {
  describe('generatePin', () => {
    it('returns a 4-digit PIN with a 5-minute expiry', async () => {
      const { supabase } = makeSupabase({ 'coupons.select': { data: { id: COUPON_ID, status: 'sent' }, error: null } })
      const engine = createRedemptionEngine(supabase as never)

      const before = Date.now()
      const result = await engine.generatePin({ couponId: COUPON_ID })

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.pin).toMatch(/^\d{4}$/)
      const ttl = new Date(result.expiresAt).getTime() - before
      expect(ttl).toBeGreaterThan(4.9 * 60 * 1000)
      expect(ttl).toBeLessThanOrEqual(5 * 60 * 1000 + 1000)
    })

    it('stores only a bcrypt hash of the PIN, never the PIN itself', async () => {
      const { supabase, calls } = makeSupabase({ 'coupons.select': { data: { id: COUPON_ID, status: 'sent' }, error: null } })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.generatePin({ couponId: COUPON_ID })

      expect(result.success).toBe(true)
      if (!result.success) return
      const [insert] = writesTo(calls, 'redemption_otps', 'insert')
      const stored = insert.payload as { coupon_id: string; pin_hash: string; expires_at: string }
      expect(stored.coupon_id).toBe(COUPON_ID)
      expect(stored.pin_hash).not.toContain(result.pin)
      expect(stored.pin_hash).toMatch(/^\$2[aby]\$10\$/) // bcrypt, 10 rounds
      expect(await bcrypt.compare(result.pin, stored.pin_hash)).toBe(true)
    })

    it('retires any live PIN for that coupon before issuing a new one', async () => {
      const { supabase, calls } = makeSupabase({ 'coupons.select': { data: { id: COUPON_ID, status: 'sent' }, error: null } })
      const engine = createRedemptionEngine(supabase as never)

      await engine.generatePin({ couponId: COUPON_ID })

      const otpCalls = calls.filter((c) => c.table === 'redemption_otps')
      expect(otpCalls.map((c) => c.op)).toEqual(['update', 'insert']) // retire first, then insert
      const [retire] = writesTo(calls, 'redemption_otps', 'update')
      expect(retire.payload).toEqual({ consumed_at: expect.any(String) })
      expect(retire.filters).toEqual(expect.arrayContaining([['coupon_id', COUPON_ID], ['consumed_at', null]]))
    })

    it('refuses an already-redeemed coupon with a soft message and writes nothing', async () => {
      const { supabase, calls } = makeSupabase({ 'coupons.select': { data: { id: COUPON_ID, status: 'redeemed' }, error: null } })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.generatePin({ couponId: COUPON_ID })

      expect(result).toEqual({ success: false, error: ctaCopy.pinAlreadyRedeemed })
      expect(calls.filter((c) => c.table === 'redemption_otps')).toHaveLength(0)
    })

    it('rejects a non-uuid couponId before touching the database', async () => {
      const { supabase, calls } = makeSupabase({})
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.generatePin({ couponId: 'not-a-uuid' })

      expect(result).toEqual({ success: false, error: GENERIC_ERROR })
      expect(calls).toHaveLength(0)
    })

    it('returns a generic error when the coupon does not exist', async () => {
      const { supabase } = makeSupabase({ 'coupons.select': { data: null, error: { message: 'no rows' } } })
      const engine = createRedemptionEngine(supabase as never)

      expect(await engine.generatePin({ couponId: COUPON_ID })).toEqual({ success: false, error: GENERIC_ERROR })
    })

    it('returns a soft error if a racing generate already inserted a live PIN', async () => {
      const { supabase } = makeSupabase({
        'coupons.select': { data: { id: COUPON_ID, status: 'sent' }, error: null },
        'redemption_otps.insert': { data: null, error: { code: '23505', message: 'duplicate key' } },
      })
      const engine = createRedemptionEngine(supabase as never)

      expect(await engine.generatePin({ couponId: COUPON_ID })).toEqual({ success: false, error: GENERIC_ERROR })
    })
  })

  describe('redeemCoupon', () => {
    it('correct PIN redeems the coupon and consumes the OTP', async () => {
      const { supabase, calls } = makeSupabase({
        'coupons.select': { data: couponRow(), error: null },
        'redemption_otps.select': { data: otpRow('1234'), error: null },
        'coupons.update': { data: { id: COUPON_ID, status: 'redeemed', redeemed_at: '2026-01-01T00:00:00.000Z' }, error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: COUPON_ID, pin: '1234' }, SENDER_ID)

      expect(result).toEqual({
        success: true,
        coupon: { id: COUPON_ID, status: 'redeemed', redeemedAt: '2026-01-01T00:00:00.000Z' },
      })
      const [couponUpdate] = writesTo(calls, 'coupons', 'update')
      expect(couponUpdate.payload).toEqual({ status: 'redeemed', redeemed_at: expect.any(String) })
      const [otpUpdate] = writesTo(calls, 'redemption_otps', 'update')
      expect(otpUpdate.payload).toEqual({ consumed_at: expect.any(String) })
      expect(otpUpdate.filters).toEqual(expect.arrayContaining([['id', OTP_ID]]))
    })

    it('wrong PIN returns a soft error, records the failure, and does not redeem', async () => {
      const { supabase, calls, rpc } = makeSupabase({
        'coupons.select': { data: couponRow(), error: null },
        'redemption_otps.select': { data: otpRow('1234'), error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: COUPON_ID, pin: '0000' }, SENDER_ID)

      expect(result).toEqual({ success: false, error: ctaCopy.pinWrongError('Maya') })
      expect(rpc).toHaveBeenCalledWith('record_otp_failure', { p_otp_id: OTP_ID })
      expect(writesTo(calls, 'coupons', 'update')).toHaveLength(0)
    })

    it('an expired OTP is rejected without even comparing, same soft error as a wrong PIN', async () => {
      const compareSpy = vi.spyOn(bcrypt, 'compare')
      compareSpy.mockClear()
      const { supabase, calls } = makeSupabase({
        'coupons.select': { data: couponRow(), error: null },
        'redemption_otps.select': { data: otpRow('1234', { expires_at: PAST() }), error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: COUPON_ID, pin: '1234' }, SENDER_ID)

      expect(result).toEqual({ success: false, error: ctaCopy.pinWrongError('Maya') })
      expect(compareSpy).not.toHaveBeenCalled()
      expect(writesTo(calls, 'coupons', 'update')).toHaveLength(0)
    })

    it('no live OTP at all (never generated, or already superseded) returns the same soft error', async () => {
      const { supabase } = makeSupabase({
        'coupons.select': { data: couponRow(), error: null },
        'redemption_otps.select': { data: null, error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      expect(await engine.redeemCoupon({ couponId: COUPON_ID, pin: '1234' }, SENDER_ID)).toEqual({
        success: false,
        error: ctaCopy.pinWrongError('Maya'),
      })
    })

    it('an OTP that already used its 5 attempts is dead, even for the correct PIN', async () => {
      const { supabase, calls } = makeSupabase({
        'coupons.select': { data: couponRow(), error: null },
        'redemption_otps.select': { data: otpRow('1234', { attempts: 5 }), error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: COUPON_ID, pin: '1234' }, SENDER_ID)

      expect(result).toEqual({ success: false, error: ctaCopy.pinWrongError('Maya') })
      expect(writesTo(calls, 'coupons', 'update')).toHaveLength(0)
    })

    it('rejects a signed-in user who does not own the set, with a generic error and no OTP lookup', async () => {
      const { supabase, calls } = makeSupabase({
        'coupons.select': { data: couponRow(), error: null },
        'redemption_otps.select': { data: otpRow('1234'), error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: COUPON_ID, pin: '1234' }, OTHER_USER_ID)

      expect(result).toEqual({ success: false, error: GENERIC_ERROR })
      expect(calls.filter((c) => c.table === 'redemption_otps')).toHaveLength(0)
      expect(writesTo(calls, 'coupons', 'update')).toHaveLength(0)
    })

    it('redeeming an already-redeemed coupon is idempotent: success, no second write', async () => {
      const { supabase, calls } = makeSupabase({
        'coupons.select': { data: couponRow({ status: 'redeemed', redeemed_at: '2026-01-01T00:00:00.000Z' }), error: null },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: COUPON_ID, pin: '1234' }, SENDER_ID)

      expect(result).toEqual({
        success: true,
        coupon: { id: COUPON_ID, status: 'redeemed', redeemedAt: '2026-01-01T00:00:00.000Z' },
      })
      expect(writesTo(calls, 'coupons', 'update')).toHaveLength(0)
    })

    it('losing a race with a concurrent redemption is still a success', async () => {
      const { supabase } = makeSupabase({
        'coupons.select': { data: couponRow(), error: null },
        'redemption_otps.select': { data: otpRow('1234'), error: null },
        'coupons.update': { data: null, error: { message: 'no rows' } },
      })
      const engine = createRedemptionEngine(supabase as never)

      const result = await engine.redeemCoupon({ couponId: COUPON_ID, pin: '1234' }, SENDER_ID)

      expect(result.success).toBe(true)
    })

    it('rejects a payload missing required fields before touching the database', async () => {
      const { supabase, calls } = makeSupabase({})
      const engine = createRedemptionEngine(supabase as never)

      expect(await engine.redeemCoupon({ couponId: COUPON_ID }, SENDER_ID)).toEqual({ success: false, error: GENERIC_ERROR })
      expect(calls).toHaveLength(0)
    })

    it.each(['12', '12345', 'abcd', '12 4'])('rejects the malformed PIN %j before touching the database', async (pin) => {
      const { supabase, calls } = makeSupabase({})
      const engine = createRedemptionEngine(supabase as never)

      expect(await engine.redeemCoupon({ couponId: COUPON_ID, pin }, SENDER_ID)).toEqual({ success: false, error: GENERIC_ERROR })
      expect(calls).toHaveLength(0)
    })

    it('returns a generic error when the coupon does not exist', async () => {
      const { supabase } = makeSupabase({ 'coupons.select': { data: null, error: { message: 'no rows' } } })
      const engine = createRedemptionEngine(supabase as never)

      expect(await engine.redeemCoupon({ couponId: COUPON_ID, pin: '1234' }, SENDER_ID)).toEqual({
        success: false,
        error: GENERIC_ERROR,
      })
    })
  })
})
