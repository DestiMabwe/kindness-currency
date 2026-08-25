import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { ctaCopy } from '@/constants/ctaCopy'
import type { BuilderCoupon } from '@/hooks/useCouponSetBuilder'

export function PreviewOverlay({
  coupons,
  accent,
  motif,
  imageSrc,
  expiresAt,
  maxVisible,
  onViewAll,
  onClose,
}: {
  coupons: BuilderCoupon[]
  accent: string
  motif: string
  imageSrc: string | null
  expiresAt: string | null
  maxVisible?: number
  onViewAll?: () => void
  onClose: () => void
}) {
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
