import { describe, it, expect, vi } from 'vitest'
import { runReminderJob } from '../reminderJob'

function makeDeps(due: { setId: string; recipientEmail: string; recipientName: string; senderName: string; frequency: 'biweekly' }[]) {
  const findDueReminders = vi.fn().mockResolvedValue(due)
  const markReminderSent = vi.fn().mockResolvedValue(undefined)
  const send = vi.fn().mockResolvedValue({ success: true })
  return {
    reminderRepository: { findDueReminders, markReminderSent },
    emailSender: { send },
  }
}

const reminder = (overrides = {}) => ({
  setId: 'set-1',
  recipientEmail: 'sam@example.com',
  recipientName: 'Sam',
  senderName: 'Jordan',
  frequency: 'biweekly' as const,
  ...overrides,
})

describe('runReminderJob', () => {
  it('emails and marks each due reminder as sent', async () => {
    const deps = makeDeps([reminder()])
    const now = new Date('2026-08-25T00:00:00.000Z')

    const result = await runReminderJob(deps, now)

    expect(deps.emailSender.send).toHaveBeenCalledWith({ to: 'sam@example.com', recipientName: 'Sam', senderName: 'Jordan' })
    expect(deps.reminderRepository.markReminderSent).toHaveBeenCalledWith('set-1', now.toISOString())
    expect(result).toEqual({ sent: 1, failed: 0 })
  })

  it('does not mark a set as reminded when the send fails', async () => {
    const deps = makeDeps([reminder()])
    deps.emailSender.send.mockResolvedValue({ success: false })

    const result = await runReminderJob(deps, new Date('2026-08-25T00:00:00.000Z'))

    expect(deps.reminderRepository.markReminderSent).not.toHaveBeenCalled()
    expect(result).toEqual({ sent: 0, failed: 1 })
  })

  it('keeps processing the rest of the batch after one send fails', async () => {
    const deps = makeDeps([reminder({ setId: 'set-1', recipientEmail: 'a@example.com' }), reminder({ setId: 'set-2', recipientEmail: 'b@example.com' })])
    deps.emailSender.send.mockResolvedValueOnce({ success: false }).mockResolvedValueOnce({ success: true })

    const result = await runReminderJob(deps, new Date('2026-08-25T00:00:00.000Z'))

    expect(deps.reminderRepository.markReminderSent).toHaveBeenCalledTimes(1)
    expect(deps.reminderRepository.markReminderSent).toHaveBeenCalledWith('set-2', expect.any(String))
    expect(result).toEqual({ sent: 1, failed: 1 })
  })
})
