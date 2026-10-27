'use client'

import type { ReactNode } from 'react'
import { GiftFloatingActions } from './GiftFloatingActions'
import type { ReminderFrequency } from '@/schemas/couponSchema'

export type GiftUnwrapGateProps = {
  setId: string
  senderName: string
  senderMessage: string | null
  accent: string
  /** True once this recipient has loaded the link before — the message only unseals on its own on a first visit. */
  hasVisitedBefore: boolean
  reminderFrequency: ReminderFrequency | null
  isLoggedIn: boolean
  alreadyLinked: boolean
  linkRecipientAction: (setId: string) => Promise<{ success: boolean }>
  redirectTo: string
  children: ReactNode
}

/**
 * The recipient lands straight on the coupons (`children`). On a first visit with a message
 * (hasVisitedBefore is derived from opened_at as read *before* this load set it), the message
 * unseals over them as a popup a few seconds in; afterward it stays re-readable from the
 * floating envelope icon.
 */
export function GiftUnwrapGate({
  setId,
  senderName,
  senderMessage,
  accent,
  hasVisitedBefore,
  reminderFrequency,
  isLoggedIn,
  alreadyLinked,
  linkRecipientAction,
  redirectTo,
  children,
}: GiftUnwrapGateProps) {
  return (
    <div className="kc-rise">
      {children}
      <GiftFloatingActions
        setId={setId}
        senderName={senderName}
        senderMessage={senderMessage}
        accent={accent}
        autoRevealMessage={!hasVisitedBefore}
        initialReminderFrequency={reminderFrequency}
        isLoggedIn={isLoggedIn}
        alreadyLinked={alreadyLinked}
        linkRecipientAction={linkRecipientAction}
        redirectTo={redirectTo}
      />
    </div>
  )
}
