'use client'

// Surfaces the cart, "purchased, not yet personalized" state, and a permanent purchase history
// on Profile, so the sender has one place to see all three. Renders nothing when there's
// genuinely nothing to show (no clutter for senders who haven't used the cart flow).

import Link from 'next/link'
import { useCartSlugs, usePurchasedSlugs, useOrderHistory, linesForSlugs, cartTotals } from '@/lib/cart'

export function ProfileCartSection() {
  const cartSlugs = useCartSlugs()
  const purchasedSlugs = usePurchasedSlugs()
  const orders = useOrderHistory()
  const cartLines = linesForSlugs(cartSlugs)
  const purchasedLines = linesForSlugs(purchasedSlugs)

  if (cartLines.length === 0 && purchasedLines.length === 0 && orders.length === 0) return null

  const { total } = cartTotals(cartLines)

  return (
    <div className="mb-6 flex flex-col gap-3">
      {cartLines.length > 0 && (
        <Link
          href="/cart"
          className="flex items-center justify-between rounded-2xl border border-[#1A1A2E]/8 bg-white p-4"
        >
          <div>
            <div className="text-[13.5px] font-bold text-[#1A1A2E]">
              Your Cart · {cartLines.length} {cartLines.length === 1 ? 'item' : 'items'}
            </div>
            <div className="mt-0.5 text-[12px] text-[#2C2C2C] opacity-60">${total.toFixed(2)} total</div>
          </div>
          <span className="text-[13px] font-semibold text-[#C2185B]">View Cart →</span>
        </Link>
      )}

      {purchasedLines.length > 0 && (
        <div className="rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
          <div className="text-[13.5px] font-bold text-[#1A1A2E]">Ready to personalize</div>
          <div className="mt-0.5 text-[12px] text-[#2C2C2C] opacity-60">
            Paid for, waiting on you — pick one up whenever you&apos;re ready.
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {purchasedLines.map((line) => (
              <Link
                key={line.slug}
                href="/create"
                className="flex items-center justify-between rounded-xl bg-[#F0ECE4] px-3 py-2.5 text-[13px] font-semibold text-[#1A1A2E]"
              >
                {line.name}
                <span className="text-[#2E7D6B]">Personalize →</span>
              </Link>
            ))}
          </div>
        </div>
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
                    <span className="font-semibold">${order.total.toFixed(2)}</span>
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
