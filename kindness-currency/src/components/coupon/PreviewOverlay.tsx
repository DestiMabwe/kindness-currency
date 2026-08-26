'use client'

import { useState } from 'react'
import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { GiftMessageScreen, GiftInstructionsScreen } from '@/components/give/GiftIntroScreens'
import { ctaCopy } from '@/constants/ctaCopy'
import type { BuilderCoupon } from '@/hooks/useCouponSetBuilder'

export type RecipientPreviewInfo = { senderName: string; senderMessage: string | null }

type PreviewStep = 'message' | 'instructions' | 'coupons'

export function PreviewOverlay({
  coupons,
  accent,
  motif,
  imageSrc,
  expiresAt,
  maxVisible,
  onViewAll,
  onClose,
  recipientPreview,
}: {
  coupons: BuilderCoupon[]
  accent: string
  motif: string
  imageSrc: string | null
  expiresAt: string | null
  maxVisible?: number
  onViewAll?: () => void
  onClose: () => void
  /** When set, opens with the same message → instructions → reveal flow a real recipient sees on /give/[id], before the coupon list — lets the sender preview the whole thing, not just the cards. Omit for the generic template-sample preview. */
  recipientPreview?: RecipientPreviewInfo
}) {
  const [step, setStep] = useState<PreviewStep>(() => {
    if (!recipientPreview) return 'coupons'
    return recipientPreview.senderMessage ? 'message' : 'instructions'
  })

  if (step === 'message' && recipientPreview) {
    return (
      <div className="fixed inset-0 z-[80] overflow-y-auto">
        <GiftMessageScreen
          senderName={recipientPreview.senderName}
          senderMessage={recipientPreview.senderMessage ?? ''}
          accent={accent}
          onContinue={() => setStep('instructions')}
          onClose={onClose}
        />
      </div>
    )
  }

  if (step === 'instructions' && recipientPreview) {
    return (
      <div className="fixed inset-0 z-[80] overflow-y-auto">
        <GiftInstructionsScreen
          senderName={recipientPreview.senderName}
          accent={accent}
          onContinue={() => setStep('coupons')}
          onClose={onClose}
        />
      </div>
    )
  }

  const isCapped = maxVisible !== undefined && coupons.length > maxVisible
  const visibleCoupons = isCapped ? coupons.slice(0, maxVisible) : coupons

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
        {visibleCoupons.map((coupon) => (
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
        {isCapped && (
          <button
            type="button"
            onClick={onViewAll}
            className="mb-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {ctaCopy.previewViewAllCoupons}
          </button>
        )}
      </div>
    </div>
  )
}
