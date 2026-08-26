import { describe, it, expect, vi } from 'vitest'
import { createEarlyAccessSignupRepository } from '../earlyAccessSignupRepository'

function makeSupabase(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    insert: vi.fn().mockResolvedValue(resolvedValue),
  }
  const supabase = { from: vi.fn().mockReturnValue(chain) }
  return { supabase, chain }
}

const validInput = () => ({
  email: 'friend@example.com',
  name: 'Jamie',
  templateSlug: 'made-by-him',
})

describe('EarlyAccessSignupRepository', () => {
  describe('signUpForEarlyAccess', () => {
    it('inserts a signup row for valid input', async () => {
      const { supabase, chain } = makeSupabase({ data: null, error: null })
      const repo = createEarlyAccessSignupRepository(supabase as never)

      const result = await repo.signUpForEarlyAccess(validInput())

      expect(result).toEqual({ success: true, alreadySignedUp: false })
      expect(supabase.from).toHaveBeenCalledWith('early_access_signups')
      expect(chain.insert).toHaveBeenCalledWith({
        email: 'friend@example.com',
        name: 'Jamie',
        template_slug: 'made-by-him',
      })
    })

    it('rejects an invalid email without touching the database', async () => {
      const { supabase, chain } = makeSupabase({ data: null, error: null })
      const repo = createEarlyAccessSignupRepository(supabase as never)

      const result = await repo.signUpForEarlyAccess({ ...validInput(), email: 'not-an-email' })

      expect(result.success).toBe(false)
      expect(chain.insert).not.toHaveBeenCalled()
    })

    it('rejects an unknown template slug', async () => {
      const { chain, supabase } = makeSupabase({ data: null, error: null })
      const repo = createEarlyAccessSignupRepository(supabase as never)

      const result = await repo.signUpForEarlyAccess({ ...validInput(), templateSlug: 'not-a-real-template' })

      expect(result.success).toBe(false)
      expect(chain.insert).not.toHaveBeenCalled()
    })

    it('rejects an empty name', async () => {
      const { chain, supabase } = makeSupabase({ data: null, error: null })
      const repo = createEarlyAccessSignupRepository(supabase as never)

      const result = await repo.signUpForEarlyAccess({ ...validInput(), name: '' })

      expect(result.success).toBe(false)
      expect(chain.insert).not.toHaveBeenCalled()
    })

    it('treats a duplicate email+template signup as a friendly success, not an error', async () => {
      const { supabase } = makeSupabase({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      })
      const repo = createEarlyAccessSignupRepository(supabase as never)

      const result = await repo.signUpForEarlyAccess(validInput())

      expect(result).toEqual({ success: true, alreadySignedUp: true })
    })

    it('returns a generic error for unexpected database failures', async () => {
      const { supabase } = makeSupabase({ data: null, error: { code: '500', message: 'connection reset' } })
      const repo = createEarlyAccessSignupRepository(supabase as never)

      const result = await repo.signUpForEarlyAccess(validInput())

      expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' })
    })
  })
})
