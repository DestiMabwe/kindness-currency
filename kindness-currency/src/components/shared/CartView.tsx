'use client'

// Cart contents, 3-for-2 math, and checkout. No real payment provider is wired up yet — "Pay"
// marks the order as purchased (recorded in order history) and clears the cart without collecting
// any money, and the done screen says so plainly rather than claiming a charge that didn't happen.

import { useState } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { useCartSlugs, removeFromCart, completePurchase, linesForSlugs, cartTotals } from '@/lib/cart'

type Step = 'cart' | 'checkout' | 'done'

export function CartView() {
  const slugs = useCartSlugs()
  const [step, setStep] = useState<Step>('cart')
  const [purchasedNames, setPurchasedNames] = useState<string[]>([])
  // Frozen at the moment of payment: completePurchase() clears the cart, and useCartSlugs()
  // reacts to that immediately, so recomputing `total` from the (now-empty) live cart on the
  // "done" screen would show $0.00 instead of the order's actual value.
  const [purchasedTotal, setPurchasedTotal] = useState(0)

  const lines = linesForSlugs(slugs)

  const { subtotal, discount, total, freeSlug } = cartTotals(lines)

  const handlePay = () => {
    setPurchasedNames(lines.map((l) => l.name))
    setPurchasedTotal(total)
    completePurchase()
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="px-5.5 pt-2 pb-10">
        <h1 className="text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.cartDoneHeading}
        </h1>
        <div className="mt-2 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.cartDoneBody}</div>
        <div className="mt-1 text-[12px] font-semibold text-[#2C2C2C] opacity-50">Order value: ${purchasedTotal.toFixed(2)} (not charged)</div>
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

  if (step === 'checkout') {
    return (
      <div className="px-5.5 pt-2 pb-10">
        <button type="button" onClick={() => setStep('cart')} className="p-1 text-xl text-[#1A1A2E]" aria-label="Back">
          ‹
        </button>
        <h1 className="mt-1 text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.cartCheckoutHeading}
        </h1>
        <div className="mt-4 rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
          {lines.map((line) => (
            <div key={line.slug} className="flex items-center justify-between py-1 text-[13px] text-[#2C2C2C]">
              <span>
                {line.name}
                {line.slug === freeSlug && <span className="ml-1.5 font-bold text-[#2E7D6B]">FREE</span>}
              </span>
              <span className={line.slug === freeSlug ? 'text-[#2E7D6B] line-through opacity-60' : ''}>${line.price.toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-[#1A1A2E]/8 pt-2 text-[15px] font-bold text-[#1A1A2E]">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-4 text-[12px] leading-relaxed text-[#2C2C2C] opacity-55">{ctaCopy.cartCheckoutNote}</div>
        <button
          type="button"
          onClick={handlePay}
          className="mt-4 w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white"
        >
          {ctaCopy.cartPayCta(total.toFixed(2))}
        </button>
      </div>
    )
  }

  return (
    <div className="px-5.5 pt-2 pb-10">
      <h1 className="text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
        {ctaCopy.cartHeading}
      </h1>

      {lines.length === 0 ? (
        <div className="mt-4 text-[13.5px] text-[#2C2C2C] opacity-72">
          {ctaCopy.cartEmptyMessage}{' '}
          <Link href="/create" className="font-semibold text-[#C2185B] underline">
            {ctaCopy.cartBrowseLink}
          </Link>
        </div>
      ) : (
        <>
          {lines.length < 3 && (
            <div className="mt-3 rounded-xl bg-[#C2185B]/8 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#1A1A2E]">
              {ctaCopy.cartAlmostThreeForTwo(3 - lines.length)}
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2.5">
            {lines.map((line) => (
              <div key={line.slug} className="flex items-center justify-between rounded-xl border border-[#1A1A2E]/8 bg-white px-3.5 py-3">
                <div>
                  <div className="text-[13.5px] font-semibold text-[#1A1A2E]">{line.name}</div>
                  <div className="text-[12px] text-[#2C2C2C] opacity-60">
                    {line.slug === freeSlug ? <span className="font-bold text-[#2E7D6B]">FREE (3-for-2)</span> : `$${line.price.toFixed(2)}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(line.slug)}
                  aria-label={ctaCopy.cartRemoveLabel(line.name)}
                  className="p-1.5 text-xs font-semibold text-[#2C2C2C] opacity-50 underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
            <div className="flex items-center justify-between text-[13px] text-[#2C2C2C] opacity-72">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="mt-1 flex items-center justify-between text-[13px] font-semibold text-[#2E7D6B]">
                <span>3-for-2 discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-[#1A1A2E]/8 pt-2 text-[15px] font-bold text-[#1A1A2E]">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('checkout')}
            className="mt-4 w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white"
          >
            {ctaCopy.cartCheckoutCta}
          </button>
        </>
      )}
    </div>
  )
}
