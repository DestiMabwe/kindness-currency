// Paystack redirects here after checkout. Verifies + fulfills as a fast-path fallback in case the
// webhook (the real source of truth) hasn't landed yet — see checkoutService.verifyAndFulfillCheckout,
// safe to race. CartCompleteView (client) clears the local cart and records the purchase-history
// receipt log; instances just names what to show on this one confirmation screen.

import { SiteHeader } from '@/components/shared/SiteHeader'
import { verifyAndFulfillCheckout } from '@/lib/checkoutService'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { createOrderRepository } from '@/lib/orderRepository'
import { CartCompleteView } from '@/components/shared/CartCompleteView'
import { getRegion } from '@/lib/region'

export default async function CartCompletePage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  const [result, region] = await Promise.all([
    reference ? verifyAndFulfillCheckout(reference) : Promise.resolve({ paid: false as const }),
    getRegion(),
  ])
  const instances = user ? await createOrderRepository(createServiceClient()).getUnconsumedInstancesForUser(user.id) : []

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <CartCompleteView result={result} instances={instances} region={region} />
    </div>
  )
}
