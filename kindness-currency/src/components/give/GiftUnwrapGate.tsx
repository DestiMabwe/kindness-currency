'use client'

import { useState, type ReactNode } from 'react'
import { GiftFloatingActions } from './GiftFloatingActions'
import { ctaCopy } from '@/constants/ctaCopy'
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A2E] px-7 text-center">
        <div aria-hidden="true" className="text-2xl" style={{ color: accent }}>
          ♥
        </div>
        <div className="mt-3 text-xs tracking-[0.16em] text-white/60 uppercase">A gift from {senderName}</div>
        <div
          className="mt-5 max-w-[300px] text-[19px] leading-relaxed text-white italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          &ldquo;{senderMessage}&rdquo;
        </div>
        <button
          type="button"
          onClick={() => setStep('instructions')}
          className="mt-8 rounded-full bg-white px-7 py-3.5 font-sans text-sm font-bold text-[#1A1A2E]"
        >
          {ctaCopy.giftMessageContinue}
        </button>
      </div>
    )
  }

  if (step === 'instructions') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF8F0] px-7 text-center">
        <h1
          className="text-[24px] leading-[1.15] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {ctaCopy.giftInstructionsHeading}
        </h1>
        <div className="mt-5 flex max-w-[300px] flex-col gap-3.5 text-left text-[14px] leading-relaxed text-[#2C2C2C]">
          <div className="flex gap-2.5">
            <span aria-hidden="true" style={{ color: accent }}>
              ①
            </span>
            <span>Below are your coupons — promises to redeem whenever you&apos;re ready. No rush.</span>
          </div>
          <div className="flex gap-2.5">
            <span aria-hidden="true" style={{ color: accent }}>
              ②
            </span>
            <span>
              When you want to call one in, tap &ldquo;Redeem This ♥&rdquo; and enter the 4-digit PIN {senderName} shared with
              you separately — never in the link itself.
            </span>
          </div>
          <div className="flex gap-2.5">
            <span aria-hidden="true" style={{ color: accent }}>
              ③
            </span>
            <span>Once redeemed, that promise is locked in — so make sure you&apos;re ready before you confirm.</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStep('revealed')}
          className="mt-8 rounded-full p-3.5 px-7 font-sans text-sm font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {ctaCopy.giftOpenCoupons}
        </button>
      </div>
    )
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
