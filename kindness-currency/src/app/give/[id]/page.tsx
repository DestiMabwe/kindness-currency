import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { createGiveRepository, type GiveCoupon } from '@/lib/giveRepository'
import { templateVisuals } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import { CouponCard } from '@/components/coupon/CouponCard'

function sortForDisplay(coupons: GiveCoupon[]): GiveCoupon[] {
  return [...coupons].sort((a, b) => {
    if (a.status === 'redeemed' && b.status !== 'redeemed') return 1
    if (a.status !== 'redeemed' && b.status === 'redeemed') return -1
    return a.sort_order - b.sort_order
  })
}

export default async function GivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = createGiveRepository(createServiceClient())
  const giveData = await repo.getCouponSetForRecipient(id)

  if (!giveData) notFound()

  const visuals = templateVisuals[giveData.template_slug]
  const coupons = sortForDisplay(giveData.coupons)

  return (
    <div className="flex min-h-screen flex-col pb-10">
      <div
        className="px-6 pt-12 pb-7 text-center text-white"
        style={{ background: `linear-gradient(160deg, ${visuals.accent}, #1A1A2E)` }}
      >
        <div className="text-xs tracking-[0.16em] uppercase opacity-80">A gift for you</div>
        <div className="mt-3 text-3xl leading-[1.12] font-extrabold italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          For {giveData.recipient_name},
        </div>
        <div className="mt-0.5 text-lg font-medium italic opacity-90" style={{ fontFamily: 'var(--font-playfair)' }}>
          with love from {giveData.sender_name} ♥
        </div>
        <div className="mx-auto mt-3.5 max-w-[280px] text-[13px] leading-relaxed opacity-85">
          {`${coupons.length} promises, each redeemable whenever you're ready. Tap one to call it in.`}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-5 pb-2">
        {coupons.map((coupon) => (
          <CouponCard
            key={coupon.id}
            serviceTitle={coupon.service_title}
            microCopy={coupon.micro_copy}
            finePrint={coupon.fine_print}
            fontChoice={coupon.font_choice}
            backgroundColor={coupon.background_color}
            backgroundEffect={coupon.background_effect}
            status={coupon.status}
            accent={visuals.accent}
            motif={visuals.motif}
          />
        ))}
      </div>

      <div className="mx-4 mt-6 rounded-[20px] bg-[#1A1A2E] p-5 text-center">
        <div className="text-lg font-bold text-white italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.recipientConversionHeading}
        </div>
        <div className="mt-1.5 text-[12.5px] text-white/70">{ctaCopy.recipientConversionSubtext}</div>
        <a
          href="/create"
          className="mt-3.5 inline-block rounded-full bg-white px-[22px] py-3 font-sans text-sm font-bold text-[#1A1A2E]"
        >
          {ctaCopy.recipientConversionButton}
        </a>
      </div>
      <div className="pt-2.5 pb-1.5 text-center text-[10.5px] tracking-[0.05em] text-[#2C2C2C] opacity-40">
        Made with Kindness Currency
      </div>
    </div>
  )
}
