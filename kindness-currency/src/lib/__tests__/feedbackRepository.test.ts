import { describe, it, expect, vi } from 'vitest'
import { createFeedbackRepository } from '../feedbackRepository'

function makeSupabase(resolvedValue: { data: unknown; error: unknown }) {
  const chain = { insert: vi.fn().mockResolvedValue(resolvedValue) }
  const supabase = { from: vi.fn().mockReturnValue(chain) }
  return { supabase, chain }
}

describe('FeedbackRepository', () => {
  describe('submitFeedback', () => {
    it('persists the type through to the feedback table', async () => {
      const { supabase, chain } = makeSupabase({ data: null, error: null })
      const repo = createFeedbackRepository(supabase as never)

      const result = await repo.submitFeedback({ type: 'bug', message: 'It crashed' }, null)

      expect(result).toEqual({ success: true })
      expect(chain.insert).toHaveBeenCalledWith({ type: 'bug', message: 'It crashed', email: null, user_id: null })
    })

    it('accepts each of the four valid types', async () => {
      for (const type of ['bug', 'suggestion', 'question', 'other']) {
        const { supabase, chain } = makeSupabase({ data: null, error: null })
        const repo = createFeedbackRepository(supabase as never)

        const result = await repo.submitFeedback({ type, message: 'Some feedback' }, null)

        expect(result).toEqual({ success: true })
        expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ type }))
      }
    })

    it('rejects a missing type without inserting', async () => {
      const { supabase, chain } = makeSupabase({ data: null, error: null })
      const repo = createFeedbackRepository(supabase as never)

      const result = await repo.submitFeedback({ message: 'It crashed' }, null)

      expect(result.success).toBe(false)
      expect(chain.insert).not.toHaveBeenCalled()
    })

    it('rejects an invalid type without inserting', async () => {
      const { supabase, chain } = makeSupabase({ data: null, error: null })
      const repo = createFeedbackRepository(supabase as never)

      const result = await repo.submitFeedback({ type: 'complaint', message: 'It crashed' }, null)

      expect(result.success).toBe(false)
      expect(chain.insert).not.toHaveBeenCalled()
    })

    it('rejects an empty message without inserting', async () => {
      const { supabase, chain } = makeSupabase({ data: null, error: null })
      const repo = createFeedbackRepository(supabase as never)

      const result = await repo.submitFeedback({ type: 'bug', message: '' }, null)

      expect(result.success).toBe(false)
      expect(chain.insert).not.toHaveBeenCalled()
    })
  })
})
