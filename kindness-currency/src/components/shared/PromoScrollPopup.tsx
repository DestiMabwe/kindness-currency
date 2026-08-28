'use client'

// 3-for-2 popup on /create. Reuses the app's established bottom-sheet modal pattern (see
// DESIGN.md's Confirmation Modal / AgeGate / ComingSoonModal) rather than a centered dialog, for
// visual consistency with every other modal in the product.
//
// Three ways in, all funneling through the same `show`/hasShown guard so only one ever actually
// opens it: a fixed delay (fires deterministically regardless of whether/how a visitor scrolls —
// touch swipes inside the gesture carousel, a short viewport, or reading before scrolling all
// behave differently on scroll events but identically on a timer), a low scroll distance as an
// earlier fallback for anyone who scrolls quickly, and an imperative `show()` exposed via ref that
// the parent calls the moment someone taps "Gestures, made for them" — the highest-intent moment
// for this promo, since that view is bundle templates only (the deal explicitly excludes one-time
// gestures). Exposed via ref rather than a prop bump + effect so the parent's click handler can
// call it directly, an event-driven trigger rather than a setState-in-effect cascade.
// Dismiss is sessionStorage-scoped, not permanent: this is a revenue-driving promo, so it should
// resurface every new visit rather than vanishing forever the first time anyone closes it.

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'

const DISMISS_KEY = 'kindness-currency:promo-popup-dismissed'
const TRIGGER_DELAY_MS = 3500
const SCROLL_THRESHOLD_PX = 200

export type PromoScrollPopupHandle = { show: () => void }

export const PromoScrollPopup = forwardRef<PromoScrollPopupHandle>(function PromoScrollPopup(_props, ref) {
  const [open, setOpen] = useState(false)
  const hasShown = useRef(false)

  const show = useCallback(() => {
    if (hasShown.current) return
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(DISMISS_KEY) === 'true') return
    hasShown.current = true
    setOpen(true)
  }, [])

  useImperativeHandle(ref, () => ({ show }), [show])

  useEffect(() => {
    const timer = window.setTimeout(show, TRIGGER_DELAY_MS)
    const handleScroll = () => {
      if (window.scrollY > SCROLL_THRESHOLD_PX) show()
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [show])

  const dismiss = () => {
    setOpen(false)
    window.sessionStorage.setItem(DISMISS_KEY, 'true')
  }

  const dialogRef = useDialogA11y<HTMLDivElement>(open, dismiss)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
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
})
