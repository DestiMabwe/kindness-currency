import { describe, it, expect, vi } from 'vitest'
import { createFeedbackRepository } from '../feedbackRepository'

function makeSupabase(resolvedValue: { data: unknown; error: unknown }) {
  const chain = { insert: vi.fn().mockResolvedValue(resolvedValue) }
  const supabase = { from: vi.fn().mockReturnValue(chain) }
  return { supabase, chain }
}

function makeFeedbackListSupabase({
  rows,
  users = [],
}: {
  rows: { id: string; type: string; message: string; email: string | null; user_id: string | null; created_at: string }[]
  users?: { id: string; email: string }[]
}) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null })
  const listUsers = vi.fn().mockResolvedValue({ data: { users }, error: null })
  const supabase = {
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ order }) }),
    auth: { admin: { listUsers } },
  }
  return { supabase, listUsers }
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

  describe('getAllFeedback', () => {
    it('uses the row email as-is when present, without resolving via auth admin', async () => {
      const { supabase, listUsers } = makeFeedbackListSupabase({
        rows: [
          { id: 'f1', type: 'bug', message: 'It crashed', email: 'jamie@example.com', user_id: null, created_at: '2026-08-20T00:00:00Z' },
        ],
      })
      const repo = createFeedbackRepository(supabase as never)

      const result = await repo.getAllFeedback()

      expect(result).toEqual([
        { id: 'f1', type: 'bug', message: 'It crashed', email: 'jamie@example.com', createdAt: '2026-08-20T00:00:00Z' },
      ])
      expect(listUsers).not.toHaveBeenCalled()
    })

    it("resolves a logged-in sender's email from their account when the row has none", async () => {
      const { supabase, listUsers } = makeFeedbackListSupabase({
        rows: [{ id: 'f1', type: 'suggestion', message: 'Add dark mode', email: null, user_id: 'user-1', created_at: '2026-08-20T00:00:00Z' }],
        users: [{ id: 'user-1', email: 'alex@example.com' }],
      })
      const repo = createFeedbackRepository(supabase as never)

      const result = await repo.getAllFeedback()

      expect(result[0].email).toBe('alex@example.com')
      expect(listUsers).toHaveBeenCalledOnce()
    })

    it('returns a null email when there is neither a stored email nor a resolvable account', async () => {
      const { supabase } = makeFeedbackListSupabase({
        rows: [{ id: 'f1', type: 'other', message: 'Hi', email: null, user_id: 'deleted-user', created_at: '2026-08-20T00:00:00Z' }],
        users: [],
      })
      const repo = createFeedbackRepository(supabase as never)

      const result = await repo.getAllFeedback()

      expect(result[0].email).toBeNull()
    })
  })
})
