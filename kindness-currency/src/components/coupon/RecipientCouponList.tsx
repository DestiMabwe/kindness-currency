'use client'

import { useState } from 'react'
import { CouponCardHero } from './CouponCardHero'
import { PINVerificationModal } from '@/components/modals/PINVerificationModal'
import { sortCouponsForDisplay, type GiveCoupon } from '@/lib/giveRepository'
import { redeemCouponAction } from '@/app/give/[id]/actions'
import { ctaCopy } from '@/constants/ctaCopy'

export type RecipientCouponListProps = {
  initialCoupons: GiveCoupon[]
  senderName: string
  accent: string
  motif: string
  imageSrc: string
  expiresAt: string | null
}

export function RecipientCouponList({
  initialCoupons,
  senderName,
  accent,
  motif,
  imageSrc,
  expiresAt,
}: RecipientCouponListProps) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState(false)

  const redeemingCoupon = coupons.find((c) => c.id === redeemingId) ?? null

  const handleVerify = async (pin: string): Promise<boolean> => {
    if (!redeemingId) return false
    const result = await redeemCouponAction({ couponId: redeemingId, pin })
    if (!result.success) return false

    setCoupons((prev) => prev.map((c) => (c.id === redeemingId ? { ...c, status: result.coupon.status } : c)))
    setRedeemingId(null)
    setCelebrating(true)
    return true
  }

  return (
    <>
      <div className="flex flex-col items-center gap-6 px-4 pt-5 pb-2">
        {sortCouponsForDisplay(coupons).map((coupon) => (
          <CouponCardHero
            key={coupon.id}
            serviceTitle={coupon.service_title}
            microCopy={coupon.micro_copy}
            finePrint={coupon.fine_print}
            backgroundColor={coupon.background_color}
            backgroundEffect={coupon.background_effect}
            status={coupon.status}
            accent={accent}
            motif={motif}
            imageSrc={imageSrc}
            expiresAt={expiresAt}
            showRedeem
            onRedeem={() => setRedeemingId(coupon.id)}
          />
        ))}
      </div>

      {redeemingCoupon && (
        <PINVerificationModal
          couponTitle={redeemingCoupon.service_title}
          senderName={senderName}
          onVerify={handleVerify}
          onClose={() => setRedeemingId(null)}
        />
      )}

      {celebrating && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setCelebrating(false)}
          onKeyDown={(e) => e.key === 'Enter' && setCelebrating(false)}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1A1A2E]/62 p-7.5 backdrop-blur"
        >
          <div className="max-w-[300px] rounded-3xl bg-[#FFF8F0] px-6.5 py-8 text-center">
            <div className="text-[46px]" style={{ color: accent }}>
              ♥
            </div>
            <div className="mt-2.5 text-2xl font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
              {ctaCopy.postRedemptionState}
            </div>
            <div className="mt-2.5 text-[13px] leading-relaxed text-[#2C2C2C] opacity-70">
              {`${senderName} can't wait. Enjoy every moment of it.`}
            </div>
            <button
              type="button"
              onClick={() => setCelebrating(false)}
              className="mt-5 rounded-full bg-[#1A1A2E] px-6.5 py-3 font-sans text-sm font-bold text-white"
            >
              Lovely ♥
            </button>
          </div>
        </div>
      )}
    </>
  )
}
