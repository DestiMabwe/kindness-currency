import { notFound, redirect } from 'next/navigation'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createCouponSetRepository } from '@/lib/couponSetRepository'
import { GiftTrackingDetail } from '@/components/profile/GiftTrackingDetail'

export default async function GiftTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Signing out from this page re-renders it via router.refresh() with no session —
  // send them to /profile's own logged-out state instead of a bare 404.
  if (!user) redirect('/profile')

  const repo = createCouponSetRepository(createServiceClient())
  const detail = await repo.getCouponSetDetailForSender(id, user.id)

  if (!detail) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <GiftTrackingDetail detail={detail} />
    </div>
  )
}
