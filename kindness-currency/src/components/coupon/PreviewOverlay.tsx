'use client'

import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { GiftMessageCard } from '@/components/give/GiftMessageCard'
import { useDelayedMessageReveal } from '@/hooks/useDelayedMessageReveal'
import type { BuilderCoupon } from '@/hooks/useCouponSetBuilder'

export type RecipientPreviewInfo = { senderName: string; senderMessage: string | null }

// Shorter than the recipient page's 5s — in a preview, a long silent pause reads as broken.
const PREVIEW_MESSAGE_REVEAL_DELAY_MS = 1500

export function PreviewOverlay({
  coupons,
  accent,
  motif,
  imageSrc,
  expiresAt,
  onClose,
  recipientPreview,
}: {
  coupons: BuilderCoupon[]
  accent: string
  motif: string
  imageSrc: string | null
  expiresAt: string | null
  onClose: () => void
  /** When set, the sender's message unseals over the coupon list just as it does for a real recipient on /give/[id] — lets the sender preview the whole thing, not just the cards. Omit for the generic template-sample preview. */
  recipientPreview?: RecipientPreviewInfo
}) {
  const senderMessage = recipientPreview?.senderMessage ?? null
  const [messageOpen, closeMessage] = useDelayedMessageReveal(!!senderMessage, PREVIEW_MESSAGE_REVEAL_DELAY_MS)

  return (
    <div className="fixed inset-0 z-[80] flex h-dvh flex-col bg-[#1A1A2E]">
      <div className="flex items-center justify-between px-5 pt-11 pb-3">
        <div className="text-lg font-bold text-white italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Preview
        </div>
        <button type="button" onClick={onClose} aria-label="Close preview" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
          ✕
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4.5 pb-6.5">
        {coupons.map((coupon) => (
          <CouponCardHero
            key={coupon.id}
            serviceTitle={coupon.serviceTitle}
            microCopy={coupon.microCopy}
            finePrint={coupon.finePrint}
            backgroundColor={coupon.backgroundColor}
            backgroundEffect={coupon.backgroundEffect}
            status="sent"
            accent={accent}
            motif={motif}
            imageSrc={imageSrc}
            expiresAt={expiresAt}
          />
        ))}
      </div>
      {messageOpen && recipientPreview && senderMessage && (
        <GiftMessageCard
          senderName={recipientPreview.senderName}
          senderMessage={senderMessage}
          accent={accent}
          entrance="unseal"
          onClose={closeMessage}
        />
      )}
    </div>
  )
}
