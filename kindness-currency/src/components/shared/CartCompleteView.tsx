'use client'

// Client half of /cart/complete: takes the already-verified server result, records it into the
// local purchase-history cache Profile's receipt log reads, then clears the cart. Shows exactly
// what THIS order paid for (result.cartSnapshot) — never the sender's full backlog of unconsumed
// instances, which would misrepresent an old purchase as part of today's confirmation.

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { linesForCart, recordCompletedCheckout } from '@/lib/cart'
import { resolveGiftVisual } from '@/constants/designTokens'
import { formatPrice } from '@/lib/geoPricing'
import type { VerifyAndFulfillResult } from '@/lib/checkoutService'
import type { PricingRegion } from '@/lib/geoPricing'

export function CartCompleteView({ result, region }: { result: VerifyAndFulfillResult; region: PricingRegion }) {
  const recorded = useRef(false)

  useEffect(() => {
    if (recorded.current || !result.paid) return
    recorded.current = true
    // region only names each line — the total itself is always result.amountCents, the real ZAR
    // settlement amount (checkoutService only ever settles in ZAR), never a re-derived display price.
    const lines = linesForCart(result.cartSnapshot, region)
    recordCompletedCheckout(lines, result.amountCents / 100)
  }, [result, region])

  if (!result.paid) {
    return (
      <div className="px-5.5 pt-2 pb-10">
        <div className="pt-6 text-center">
          <div
            aria-hidden="true"
            className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#C2185B] text-[32px] text-white"
          >
            ↺
          </div>
          <h1 className="mt-4.5 text-[28px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            {ctaCopy.cartPaymentFailedHeading}
          </h1>
          <div className="mx-auto mt-2 max-w-[300px] text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-72">
            {ctaCopy.cartPaymentFailedBody}
          </div>
        </div>
        <Link
          href="/cart"
          className="mt-7 block w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white"
        >
          {ctaCopy.cartPaymentFailedCta}
        </Link>
      </div>
    )
  }

  const lines = linesForCart(result.cartSnapshot, region)
  const total = result.amountCents / 100

  return (
    <div className="px-5.5 pt-2 pb-10">
      <div className="pt-6 text-center">
        <div
          aria-hidden="true"
          className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#C2185B] text-[34px] text-white"
        >
          ♥
        </div>
        <h1 className="mt-4.5 text-[30px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.cartDoneHeading}
        </h1>
        <div className="mx-auto mt-2 max-w-[300px] text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-72">
          {ctaCopy.cartDoneBody}
        </div>
      </div>

      <div className="mt-6.5 rounded-[18px] border border-[#1A1A2E]/8 bg-white p-4">
        <div className="flex items-center justify-between border-b border-[#1A1A2E]/8 pb-3">
          <span className="text-[10.5px] font-semibold tracking-[0.1em] text-[#2C2C2C] uppercase opacity-60">
            {ctaCopy.cartDoneTotalLabel}
          </span>
          <span className="text-[15px] font-extrabold text-[#1A1A2E]">{formatPrice(total, 'ZA')}</span>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {lines.map((line) => {
            const { accent, motif } = resolveGiftVisual(line.slug)
            return (
              <div key={line.slug} className="flex items-center gap-2.5">
                <div
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]"
                  style={{ backgroundColor: `${accent}1F`, color: accent }}
                >
                  {motif}
                </div>
                <div className="text-[13.5px] font-semibold text-[#1A1A2E]">
                  {line.name}
                  {line.qty > 1 && <span className="ml-1 font-normal opacity-60">× {line.qty}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Link
        href="/profile"
        className="mt-6 block w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white"
      >
        {ctaCopy.cartSeeMyGiftsCta}
      </Link>
      {lines[0] && (
        <Link
          href={`/create?template=${encodeURIComponent(lines[0].slug)}`}
          className="mt-3 block w-full p-1.5 text-center font-sans text-[12.5px] font-semibold text-[#2C2C2C] opacity-70"
        >
          {ctaCopy.cartDonePersonalizeFirstCta(lines[0].name)}
        </Link>
      )}
    </div>
  )
}
