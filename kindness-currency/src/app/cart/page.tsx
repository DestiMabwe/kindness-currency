// Cart + checkout for the "pay for several, personalize later" path (the 3-for-2 bundle
// discount). Real payment via Paystack — see CartView.tsx and src/app/cart/actions.ts.

import { SiteHeader } from '@/components/shared/SiteHeader'
import { CartView } from '@/components/shared/CartView'
import { createClient } from '@/lib/supabase/server'

export default async function CartPage() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <CartView isLoggedIn={!!user} />
    </div>
  )
}
