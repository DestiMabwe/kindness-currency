'use client'

import { useDialogA11y } from '@/hooks/useDialogA11y'
import { ctaCopy } from '@/constants/ctaCopy'

export type GiftMessageCardProps = {
  senderName: string
  senderMessage: string
  accent: string
  /** 'unseal' plays the envelope opening (first reveal only); 'rise' is the quick re-read from the envelope icon. */
  entrance: 'unseal' | 'rise'
  onClose: () => void
}

// The quote fades in a sentence at a time once the card has unfolded out of the envelope.
const UNSEAL_LINES_START_S = 1.75
const LINE_STAGGER_S = 0.28
const MAX_STAGGERED_LINES = 6

function splitIntoLines(message: string): string[] {
  return message.match(/[^.!?]+[.!?]*\s*/g) ?? [message]
}

/**
 * The sender's message as a centred popup over the coupon page. Shared by the real /give/[id]
 * page (auto-shown 5s into a first visit, re-readable from the envelope icon) and the sender's
 * own previews, so what a sender previews is exactly what their recipient gets.
 */
export function GiftMessageCard({ senderName, senderMessage, accent, entrance, onClose }: GiftMessageCardProps) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)
  const unseal = entrance === 'unseal'
  const lines = splitIntoLines(senderMessage)

  return (
    <div
      className="kc-fade fixed inset-0 z-[95] flex items-center justify-center bg-[#1A1A2E]/60 px-5 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {unseal && (
        <div aria-hidden="true" className="kc-envelope pointer-events-none absolute inset-0 items-center justify-center">
          <div className="kc-envelope-body relative h-[120px] w-[180px] [perspective:600px]">
            <div className="absolute inset-0 rounded-[10px]" style={{ backgroundColor: accent, filter: 'brightness(0.82)' }} />
            <div className="kc-envelope-letter absolute inset-x-3 top-2 bottom-2 z-[2] rounded-[6px] bg-[#FFF8F0]" />
            <div
              className="absolute inset-0 z-[3] rounded-[10px]"
              style={{ backgroundColor: accent, clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)' }}
            />
            <div
              className="kc-envelope-flap absolute inset-x-0 top-0 h-[64px] rounded-t-[10px]"
              style={{ backgroundColor: accent, filter: 'brightness(0.92)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            />
          </div>
        </div>
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-message-heading"
        className={`${unseal ? 'kc-unseal-card' : 'kc-rise'} relative w-full max-w-[340px] rounded-[26px] bg-[#1A1A2E] px-6 pt-7 pb-8 text-center`}
        style={{ boxShadow: `0 0 0 1.5px ${accent}, 0 24px 60px -20px rgba(0,0,0,0.6)` }}
      >
        <div aria-hidden="true" className="text-2xl" style={{ color: accent }}>
          ♥
        </div>
        <div id="gift-message-heading" className="mt-3 text-xs tracking-[0.16em] text-white/60 uppercase">
          A gift from {senderName}
        </div>
        <p className="mt-5 text-[19px] leading-relaxed text-white italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          &ldquo;
          {lines.map((line, i) => (
            <span
              key={i}
              className={unseal ? 'kc-unseal-line' : undefined}
              style={
                unseal
                  ? { ['--kc-line-delay' as string]: `${UNSEAL_LINES_START_S + Math.min(i, MAX_STAGGERED_LINES) * LINE_STAGGER_S}s` }
                  : undefined
              }
            >
              {line.trimEnd()}
              {i < lines.length - 1 ? ' ' : ''}
            </span>
          ))}
          &rdquo;
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-7 rounded-full bg-white px-7 py-3.5 font-sans text-sm font-bold text-[#1A1A2E]"
        >
          {ctaCopy.giftMessageClose}
        </button>
      </div>
    </div>
  )
}
