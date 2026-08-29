import { describe, it, expect } from 'vitest'
import { isReminderDue } from '../reminderEngine'

describe('isReminderDue', () => {
  it('is not due before the biweekly interval has elapsed since opening', () => {
    const due = isReminderDue(
      { frequency: 'biweekly', openedAt: '2026-08-20T00:00:00.000Z', lastSentAt: null, allRedeemed: false },
      new Date('2026-08-25T00:00:00.000Z')
    )

    expect(due).toBe(false)
  })

  it('is due once the biweekly interval has elapsed since opening', () => {
    const due = isReminderDue(
      { frequency: 'biweekly', openedAt: '2026-08-01T00:00:00.000Z', lastSentAt: null, allRedeemed: false },
      new Date('2026-08-25T00:00:00.000Z')
    )

    expect(due).toBe(true)
  })

  it('measures the interval from lastSentAt, not openedAt, once a reminder has already gone out', () => {
    const due = isReminderDue(
      { frequency: 'biweekly', openedAt: '2026-07-01T00:00:00.000Z', lastSentAt: '2026-08-20T00:00:00.000Z', allRedeemed: false },
      new Date('2026-08-25T00:00:00.000Z')
    )

    expect(due).toBe(false)
  })

  it('uses a 30-day interval for monthly', () => {
    const notYetDue = isReminderDue(
      { frequency: 'monthly', openedAt: '2026-08-01T00:00:00.000Z', lastSentAt: null, allRedeemed: false },
      new Date('2026-08-25T00:00:00.000Z')
    )
    const due = isReminderDue(
      { frequency: 'monthly', openedAt: '2026-07-01T00:00:00.000Z', lastSentAt: null, allRedeemed: false },
      new Date('2026-08-25T00:00:00.000Z')
    )

    expect(notYetDue).toBe(false)
    expect(due).toBe(true)
  })

  it('uses a 90-day interval for quarterly', () => {
    const notYetDue = isReminderDue(
      { frequency: 'quarterly', openedAt: '2026-07-01T00:00:00.000Z', lastSentAt: null, allRedeemed: false },
      new Date('2026-08-25T00:00:00.000Z')
    )
    const due = isReminderDue(
      { frequency: 'quarterly', openedAt: '2026-01-01T00:00:00.000Z', lastSentAt: null, allRedeemed: false },
      new Date('2026-08-25T00:00:00.000Z')
    )

    expect(notYetDue).toBe(false)
    expect(due).toBe(true)
  })

  it('is never due once every coupon in the set has been redeemed', () => {
    const due = isReminderDue(
      { frequency: 'biweekly', openedAt: '2026-01-01T00:00:00.000Z', lastSentAt: null, allRedeemed: true },
      new Date('2026-08-25T00:00:00.000Z')
    )

    expect(due).toBe(false)
  })

  it('is not due when there is no opened_at to anchor from', () => {
    const due = isReminderDue(
      { frequency: 'biweekly', openedAt: null, lastSentAt: null, allRedeemed: false },
      new Date('2026-08-25T00:00:00.000Z')
    )

    expect(due).toBe(false)
  })
})
