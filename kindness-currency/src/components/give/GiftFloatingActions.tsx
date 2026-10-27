'use client'

import { useEffect, useState } from 'react'
import { GiftMessageCard } from './GiftMessageCard'
import { ReminderFrequencyPicker, pendingReminderKey } from './ReminderFrequencyPicker'
import { setReminderFrequencyAction } from '@/app/give/[id]/actions'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDelayedMessageReveal } from '@/hooks/useDelayedMessageReveal'
import type { ReminderFrequency } from '@/schemas/couponSchema'

export type GiftFloatingActionsProps = {
  setId: string
  senderName: string
  senderMessage: string | null
  accent: string
  /** First visit with a message: unseal it over the coupons after MESSAGE_REVEAL_DELAY_MS. */
  autoRevealMessage: boolean
  initialReminderFrequency: ReminderFrequency | null
  isLoggedIn: boolean
  alreadyLinked: boolean
  linkRecipientAction: (setId: string) => Promise<{ success: boolean }>
  redirectTo: string
}

const MESSAGE_REVEAL_DELAY_MS = 5000

/**
 * Persistent icon stack on the coupon-reveal page: envelope (only shown if
 * there's a message to re-read) above a reminder bell (always available, so
 * a recipient who dismissed the picker can still change their mind later). Also owns the
 * first-visit message reveal, so the auto-shown card and the envelope's re-read are one dialog.
 */
export function GiftFloatingActions({
  setId,
  senderName,
  senderMessage,
  accent,
  autoRevealMessage,
  initialReminderFrequency,
  isLoggedIn,
  alreadyLinked,
  linkRecipientAction,
  redirectTo,
}: GiftFloatingActionsProps) {
  const [showMessage, setShowMessage] = useState(false)
  const [autoRevealOpen, closeAutoReveal] = useDelayedMessageReveal(autoRevealMessage && !!senderMessage, MESSAGE_REVEAL_DELAY_MS)
  const [showReminder, setShowReminder] = useState(false)
  const [reminderFrequency, setReminderFrequency] = useState(initialReminderFrequency)

  useEffect(() => {
    if (!isLoggedIn) return
    const pending = window.localStorage.getItem(pendingReminderKey(setId))
    if (!pending) return
    window.localStorage.removeItem(pendingReminderKey(setId))
    const frequency = pending as ReminderFrequency
    void (async () => {
      if (!alreadyLinked) await linkRecipientAction(setId)
      await setReminderFrequencyAction(setId, frequency)
      setReminderFrequency(frequency)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount to finish a reminder choice made before the auth redirect
  }, [])

  return (
    <>
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2.5">
        {senderMessage && (
          <button
            type="button"
            onClick={() => setShowMessage(true)}
            aria-label={ctaCopy.giftRereadMessage}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#1A1A2E]/10 bg-white text-lg text-[#1A1A2E]"
          >
            ✉
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowReminder(true)}
          aria-label={ctaCopy.giftReminderButton}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#1A1A2E]/10 bg-white text-lg text-[#1A1A2E]"
        >
          🔔
        </button>
      </div>

      {(autoRevealOpen || showMessage) && senderMessage && (
        <GiftMessageCard
          senderName={senderName}
          senderMessage={senderMessage}
          accent={accent}
          entrance={autoRevealOpen ? 'unseal' : 'rise'}
          onClose={() => {
            closeAutoReveal()
            setShowMessage(false)
          }}
        />
      )}

      {showReminder && (
        <ReminderFrequencyPicker
          setId={setId}
          currentFrequency={reminderFrequency}
          isLoggedIn={isLoggedIn}
          alreadyLinked={alreadyLinked}
          linkAction={linkRecipientAction}
          redirectTo={redirectTo}
          onClose={(newFrequency) => {
            if (newFrequency !== undefined) setReminderFrequency(newFrequency)
            setShowReminder(false)
          }}
        />
      )}
    </>
  )
}
