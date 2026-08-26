import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { createGiveRepository, sortCouponsForDisplay } from '@/lib/giveRepository'
import { templateVisuals } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import { RecipientCouponList } from '@/components/coupon/RecipientCouponList'
import { SaveToAccountBanner } from '@/components/give/SaveToAccountBanner'
import { SiteHeader } from '@/components/shared/SiteHeader'

export default async function GivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = createGiveRepository(createServiceClient())
  const giveData = await repo.getCouponSetForRecipient(id)

  if (!giveData) notFound()

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  const visuals = templateVisuals[giveData.template_slug]
  const coupons = sortCouponsForDisplay(giveData.coupons)

  return (
    <div className="flex min-h-screen flex-col pb-10">
      <SiteHeader />
      <div
        className="px-6 pt-7 pb-7 text-center text-white"
        style={{ background: `linear-gradient(160deg, ${visuals.accent}, #1A1A2E)` }}
      >
        <div className="text-xs tracking-[0.16em] uppercase opacity-80">A gift for you</div>
        <h1 className="mt-3 text-3xl leading-[1.12] font-extrabold italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          For {giveData.recipient_name},
        </h1>
        <div className="mt-0.5 text-lg font-medium italic opacity-90" style={{ fontFamily: 'var(--font-playfair)' }}>
          with love from {giveData.sender_name} ♥
        </div>
        <div className="mx-auto mt-3.5 max-w-[280px] text-[13px] leading-relaxed opacity-85">
          {`${coupons.length} promises, each redeemable whenever you're ready. Tap one to call it in.`}
        </div>
      </div>

      <SaveToAccountBanner setId={giveData.id} isLoggedIn={!!user} alreadyLinked={giveData.recipient_user_id === user?.id} />

      <RecipientCouponList
        initialCoupons={coupons}
        senderName={giveData.sender_name}
        accent={visuals.accent}
        motif={visuals.motif}
        imageSrc={visuals.imageSrc}
        expiresAt={giveData.expiry_date}
      />

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
      <div className="pt-2.5 pb-1.5 text-center text-[10.5px] tracking-[0.05em] text-[#2C2C2C] opacity-80">
        Made with Kindness Currency
      </div>
    </div>
  )
}
