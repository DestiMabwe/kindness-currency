import type { ReminderFrequency } from '@/schemas/couponSchema'

const INTERVAL_DAYS: Record<ReminderFrequency, number> = {
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
}

export type ReminderDueInput = {
  frequency: ReminderFrequency
  openedAt: string | null
  lastSentAt: string | null
  allRedeemed: boolean
}

/**
 * A reminder is due once the chosen cadence has elapsed since the last
 * reminder (or since the gift was opened, if none has been sent yet).
 */
export function isReminderDue(input: ReminderDueInput, now: Date): boolean {
  if (input.allRedeemed) return false

  const anchor = input.lastSentAt ?? input.openedAt
  if (!anchor) return false

  const elapsedMs = now.getTime() - new Date(anchor).getTime()
  const intervalMs = INTERVAL_DAYS[input.frequency] * 24 * 60 * 60 * 1000
  return elapsedMs >= intervalMs
}
