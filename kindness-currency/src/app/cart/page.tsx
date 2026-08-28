// Cart + checkout for the "pay for several, personalize later" path (the 3-for-2 bundle
// discount). No real payment provider is wired up yet — see CartView.tsx for how checkout is
// handled honestly in the meantime.

import { SiteHeader } from '@/components/shared/SiteHeader'
import { CartView } from '@/components/shared/CartView'

export default function CartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <CartView />
    </div>
  )
}
