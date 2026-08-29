'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { setReminderFrequencyAction } from '@/app/give/[id]/actions'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'
import type { ReminderFrequency } from '@/schemas/couponSchema'

const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

/** setId-scoped so GiftFloatingActions can auto-complete this choice once the recipient returns from the auth redirect. */
export const pendingReminderKey = (setId: string) => `kindness-currency:pending-reminder:${setId}`

export type ReminderFrequencyPickerProps = {
  setId: string
  currentFrequency: ReminderFrequency | null
  isLoggedIn: boolean
  alreadyLinked: boolean
  /** Claims setId for the current account — linkRecipientAction. */
  linkAction: (setId: string) => Promise<{ success: boolean }>
  /** Where the auth redirect should land the viewer back, to resume the pending choice. */
  redirectTo: string
  /** Called with the new value on a choice, or no argument if dismissed without changing anything. */
  onClose: (newFrequency?: ReminderFrequency | null) => void
}

const OPTIONS: { value: ReminderFrequency | null; label: string }[] = [
  { value: 'biweekly', label: ctaCopy.giftReminderBiweekly },
  { value: 'monthly', label: ctaCopy.giftReminderMonthly },
  { value: 'quarterly', label: ctaCopy.giftReminderQuarterly },
  { value: null, label: ctaCopy.giftReminderOff },
]

export function ReminderFrequencyPicker({
  setId,
  currentFrequency,
  isLoggedIn,
  alreadyLinked,
  linkAction,
  redirectTo,
  onClose,
}: ReminderFrequencyPickerProps) {
  const [saving, setSaving] = useState<ReminderFrequency | null | 'idle'>('idle')
  const [authOpen, setAuthOpen] = useState(false)
  const dialogRef = useDialogA11y<HTMLDivElement>(true, () => onClose())

  const choose = async (value: ReminderFrequency | null) => {
    // Turning reminders off never needs an account — only an active cadence does, since that's the only case we'd ever need to email them.
    if (value !== null && !isLoggedIn) {
      window.localStorage.setItem(pendingReminderKey(setId), value)
      setAuthOpen(true)
      return
    }

    setSaving(value)
    if (value !== null && !alreadyLinked) {
      await linkAction(setId)
    }
    await setReminderFrequencyAction(setId, value)
    onClose(value)
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-picker-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#FFF8F0] px-6 pt-6.5 pb-7.5"
      >
        <h2
          id="reminder-picker-heading"
          className="text-[21px] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {ctaCopy.giftReminderHeading}
        </h2>
        <div className="mt-2 text-[12.5px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.giftReminderSubtext}</div>
        <div className="mt-4.5 flex flex-col gap-2.5">
          {OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => choose(option.value)}
              disabled={saving !== 'idle'}
              className="w-full rounded-2xl border-[1.5px] bg-white p-3.5 text-left font-sans text-[14.5px] font-semibold disabled:opacity-60"
              style={{
                borderColor: currentFrequency === option.value ? '#C2185B' : 'rgba(26,26,46,0.14)',
                color: currentFrequency === option.value ? '#C2185B' : '#1A1A2E',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onClose()} className="mt-3.5 w-full p-1.5 text-[13.5px] font-semibold text-[#2C2C2C] opacity-70">
          Not now
        </button>
      </div>

      {authOpen && <AuthGate redirectTo={redirectTo} onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
