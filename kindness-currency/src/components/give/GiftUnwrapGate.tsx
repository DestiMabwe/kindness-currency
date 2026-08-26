'use client'

import { useState, type ReactNode } from 'react'

export type GiftUnwrapGateProps = {
  senderName: string
  senderMessage: string | null
  accent: string
  children: ReactNode
}

/**
 * Message screen → tap "Open Your Coupons" → reveal. A set with no
 * sender_message skips straight to `children` (today's existing hero+coupon
 * page), unchanged. Wraps already-server-rendered `children` rather than
 * duplicating the data fetch — the message text itself is the only content
 * that needs client state here.
 */
export function GiftUnwrapGate({ senderName, senderMessage, accent, children }: GiftUnwrapGateProps) {
  const [revealed, setRevealed] = useState(!senderMessage)

  if (!revealed) {
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
          onClick={() => setRevealed(true)}
          className="mt-8 rounded-full bg-white px-7 py-3.5 font-sans text-sm font-bold text-[#1A1A2E]"
        >
          Open Your Coupons
        </button>
      </div>
    )
  }

  return <div className="kc-rise">{children}</div>
}
