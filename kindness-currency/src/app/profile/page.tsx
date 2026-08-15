import { SiteHeader } from '@/components/shared/SiteHeader'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createCouponSetRepository } from '@/lib/couponSetRepository'
import { ctaCopy } from '@/constants/ctaCopy'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1
            className="text-[20px] font-extrabold text-[#1A1A2E] italic"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {ctaCopy.profileLoggedOutHeading}
          </h1>
          <div className="mt-2 max-w-[280px] text-[13.5px] text-[#2C2C2C] opacity-72">
            {ctaCopy.profileLoggedOutSubtext}
          </div>
        </div>
      </div>
    )
  }

  const sets = await createCouponSetRepository(createServiceClient()).getCouponSetsForUser(user.id)

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <div className="px-5.5 pt-2 pb-10">
        <h1
          className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {ctaCopy.profileHeading}
        </h1>
        {sets.length === 0 ? (
          <div className="mt-6 text-[14px] text-[#2C2C2C] opacity-70">{ctaCopy.profileEmptyState}</div>
        ) : (
          <div className="mt-5 flex flex-col gap-3.5">
            {sets.map((set) => {
              const redeemedCount = set.coupons.filter((c) => c.status === 'redeemed').length
              return (
                <div key={set.id} className="rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[15.5px] font-bold text-[#1A1A2E]">{set.recipient_name}</div>
                    <span className="text-[11px] font-semibold tracking-[0.05em] text-[#2C2C2C] uppercase opacity-60">
                      {set.status}
                    </span>
                  </div>
                  {set.templateName && (
                    <div className="mt-1 text-[12.5px] text-[#2C2C2C] opacity-70">{set.templateName}</div>
                  )}
                  <div className="mt-2.5 text-[12.5px] font-semibold text-[#C2185B]">
                    {redeemedCount} of {set.coupons.length} redeemed
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
