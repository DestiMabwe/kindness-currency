'use client'

// Scroll-triggered 3-for-2 popup, lives on /create. Reuses the app's established bottom-sheet
// modal pattern (see DESIGN.md's Confirmation Modal / AgeGate / ComingSoonModal) rather than a
// centered dialog, for visual consistency with every other modal in the product.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'

const DISMISS_KEY = 'kindness-currency:promo-popup-dismissed'
// A fixed pixel amount, not a fraction of total page height: /create's total scrollable height
// changes every time the filter pills swap in a different section (the combined "All coupons"
// view is much taller than either filtered view alone), so a percentage threshold either never
// fires on a tall view or fires immediately just from switching to a shorter one. A small fixed
// distance behaves the same regardless of which view is showing.
const SCROLL_THRESHOLD_PX = 400

export function PromoScrollPopup({ resetKey }: { resetKey?: string }) {
  const [open, setOpen] = useState(false)
  // Tracks which resetKey (filter view) the popup has already shown for, so switching pills gives
  // each view its own honest chance to trigger instead of "shown once, ever, for the whole page".
  const shownForKey = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(DISMISS_KEY) === 'true') return
    if (shownForKey.current === resetKey) return

    const handleScroll = () => {
      if (shownForKey.current === resetKey) return
      if (window.scrollY > SCROLL_THRESHOLD_PX) {
        shownForKey.current = resetKey
        setOpen(true)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [resetKey])

  const dismiss = () => {
    setOpen(false)
    window.localStorage.setItem(DISMISS_KEY, 'true')
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
}
