import { SiteHeader } from '@/components/shared/SiteHeader'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createCouponSetRepository } from '@/lib/couponSetRepository'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
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

  const repo = createCouponSetRepository(createServiceClient())
  const [sentSets, receivedSets] = await Promise.all([
    repo.getCouponSetsForUser(user.id),
    repo.getCouponSetsForRecipient(user.id),
  ])

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
        <div className="mt-5">
          <ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />
        </div>
      </div>
    </div>
  )
}
