'use client'

import type { ReactNode } from 'react'
import { GiftMessageCard } from './GiftMessageCard'
import { useDelayedMessageReveal } from '@/hooks/useDelayedMessageReveal'

const MESSAGE_REVEAL_DELAY_MS = 5000

export type GiftUnwrapGateProps = {
  senderName: string
  senderMessage: string | null
  accent: string
  /** True once this recipient has loaded the link before — the message only unseals on its own on a first visit. */
  hasVisitedBefore: boolean
  children: ReactNode
}

/**
 * The recipient lands straight on the coupons (`children`). On a first visit with a message
 * (hasVisitedBefore is derived from opened_at as read *before* this load set it), the message
 * unseals over them a few seconds in; afterward it stays re-readable from the letter strip in
 * the hero.
 */
export function GiftUnwrapGate({ senderName, senderMessage, accent, hasVisitedBefore, children }: GiftUnwrapGateProps) {
  const [revealOpen, closeReveal] = useDelayedMessageReveal(!hasVisitedBefore && !!senderMessage, MESSAGE_REVEAL_DELAY_MS)

  return (
    <div className="kc-rise">
      {children}
      {revealOpen && senderMessage && (
        <GiftMessageCard senderName={senderName} senderMessage={senderMessage} accent={accent} entrance="unseal" onClose={closeReveal} />
      )}
    </div>
  )
}
