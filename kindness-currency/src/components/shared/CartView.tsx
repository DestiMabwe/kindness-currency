'use client'

// Cart contents, 3-for-2 math, and checkout — real Paystack payment via initiateCartCheckoutAction.
// "Pay" opens Paystack's inline popup right on this page; the buyer lands on /cart/complete once
// the popup reports success, without ever navigating away to pay.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { QuantityStepper } from '@/components/builder/QuantityStepper'
import {
  useCartLines,
  setCartQty,
  removeFromCart,
  linesForCart,
  cartTotals,
  savePendingDiscountCode,
  readPendingDiscountCode,
  clearPendingDiscountCode,
  type CartLine,
} from '@/lib/cart'
import { initiateCartCheckoutAction, previewDiscountCodeAction } from '@/app/cart/actions'
import { resumePaystackCheckout } from '@/lib/paystack/inline'
import { formatPrice, REGION_PAIRED_BUNDLE_PRICE, type PricingRegion } from '@/lib/geoPricing'
import { settlementTotalForItems } from '@/lib/pricing'
import { applyPercentDiscount } from '@/lib/discount'
import { flags } from '@/lib/flags'
import { AuthLinkFailedBanner } from '@/components/shared/AuthLinkFailedBanner'
import { useAuthLinkFailed } from '@/hooks/useAuthLinkFailed'

const CHECKOUT_POPUP_ERROR = 'Could not open the payment window. Please try again.'

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
  const router = useRouter()
  const cartLines = useCartLines()
  const [step, setStep] = useState<Step>('cart')
  const [authOpen, setAuthOpen] = useState(false)
  const { failed: authLinkFailed, dismiss: dismissAuthLinkFailed } = useAuthLinkFailed()
  const [resumeAuthOpen, setResumeAuthOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState<{ code: string; percentOff: number } | null>(null)
  const [codeError, setCodeError] = useState('')
  const [applyingCode, setApplyingCode] = useState(false)

  const lines = linesForCart(cartLines, region)

  const { subtotal, pairDiscount, discount, total, freeSlug, bookUnits } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE[region])
  // Gestures never count toward 3-for-2, so any units beyond the coupon-book units are gestures.
  const hasGestureUnits = lines.reduce((sum, l) => sum + l.qty, 0) > bookUnits
  // Paystack settles only in ZAR, so anyone outside South Africa sees prices in their local currency
  // but is charged a rand amount — surfaced here (display only; the server recomputes the charge).
  const chargedInZar = region !== 'ZA'
  // Display only — the server re-validates the code and recomputes the real charge. Both figures use
  // the same applyPercentDiscount the server does, so the preview can't drift from what's charged.
  const percentOff = appliedCode?.percentOff ?? 0
  // Whole cents first, same as the server — float math on 19.99 * 50 would round the other way.
  const codeDiscount = Math.round((Math.round(total * 100) * percentOff) / 100) / 100
  const totalAfterCode = total - codeDiscount
  const zarFinalCents = applyPercentDiscount(Math.round(settlementTotalForItems(cartLines, region) * 100), percentOff).finalCents
  const zarTotal = formatPrice(zarFinalCents / 100, 'ZA')
  const isFree = appliedCode !== null && zarFinalCents === 0

  // Display-only preview — see previewDiscountCodeAction. A rejected code stays in the input so it
  // can be corrected rather than retyped.
  const applyCode = async (code: string) => {
    setApplyingCode(true)
    setCodeError('')
    const result = await previewDiscountCodeAction(code)
    setApplyingCode(false)
    if (!result.success) {
      setCodeError(result.error)
      return
    }
    setAppliedCode({ code: result.code, percentOff: result.percentOff })
    setCodeInput('')
  }

  // A code typed before login is restored the moment the buyer is logged in — whether that's the
  // same tab (AuthGate's in-place code entry refreshes isLoggedIn) or a reload from the magic link.
  // It reopens checkout too, since that's the only step with the code field, and stops there: the
  // buyer still taps Pay themselves.
  useEffect(() => {
    if (!isLoggedIn || !flags.discountCodes) return
    const restore = () => {
      const pending = readPendingDiscountCode()
      if (!pending) return
      clearPendingDiscountCode()
      setStep('checkout')
      setCodeInput(pending)
      void applyCode(pending)
    }
    restore()
  }, [isLoggedIn])

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return
    if (!isLoggedIn) {
      // Held in localStorage so the code outlives the trip to the inbox and back — the magic-link
      // path reloads this page, and even the in-place code path shouldn't make anyone retype it.
      savePendingDiscountCode(codeInput.trim())
      setAuthOpen(true)
      return
    }
    await applyCode(codeInput)
  }

  const handleRemoveCode = () => {
    setAppliedCode(null)
    setCodeError('')
  }

  const handlePay = async () => {
    if (!isLoggedIn) {
      setAuthOpen(true)
      return
    }
    setPaying(true)
    setPayError('')
    const result = await initiateCartCheckoutAction(cartLines, appliedCode?.code)
    if (!result.success) {
      setPaying(false)
      setPayError(result.error)
      return
    }
    if ('free' in result) {
      // A 100%-off code: the order is already paid and fulfilled, so there's no payment window.
      router.push(`/cart/complete?reference=${encodeURIComponent(result.reference)}`)
      return
    }
    try {
      await resumePaystackCheckout(result.accessCode, {
        onSuccess: (response) => {
          router.push(`/cart/complete?reference=${encodeURIComponent(response.reference)}`)
        },
        onCancel: () => setPaying(false),
        onError: (error) => {
          setPaying(false)
          setPayError(error.message || CHECKOUT_POPUP_ERROR)
        },
      })
    } catch {
      setPaying(false)
      setPayError(CHECKOUT_POPUP_ERROR)
    }
  }

  if (step === 'checkout') {
    return (
      <div className="px-5.5 pt-2 pb-10">
        <button type="button" onClick={() => setStep('cart')} className="-ml-3 flex h-11 w-11 items-center justify-center text-2xl text-[#1A1A2E]" aria-label="Back">
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
          {appliedCode && (
            <div className="mt-1 flex items-center justify-between text-[13px] font-semibold text-[#2E7D6B]">
              <span>{ctaCopy.cartCodeAppliedLine(appliedCode.code, appliedCode.percentOff)}</span>
              <span>-{formatPrice(codeDiscount, region)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-[#1A1A2E]/8 pt-2 text-[15px] font-bold text-[#1A1A2E]">
            <span>Total</span>
            <span>{formatPrice(totalAfterCode, region)}</span>
          </div>
        </div>
        {flags.discountCodes && (
          <div className="mt-4">
            {appliedCode ? (
              <button type="button" onClick={handleRemoveCode} className="text-[12.5px] font-bold text-[#C2185B] underline">
                {ctaCopy.cartCodeRemove}
              </button>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value)
                      setCodeError('')
                    }}
                    placeholder={ctaCopy.cartCodePlaceholder}
                    aria-label={ctaCopy.cartCodeLabel}
                    autoCapitalize="characters"
                    className="min-w-0 flex-1 rounded-[14px] border-[1.5px] border-[#1A1A2E]/14 bg-white p-3 text-[14px] text-[#1A1A2E] uppercase outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCode}
                    disabled={applyingCode || !codeInput.trim()}
                    className="shrink-0 rounded-[14px] border-[1.5px] border-[#C2185B] px-4 text-[13.5px] font-bold text-[#C2185B] disabled:opacity-50"
                  >
                    {applyingCode ? ctaCopy.cartCodeApplying : ctaCopy.cartCodeApply}
                  </button>
                </div>
                {codeError && (
                  <div role="alert" className="mt-1.5 text-[12.5px] text-[#C2185B]">
                    {codeError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {chargedInZar && !isFree && (
          <div className="mt-4 text-[12.5px] leading-relaxed font-semibold text-[#1A1A2E]">{ctaCopy.chargeCurrencyNote(zarTotal)}</div>
        )}
        <div className="mt-4 text-[12px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.cartCheckoutNote}</div>
        {!isLoggedIn && (
          <div className="mt-1.5 text-[12px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.cartCheckoutSignInNote}</div>
        )}
        {payError && <div className="mt-3 text-center text-[12.5px] text-[#C2185B]">{payError}</div>}
        <button
          type="button"
          onClick={handlePay}
          disabled={paying}
          className="mt-4 w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white disabled:opacity-50"
        >
          {paying ? ctaCopy.sendPaymentRedirecting : isFree ? ctaCopy.cartFreeCta : ctaCopy.cartPayCta(chargedInZar ? zarTotal : formatPrice(totalAfterCode, region))}
        </button>

        {authOpen && <AuthGate redirectTo="/cart" onClose={() => setAuthOpen(false)} />}
      </div>
    )
  }

  return (
    <div className="px-5.5 pt-2 pb-10">
      {authLinkFailed && (
        <div className="-mx-4">
          <AuthLinkFailedBanner
            onRetry={() => {
              dismissAuthLinkFailed()
              setResumeAuthOpen(true)
            }}
            onDismiss={dismissAuthLinkFailed}
          />
        </div>
      )}
      <h1 className="mt-2 text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
        {ctaCopy.cartHeading}
      </h1>
      {resumeAuthOpen && <AuthGate redirectTo="/cart" resumeFromFailedLink onClose={() => setResumeAuthOpen(false)} />}

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
              {hasGestureUnits && <span className="mt-0.5 block opacity-70">{ctaCopy.cartGesturesExcludedNote}</span>}
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

          {chargedInZar && (
            <div className="mt-3 text-[12px] leading-relaxed text-[#2C2C2C] opacity-70">{ctaCopy.chargeCurrencyNote(zarTotal)}</div>
          )}
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
