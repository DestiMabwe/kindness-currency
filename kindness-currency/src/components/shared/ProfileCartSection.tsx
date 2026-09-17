'use client'

// Surfaces the "purchased, not yet personalized" state, the cart, and a permanent purchase
// history on Profile, so the sender has one place to see all three — most actionable first, pure
// archive last. Renders nothing when there's genuinely nothing to show (no clutter for senders
// who haven't used the cart flow).

import Link from 'next/link'
import { useCartSlugs, useOrderHistory, linesForSlugs, cartTotals } from '@/lib/cart'
import { resolveGiftVisual } from '@/constants/designTokens'
import { formatPrice, REGION_PAIRED_BUNDLE_PRICE, type PricingRegion } from '@/lib/geoPricing'
import type { PendingPersonalization } from '@/lib/orderRepository'

export function ProfileCartSection({
  region,
  pendingPersonalizations,
}: {
  region: PricingRegion
  pendingPersonalizations: PendingPersonalization[]
}) {
  const cartSlugs = useCartSlugs()
  const orders = useOrderHistory()
  const cartLines = linesForSlugs(cartSlugs, region)
  const purchasedLines = linesForSlugs(
    pendingPersonalizations.map((p) => p.slug),
    region
  ).map((line) => ({ ...line, count: pendingPersonalizations.find((p) => p.slug === line.slug)?.count ?? 1 }))

  if (cartLines.length === 0 && purchasedLines.length === 0 && orders.length === 0) return null

  const { total } = cartTotals(cartLines, REGION_PAIRED_BUNDLE_PRICE[region])

  return (
    <div className="mb-6 flex flex-col gap-3">
      {purchasedLines.length > 0 && (
        <div className="rounded-2xl border border-[#FF8F00]/25 bg-[#FF8F00]/8 p-4">
          <div className="text-[13.5px] font-bold text-[#1A1A2E]">Ready to personalize</div>
          <div className="mt-0.5 text-[12px] text-[#2C2C2C] opacity-60">
            Paid for, waiting on you — pick one up whenever you&apos;re ready.
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {purchasedLines.map((line) => {
              const { accent, motif } = resolveGiftVisual(line.slug)
              return (
                <Link
                  key={line.slug}
                  href={`/create?template=${encodeURIComponent(line.slug)}`}
                  className="flex items-center gap-2.5 rounded-xl border border-transparent bg-white px-3 py-2.5 text-[13px] font-semibold text-[#1A1A2E] transition-colors hover:border-[#1A1A2E]/12"
                >
                  <div
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14.5px]"
                    style={{ backgroundColor: `${accent}1F`, color: accent }}
                  >
                    {motif}
                  </div>
                  <span className="min-w-0 truncate">
                    {line.name}
                    {line.count > 1 && <span className="ml-1.5 font-normal opacity-60">× {line.count}</span>}
                  </span>
                  <span className="ml-auto shrink-0 pl-3 text-[#2E7D6B]">Personalize →</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {cartLines.length > 0 && (
        <Link
          href="/cart"
          className="flex items-center justify-between rounded-2xl border border-[#1A1A2E]/8 bg-white p-4 transition-colors hover:border-[#1A1A2E]/16"
        >
          <div>
            <div className="text-[13.5px] font-bold text-[#1A1A2E]">
              Your Cart · {cartLines.length} {cartLines.length === 1 ? 'item' : 'items'}
            </div>
            <div className="mt-0.5 text-[12px] text-[#2C2C2C] opacity-60">{formatPrice(total, region)} total</div>
          </div>
          <span className="text-[13px] font-semibold text-[#C2185B]">View Cart →</span>
        </Link>
      )}

      {orders.length > 0 && (
        <div className="rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
          <div className="text-[13.5px] font-bold text-[#1A1A2E]">Purchase History</div>
          <div className="mt-3 flex flex-col gap-3">
            {[...orders]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((order) => (
                <div key={order.id} className="border-t border-[#1A1A2E]/8 pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between text-[12px] text-[#2C2C2C] opacity-60">
                    <span>
                      {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {/* Always the real ZAR amount actually charged (checkoutService only ever settles in
                        ZAR) — not the visitor's current display region, which is a browsing convenience,
                        not what happened at the time of this historical purchase. */}
                    <span className="font-semibold">{formatPrice(order.total, 'ZA')}</span>
                  </div>
                  <div className="mt-1 text-[13px] text-[#1A1A2E]">{order.lines.map((l) => l.name).join(', ')}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
