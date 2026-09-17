// Paystack redirects here after checkout. Verifies + fulfills as a fast-path fallback in case the
// webhook (the real source of truth) hasn't landed yet — see checkoutService.verifyAndFulfillCheckout,
// safe to race. CartCompleteView (client) clears the local cart and records the purchase-history
// receipt log, showing exactly what this order's own cart_snapshot paid for.

import { SiteHeader } from '@/components/shared/SiteHeader'
import { verifyAndFulfillCheckout } from '@/lib/checkoutService'
import { CartCompleteView } from '@/components/shared/CartCompleteView'
import { getRegion } from '@/lib/region'

export default async function CartCompletePage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams

  const [result, region] = await Promise.all([
    reference ? verifyAndFulfillCheckout(reference) : Promise.resolve({ paid: false as const }),
    getRegion(),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <CartCompleteView result={result} region={region} />
    </div>
  )
}
