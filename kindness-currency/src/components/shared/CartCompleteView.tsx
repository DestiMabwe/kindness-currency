'use client'

// Client half of /cart/complete: takes the already-verified server result and syncs it into the
// local display caches (purchased instances + purchase history) that ProfileCartSection and
// CouponSetBuilder read, then clears the cart. All of that is local bookkeeping only — the actual
// payment/entitlement truth was already established server-side before this ever rendered.

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { linesForSlugs, syncPurchasedInstancesFromServer, recordCompletedCheckout, type PurchasedInstance } from '@/lib/cart'
import type { VerifyAndFulfillResult } from '@/lib/checkoutService'
import type { PricingRegion } from '@/lib/geoPricing'

export function CartCompleteView({
  result,
  instances,
  region,
}: {
  result: VerifyAndFulfillResult
  instances: PurchasedInstance[]
  region: PricingRegion
}) {
  const recorded = useRef(false)

  useEffect(() => {
    if (recorded.current || !result.paid) return
    recorded.current = true
    syncPurchasedInstancesFromServer(instances)
    // Only .name is used from these lines (recordCompletedCheckout's total comes from
    // result.amountCents — the real ZAR settlement amount — not from these per-line display
    // prices), so `region` here only affects a value nothing ever reads.
    const lines = linesForSlugs(
      result.cartSnapshot.flatMap((l) => Array.from({ length: l.qty }, () => l.slug)),
      region
    )
    recordCompletedCheckout(lines, result.amountCents / 100)
  }, [result, instances, region])

  if (!result.paid) {
    return (
      <div className="px-5.5 pt-2 pb-10">
        <h1 className="text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.cartPaymentFailedHeading}
        </h1>
        <div className="mt-2 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.cartPaymentFailedBody}</div>
        <Link href="/cart" className="mt-6 block w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white">
          {ctaCopy.cartPaymentFailedCta}
        </Link>
      </div>
    )
  }

  const purchasedNames = linesForSlugs(instances.map((i) => i.slug), region).map((l) => l.name)

  return (
    <div className="px-5.5 pt-2 pb-10">
      <h1 className="text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
        {ctaCopy.cartDoneHeading}
      </h1>
      <div className="mt-2 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.cartDoneBody}</div>
      <div className="mt-5 flex flex-col gap-2.5">
        {purchasedNames.map((name) => (
          <div key={name} className="rounded-xl border border-[#1A1A2E]/8 bg-white px-3.5 py-3 text-[13.5px] font-semibold text-[#1A1A2E]">
            {name}
          </div>
        ))}
      </div>
      <Link
        href="/create"
        className="mt-6 block w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white"
      >
        {ctaCopy.cartPersonalizeCta}
      </Link>
    </div>
  )
}
