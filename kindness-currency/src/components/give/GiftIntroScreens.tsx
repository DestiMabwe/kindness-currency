'use client'

import { ctaCopy } from '@/constants/ctaCopy'

type CloseButtonProps = { onClose?: () => void }

function CloseButton({ onClose }: CloseButtonProps) {
  if (!onClose) return null
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close preview"
      className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
    >
      ✕
    </button>
  )
}

export type GiftMessageScreenProps = {
  senderName: string
  senderMessage: string
  accent: string
  onContinue: () => void
  /** Only set by a preview context — a real recipient can't skip the message. */
  onClose?: () => void
}

/** The sender's message, shown once before the recipient can continue to how-it-works. Shared by the real /give/[id] flow (GiftUnwrapGate) and the sender's own "preview as recipient" flow. */
export function GiftMessageScreen({ senderName, senderMessage, accent, onContinue, onClose }: GiftMessageScreenProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#1A1A2E] px-7 text-center">
      <CloseButton onClose={onClose} />
      <div aria-hidden="true" className="text-2xl" style={{ color: accent }}>
        ♥
      </div>
      <div className="mt-3 text-xs tracking-[0.16em] text-white/60 uppercase">A gift from {senderName}</div>
      <div className="mt-5 max-w-[300px] text-[19px] leading-relaxed text-white italic" style={{ fontFamily: 'var(--font-playfair)' }}>
        &ldquo;{senderMessage}&rdquo;
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-8 rounded-full bg-white px-7 py-3.5 font-sans text-sm font-bold text-[#1A1A2E]"
      >
        {ctaCopy.giftMessageContinue}
      </button>
    </div>
  )
}

export type GiftInstructionsScreenProps = {
  senderName: string
  accent: string
  onContinue: () => void
  /** Only set by a preview context — a real recipient can't skip the instructions. */
  onClose?: () => void
}

/** How-it-works screen, shown once before the coupon reveal. Shared by the real /give/[id] flow and the sender's own preview. */
export function GiftInstructionsScreen({ senderName, accent, onContinue, onClose }: GiftInstructionsScreenProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FFF8F0] px-7 text-center">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A2E]/8 text-[#1A1A2E]"
        >
          ✕
        </button>
      )}
      <h1 className="text-[24px] leading-[1.15] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
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
            When you want to call one in, tap &ldquo;Redeem This ♥&rdquo; and enter the 4-digit PIN {senderName} shared with you
            separately — never in the link itself.
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
        onClick={onContinue}
        className="mt-8 rounded-full p-3.5 px-7 font-sans text-sm font-bold text-white"
        style={{ backgroundColor: accent }}
      >
        {ctaCopy.giftOpenCoupons}
      </button>
    </div>
  )
}
