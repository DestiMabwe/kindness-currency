'use client'

// 3-for-2 popup on /create. Reuses the app's established bottom-sheet modal pattern (see
// DESIGN.md's Confirmation Modal / AgeGate / ComingSoonModal) rather than a centered dialog, for
// visual consistency with every other modal in the product.
//
// Opens after the visitor's first add to cart — the moment "buy 3, get the cheapest free" is
// actually relevant — not on page load or scroll, so it never interrupts someone who is still
// just looking. A short delay lets the add button's own "Added ✓" confirmation play out first.
// It respects the session dismiss and only ever opens once, and adding a one-time gesture (which
// the offer excludes) never triggers it.

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'
import { CART_ITEM_ADDED_EVENT } from '@/lib/cart'
import { singleUseGestures } from '@/lib/singleUseGestures'

const DISMISS_KEY = 'kindness-currency:promo-popup-dismissed'
// Just past the add button's 1.3s "Added ✓" state (CouponSetBuilder's handleAddToCart).
const SHOW_AFTER_ADD_MS = 1400

function slugFromAddEvent(event: Event): string | null {
  if (!(event instanceof CustomEvent)) return null
  const detail: unknown = event.detail
  if (typeof detail === 'object' && detail !== null && 'slug' in detail && typeof detail.slug === 'string') {
    return detail.slug
  }
  return null
}

// `suppressed` stops the auto-open while the visitor is shopping one-time gestures, which the
// offer explicitly excludes. It doesn't consume the once-per-session auto-show.
export function PromoScrollPopup({ suppressed = false }: { suppressed?: boolean }) {
  const [open, setOpen] = useState(false)
  const autoShown = useRef(false)
  const suppressedRef = useRef(suppressed)

  useEffect(() => {
    suppressedRef.current = suppressed
  }, [suppressed])

  const autoShow = useCallback(() => {
    if (autoShown.current) return
    if (suppressedRef.current) return
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(DISMISS_KEY) === 'true') return
    autoShown.current = true
    setOpen(true)
  }, [])

  useEffect(() => {
    let timer: number | undefined
    const handleAdded = (event: Event) => {
      const slug = slugFromAddEvent(event)
      if (slug && singleUseGestures.some((g) => g.slug === slug)) return
      window.clearTimeout(timer)
      timer = window.setTimeout(autoShow, SHOW_AFTER_ADD_MS)
    }
    window.addEventListener(CART_ITEM_ADDED_EVENT, handleAdded)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(CART_ITEM_ADDED_EVENT, handleAdded)
    }
  }, [autoShow])

  const dismiss = () => {
    setOpen(false)
    window.sessionStorage.setItem(DISMISS_KEY, 'true')
  }

  const dialogRef = useDialogA11y<HTMLDivElement>(open, dismiss)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-heading"
        className="w-full rounded-t-[26px] bg-[#FFF8F0] px-6 pt-7 pb-8"
      >
        <div className="flex items-start justify-between">
          <h2
            id="promo-popup-heading"
            className="text-2xl font-extrabold text-[#1A1A2E] italic"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {ctaCopy.promoPopupHeading}
          </h2>
          <button type="button" onClick={dismiss} aria-label="Close" className="p-1 text-xl text-[#1A1A2E]">
            ✕
          </button>
        </div>
        <div className="mt-3 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-85">{ctaCopy.promoPopupBody}</div>
        <Link
          href="/pricing"
          onClick={dismiss}
          className="mt-5 block w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white"
        >
          {ctaCopy.promoPopupCta}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 w-full p-1.5 text-center font-sans text-[13.5px] font-semibold text-[#2C2C2C] opacity-70"
        >
          {ctaCopy.promoPopupDismiss}
        </button>
      </div>
    </div>
  )
}
