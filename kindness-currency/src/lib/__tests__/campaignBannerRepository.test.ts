import { describe, it, expect, vi } from 'vitest'
import { createCampaignBannerRepository } from '../campaignBannerRepository'

function makeChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
  }
  const supabase = { from: vi.fn().mockReturnValue(chain) }
  return { supabase, chain }
}

describe('CampaignBannerRepository', () => {
  describe('getActiveBanner', () => {
    it('returns the active banner message', async () => {
      const { supabase, chain } = makeChain({ data: { message: 'Stand a chance to win a cash prize 🎉' }, error: null })
      const repo = createCampaignBannerRepository(supabase as never)

      const result = await repo.getActiveBanner()

      expect(result).toEqual({ message: 'Stand a chance to win a cash prize 🎉' })
      expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('returns null when no banner is currently active', async () => {
      const { supabase } = makeChain({ data: null, error: null })
      const repo = createCampaignBannerRepository(supabase as never)

      const result = await repo.getActiveBanner()

      expect(result).toBeNull()
    })
  })
})
