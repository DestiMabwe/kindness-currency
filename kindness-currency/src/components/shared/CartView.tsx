'use client'

// Cart contents, 3-for-2 math, and checkout. No real payment provider is wired up yet — "Pay"
// marks the order as purchased (recorded in order history) and clears the cart without collecting
// any money, and the done screen says so plainly rather than claiming a charge that didn't happen.

import { useState } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { QuantityStepper } from '@/components/builder/QuantityStepper'
import { useCartLines, setCartQty, removeFromCart, completePurchase, linesForCart, cartTotals, type CartLine } from '@/lib/cart'

type Step = 'cart' | 'checkout' | 'done'

/** A line where the free unit doesn't cover the whole line (qty > 1) shows its own price as
 * "qty × price" plus a separate "1 unit FREE" callout, rather than crossing out the whole row —
 * only one of the N units is actually discounted. */
function LineDiscountNote({ line, isFreeLine }: { line: CartLine; isFreeLine: boolean }) {
  if (!isFreeLine) return null
  if (line.qty === 1) return <span className="font-bold text-[#2E7D6B]">FREE (3-for-2)</span>
  return <span className="mt-0.5 block font-bold text-[#2E7D6B]">1 unit FREE (3-for-2) −${line.price.toFixed(2)}</span>
}

export function CartView() {
  const cartLines = useCartLines()
  const [step, setStep] = useState<Step>('cart')
  const [purchasedNames, setPurchasedNames] = useState<string[]>([])
  // Frozen at the moment of payment: completePurchase() clears the cart, and useCartLines()
  // reacts to that immediately, so recomputing `total` from the (now-empty) live cart on the
  // "done" screen would show $0.00 instead of the order's actual value.
  const [purchasedTotal, setPurchasedTotal] = useState(0)

  const lines = linesForCart(cartLines)
  const totalUnits = lines.reduce((sum, l) => sum + l.qty, 0)

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
                {line.qty > 1 && ` × ${line.qty}`}
                {line.slug === freeSlug && line.qty === 1 && <span className="ml-1.5 font-bold text-[#2E7D6B]">FREE</span>}
              </span>
              <span>${(line.price * line.qty).toFixed(2)}</span>
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
          {totalUnits < 3 && (
            <div className="mt-3 rounded-xl bg-[#C2185B]/8 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#1A1A2E]">
              {ctaCopy.cartAlmostThreeForTwo(3 - totalUnits)}
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2.5">
            {lines.map((line) => {
              const isFreeLine = line.slug === freeSlug
              return (
                <div key={line.slug} className="flex items-center justify-between gap-2.5 rounded-xl border border-[#1A1A2E]/8 bg-white px-3.5 py-3">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-[#1A1A2E]">
                      {line.name}
                      {line.qty > 1 && ` × ${line.qty}`}
                    </div>
                    <div className="text-[12px] text-[#2C2C2C] opacity-60">
                      {isFreeLine && line.qty === 1 ? (
                        <LineDiscountNote line={line} isFreeLine={isFreeLine} />
                      ) : (
                        `$${(line.price * line.qty).toFixed(2)}`
                      )}
                    </div>
                    <LineDiscountNote line={line} isFreeLine={isFreeLine && line.qty > 1} />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <QuantityStepper
                      value={line.qty}
                      min={0}
                      onDecrease={() => setCartQty(line.slug, line.qty - 1)}
                      onIncrease={() => setCartQty(line.slug, line.qty + 1)}
                      decreaseLabel={ctaCopy.qtyDecreaseLabel(line.name)}
                      increaseLabel={ctaCopy.qtyIncreaseLabel(line.name)}
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.slug)}
                      aria-label={ctaCopy.cartRemoveLabel(line.name)}
                      className="p-1.5 text-xs font-semibold text-[#2C2C2C] opacity-50 underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
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
