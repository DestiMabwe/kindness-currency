'use client'

import { useState } from 'react'
import { MessageReplayModal } from './MessageReplayModal'
import { ReminderFrequencyPicker } from './ReminderFrequencyPicker'
import { ctaCopy } from '@/constants/ctaCopy'
import type { ReminderFrequency } from '@/schemas/couponSchema'

export type GiftFloatingActionsProps = {
  setId: string
  senderName: string
  senderMessage: string | null
  initialReminderFrequency: ReminderFrequency | null
}

/**
 * Persistent icon stack on the coupon-reveal page: envelope (only shown if
 * there's a message to re-read) above a reminder bell (always available, so
 * a recipient who dismissed the picker can still change their mind later).
 */
export function GiftFloatingActions({ setId, senderName, senderMessage, initialReminderFrequency }: GiftFloatingActionsProps) {
  const [showMessage, setShowMessage] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [reminderFrequency, setReminderFrequency] = useState(initialReminderFrequency)

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

      {showMessage && senderMessage && (
        <MessageReplayModal senderName={senderName} senderMessage={senderMessage} onClose={() => setShowMessage(false)} />
      )}

      {showReminder && (
        <ReminderFrequencyPicker
          setId={setId}
          currentFrequency={reminderFrequency}
          onClose={(newFrequency) => {
            if (newFrequency !== undefined) setReminderFrequency(newFrequency)
            setShowReminder(false)
          }}
        />
      )}
    </>
  )
}
