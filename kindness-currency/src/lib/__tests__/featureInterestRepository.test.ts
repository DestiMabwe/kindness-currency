import { describe, it, expect, vi } from 'vitest'
import { createFeatureInterestRepository } from '../featureInterestRepository'

function makeInsertSupabase(resolvedValue: { data: unknown; error: unknown }) {
  const chain = { insert: vi.fn().mockResolvedValue(resolvedValue) }
  const supabase = { from: vi.fn().mockReturnValue(chain) }
  return { supabase, chain }
}

function makeSelectSupabase(resolvedValue: { data: unknown; error: unknown }) {
  const chain = { select: vi.fn().mockResolvedValue(resolvedValue) }
  const supabase = { from: vi.fn().mockReturnValue(chain) }
  return { supabase, chain }
}

describe('FeatureInterestRepository', () => {
  describe('recordInterest', () => {
    it('inserts a row tagged with the given feature, email, and user id', async () => {
      const { supabase, chain } = makeInsertSupabase({ data: null, error: null })
      const repo = createFeatureInterestRepository(supabase as never)

      const result = await repo.recordInterest({ feature: 'custom_coupons', email: 'jamie@example.com' }, 'user-1')

      expect(result).toEqual({ success: true })
      expect(supabase.from).toHaveBeenCalledWith('feature_interest')
      expect(chain.insert).toHaveBeenCalledWith({ feature: 'custom_coupons', email: 'jamie@example.com', user_id: 'user-1' })
    })

    it('records a null user_id for a logged-out signup', async () => {
      const { supabase, chain } = makeInsertSupabase({ data: null, error: null })
      const repo = createFeatureInterestRepository(supabase as never)

      await repo.recordInterest({ feature: 'custom_coupons', email: 'jamie@example.com' }, null)

      expect(chain.insert).toHaveBeenCalledWith({ feature: 'custom_coupons', email: 'jamie@example.com', user_id: null })
    })

    it('rejects an unknown feature slug without inserting (multiple_coupons was retired)', async () => {
      const { supabase, chain } = makeInsertSupabase({ data: null, error: null })
      const repo = createFeatureInterestRepository(supabase as never)

      const result = await repo.recordInterest({ feature: 'multiple_coupons', email: 'jamie@example.com' }, null)

      expect(result.success).toBe(false)
      expect(chain.insert).not.toHaveBeenCalled()
    })

    it('rejects an invalid email without inserting', async () => {
      const { supabase, chain } = makeInsertSupabase({ data: null, error: null })
      const repo = createFeatureInterestRepository(supabase as never)

      const result = await repo.recordInterest({ feature: 'custom_coupons', email: 'not-an-email' }, null)

      expect(result.success).toBe(false)
      expect(chain.insert).not.toHaveBeenCalled()
    })
  })

  describe('getInterestCounts', () => {
    it('counts signups for custom_coupons', async () => {
      const { supabase } = makeSelectSupabase({
        data: [{ feature: 'custom_coupons' }, { feature: 'custom_coupons' }, { feature: 'custom_coupons' }],
        error: null,
      })
      const repo = createFeatureInterestRepository(supabase as never)

      const counts = await repo.getInterestCounts()

      expect(counts).toEqual([{ feature: 'custom_coupons', count: 3 }])
    })

    it('returns zero when there are no signups yet, rather than omitting the row', async () => {
      const { supabase } = makeSelectSupabase({ data: [], error: null })
      const repo = createFeatureInterestRepository(supabase as never)

      const counts = await repo.getInterestCounts()

      expect(counts).toEqual([{ feature: 'custom_coupons', count: 0 }])
    })
  })
})
