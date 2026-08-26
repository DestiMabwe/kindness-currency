'use client'

import { useState, type ReactNode } from 'react'
import { GiftFloatingActions } from './GiftFloatingActions'
import { GiftMessageScreen, GiftInstructionsScreen } from './GiftIntroScreens'
import type { ReminderFrequency } from '@/schemas/couponSchema'

export type GiftUnwrapGateProps = {
  setId: string
  senderName: string
  senderMessage: string | null
  accent: string
  /** True once this recipient has loaded the link before — the whole intro is first-visit only. */
  hasVisitedBefore: boolean
  reminderFrequency: ReminderFrequency | null
  children: ReactNode
}

type Step = 'message' | 'instructions' | 'revealed'

/**
 * Message screen → tap "Continue" → how-it-works screen → tap "Open Your
 * Coupons" → reveal. Both intro steps are first-visit only (gated by
 * hasVisitedBefore, derived from opened_at as read *before* this load set
 * it) — repeat visits skip straight to `children` (today's existing
 * hero+coupon page, unchanged). The message stays reachable afterward via
 * the floating envelope icon rendered alongside the reveal.
 */
export function GiftUnwrapGate({
  setId,
  senderName,
  senderMessage,
  accent,
  hasVisitedBefore,
  reminderFrequency,
  children,
}: GiftUnwrapGateProps) {
  const [step, setStep] = useState<Step>(() => {
    if (hasVisitedBefore) return 'revealed'
    return senderMessage ? 'message' : 'instructions'
  })

  if (step === 'message') {
    return (
      <GiftMessageScreen
        senderName={senderName}
        senderMessage={senderMessage ?? ''}
        accent={accent}
        onContinue={() => setStep('instructions')}
      />
    )
  }

  if (step === 'instructions') {
    return <GiftInstructionsScreen senderName={senderName} accent={accent} onContinue={() => setStep('revealed')} />
  }

  return (
    <div className="kc-rise">
      {children}
      <GiftFloatingActions
        setId={setId}
        senderName={senderName}
        senderMessage={senderMessage}
        initialReminderFrequency={reminderFrequency}
      />
    </div>
  )
}
