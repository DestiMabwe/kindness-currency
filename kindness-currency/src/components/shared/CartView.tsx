'use client'

// Cart contents, 3-for-2 math, and checkout — real Paystack payment via initiateCartCheckoutAction.
// "Pay" redirects to Paystack's hosted checkout; the buyer lands back on /cart/complete once done.

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { QuantityStepper } from '@/components/builder/QuantityStepper'
import { useCartLines, setCartQty, removeFromCart, linesForCart, cartTotals, type CartLine } from '@/lib/cart'
import { initiateCartCheckoutAction } from '@/app/cart/actions'
import { formatPrice, REGION_PAIRED_BUNDLE_PRICE, type PricingRegion } from '@/lib/geoPricing'

const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

type Step = 'cart' | 'checkout'

/** A line where the free unit doesn't cover the whole line (qty > 1) shows its own price as
 * "qty × price" plus a separate "1 unit FREE" callout, rather than crossing out the whole row —
 * only one of the N units is actually discounted. */
function LineDiscountNote({ line, isFreeLine, region }: { line: CartLine; isFreeLine: boolean; region: PricingRegion }) {
  if (!isFreeLine) return null
  if (line.qty === 1) return <span className="font-bold text-[#2E7D6B]">FREE (3-for-2)</span>
  return (
    <span className="mt-0.5 block font-bold text-[#2E7D6B]">1 unit FREE (3-for-2) −{formatPrice(line.price, region)}</span>
  )
}

export function CartView({ isLoggedIn, region }: { isLoggedIn: boolean; region: PricingRegion }) {
  const cartLines = useCartLines()
  const [step, setStep] = useState<Step>('cart')
  const [authOpen, setAuthOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const lines = linesForCart(cartLines, region)

  const { subtotal, pairDiscount, discount, total, freeSlug, bookUnits } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE[region])

  const handlePay = async () => {
    if (!isLoggedIn) {
      setAuthOpen(true)
      return
    }
    setPaying(true)
    setPayError('')
    const result = await initiateCartCheckoutAction(cartLines)
    if (!result.success) {
      setPaying(false)
      setPayError(result.error)
      return
    }
    window.location.href = result.authorizationUrl
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
              <span>{formatPrice(line.price * line.qty, region)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-[#1A1A2E]/8 pt-2 text-[15px] font-bold text-[#1A1A2E]">
            <span>Total</span>
            <span>{formatPrice(total, region)}</span>
          </div>
        </div>
        <div className="mt-4 text-[12px] leading-relaxed text-[#2C2C2C] opacity-55">{ctaCopy.cartCheckoutNote}</div>
        {payError && <div className="mt-3 text-center text-[12.5px] text-[#C2185B]">{payError}</div>}
        <button
          type="button"
          onClick={handlePay}
          disabled={paying}
          className="mt-4 w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white disabled:opacity-50"
        >
          {paying ? ctaCopy.sendPaymentRedirecting : ctaCopy.cartPayCta(formatPrice(total, region))}
        </button>

        {authOpen && <AuthGate redirectTo="/cart" onClose={() => setAuthOpen(false)} />}
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
          {bookUnits < 3 && (
            <div className="mt-3 rounded-xl bg-[#C2185B]/8 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#1A1A2E]">
              {ctaCopy.cartAlmostThreeForTwo(3 - bookUnits)}
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
                        <LineDiscountNote line={line} isFreeLine={isFreeLine} region={region} />
                      ) : (
                        formatPrice(line.price * line.qty, region)
                      )}
                    </div>
                    <LineDiscountNote line={line} isFreeLine={isFreeLine && line.qty > 1} region={region} />
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
              <span>{formatPrice(subtotal, region)}</span>
            </div>
            {pairDiscount > 0 && (
              <div className="mt-1 flex items-center justify-between text-[13px] font-semibold text-[#2E7D6B]">
                <span>{ctaCopy.cartPairDiscountLabel}</span>
                <span>-{formatPrice(pairDiscount, region)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="mt-1 flex items-center justify-between text-[13px] font-semibold text-[#2E7D6B]">
                <span>3-for-2 discount</span>
                <span>-{formatPrice(discount, region)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-[#1A1A2E]/8 pt-2 text-[15px] font-bold text-[#1A1A2E]">
              <span>Total</span>
              <span>{formatPrice(total, region)}</span>
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
