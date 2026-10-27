'use client'

import { useEffect, useState } from 'react'
import { ReminderFrequencyPicker, pendingReminderKey } from './ReminderFrequencyPicker'
import { setReminderFrequencyAction } from '@/app/give/[id]/actions'
import { ctaCopy } from '@/constants/ctaCopy'
import type { ReminderFrequency } from '@/schemas/couponSchema'

export type GiftReminderRowProps = {
  setId: string
  couponCount: number
  initialReminderFrequency: ReminderFrequency | null
  isLoggedIn: boolean
  alreadyLinked: boolean
  linkRecipientAction: (setId: string) => Promise<{ success: boolean }>
  redirectTo: string
}

/**
 * Inline reminder control on the recipient page, under the save banner: invites a reminder when
 * none is set, or shows the current cadence with a way to change it. Lives in the page flow, not
 * floating, so it can never sit over the navbar.
 */
export function GiftReminderRow({
  setId,
  couponCount,
  initialReminderFrequency,
  isLoggedIn,
  alreadyLinked,
  linkRecipientAction,
  redirectTo,
}: GiftReminderRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [frequency, setFrequency] = useState(initialReminderFrequency)

  useEffect(() => {
    if (!isLoggedIn) return
    const pending = window.localStorage.getItem(pendingReminderKey(setId))
    if (!pending) return
    window.localStorage.removeItem(pendingReminderKey(setId))
    const pendingFrequency = pending as ReminderFrequency
    void (async () => {
      if (!alreadyLinked) await linkRecipientAction(setId)
      await setReminderFrequencyAction(setId, pendingFrequency)
      setFrequency(pendingFrequency)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount to finish a reminder choice made before the auth redirect
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="mx-4 mt-2.5 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border border-[#1A1A2E]/8 bg-white px-4 py-3.5 text-left"
      >
        <span aria-hidden="true" className="text-[15px]">
          🔔
        </span>
        <span className="min-w-0 flex-1 text-[13px] text-[#2C2C2C]">
          {frequency ? ctaCopy.giftReminderActive[frequency] : ctaCopy.giftReminderPrompt(couponCount)}
          {frequency ? ' · ' : ' '}
          <span className="font-semibold text-[#1A1A2E] underline underline-offset-2">
            {frequency ? ctaCopy.giftReminderChange : ctaCopy.giftReminderSet}
          </span>
        </span>
      </button>

      {pickerOpen && (
        <ReminderFrequencyPicker
          setId={setId}
          couponCount={couponCount}
          currentFrequency={frequency}
          isLoggedIn={isLoggedIn}
          alreadyLinked={alreadyLinked}
          linkAction={linkRecipientAction}
          redirectTo={redirectTo}
          onClose={(newFrequency) => {
            if (newFrequency !== undefined) setFrequency(newFrequency)
            setPickerOpen(false)
          }}
        />
      )}
    </>
  )
}
