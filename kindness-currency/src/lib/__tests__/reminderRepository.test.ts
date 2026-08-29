import { describe, it, expect, vi } from 'vitest'
import { createReminderRepository } from '../reminderRepository'

function makeChain({
  rows,
  users = [],
}: {
  rows: unknown[]
  users?: { id: string; email: string }[]
}) {
  const not2 = vi.fn().mockResolvedValue({ data: rows, error: null })
  const not1 = vi.fn().mockReturnValue({ not: not2 })
  const select = vi.fn().mockReturnValue({ not: not1 })
  const from = vi.fn().mockReturnValue({ select })
  const listUsers = vi.fn().mockResolvedValue({ data: { users }, error: null })
  const supabase = { from, auth: { admin: { listUsers } } }
  return { supabase, from, select, not1, not2, listUsers }
}

const row = (overrides = {}) => ({
  id: 'set-1',
  sender_name: 'Jordan',
  recipient_name: 'Sam',
  recipient_user_id: 'user-1',
  opened_at: '2026-08-01T00:00:00.000Z',
  reminder_frequency: 'biweekly',
  reminder_last_sent_at: null,
  coupons: [{ status: 'sent' }],
  ...overrides,
})

describe('ReminderRepository', () => {
  describe('findDueReminders', () => {
    it('includes a due set with a resolvable recipient email', async () => {
      const { supabase } = makeChain({ rows: [row()], users: [{ id: 'user-1', email: 'sam@example.com' }] })
      const repo = createReminderRepository(supabase as never)

      const result = await repo.findDueReminders(new Date('2026-08-25T00:00:00.000Z'))

      expect(result).toEqual([
        { setId: 'set-1', recipientEmail: 'sam@example.com', recipientName: 'Sam', senderName: 'Jordan', frequency: 'biweekly' },
      ])
    })

    it('scopes the query to sets with a chosen frequency and a linked recipient', async () => {
      const { supabase, not1, not2 } = makeChain({ rows: [] })
      const repo = createReminderRepository(supabase as never)

      await repo.findDueReminders(new Date('2026-08-25T00:00:00.000Z'))

      expect(not1).toHaveBeenCalledWith('reminder_frequency', 'is', null)
      expect(not2).toHaveBeenCalledWith('recipient_user_id', 'is', null)
    })

    it('excludes a set whose reminder interval has not elapsed yet', async () => {
      const { supabase } = makeChain({
        rows: [row({ opened_at: '2026-08-24T00:00:00.000Z' })],
        users: [{ id: 'user-1', email: 'sam@example.com' }],
      })
      const repo = createReminderRepository(supabase as never)

      const result = await repo.findDueReminders(new Date('2026-08-25T00:00:00.000Z'))

      expect(result).toEqual([])
    })

    it('excludes a set where every coupon has already been redeemed', async () => {
      const { supabase } = makeChain({
        rows: [row({ coupons: [{ status: 'redeemed' }] })],
        users: [{ id: 'user-1', email: 'sam@example.com' }],
      })
      const repo = createReminderRepository(supabase as never)

      const result = await repo.findDueReminders(new Date('2026-08-25T00:00:00.000Z'))

      expect(result).toEqual([])
    })

    it('skips a due set whose recipient email cannot be resolved', async () => {
      const { supabase } = makeChain({ rows: [row()], users: [] })
      const repo = createReminderRepository(supabase as never)

      const result = await repo.findDueReminders(new Date('2026-08-25T00:00:00.000Z'))

      expect(result).toEqual([])
    })

    it('does not call the admin API when no set is due', async () => {
      const { supabase, listUsers } = makeChain({ rows: [row({ opened_at: '2026-08-24T00:00:00.000Z' })] })
      const repo = createReminderRepository(supabase as never)

      await repo.findDueReminders(new Date('2026-08-25T00:00:00.000Z'))

      expect(listUsers).not.toHaveBeenCalled()
    })
  })

  describe('markReminderSent', () => {
    it('stamps reminder_last_sent_at for the given set', async () => {
      const eq = vi.fn().mockResolvedValue({ data: null, error: null })
      const update = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ update })
      const repo = createReminderRepository({ from } as never)

      await repo.markReminderSent('set-1', '2026-08-25T00:00:00.000Z')

      expect(update).toHaveBeenCalledWith({ reminder_last_sent_at: '2026-08-25T00:00:00.000Z' })
      expect(eq).toHaveBeenCalledWith('id', 'set-1')
    })
  })
})
