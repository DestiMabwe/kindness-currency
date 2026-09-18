'use client'

// Shared cart icon + count badge, used both in /create's own headers (the builder and gesture
// flow each render their own, not SiteHeader) and inside SiteHeader itself, so the cart stays
// visible wherever a sender might be. Self-contained: reads the cart via useCartLines() rather
// than requiring every caller to pass the count down. Renders nothing once the cart is empty —
// every caller now sits next to a hamburger menu, so an empty slot never looks abandoned.

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { useCartLines } from '@/lib/cart'

export function CartIcon() {
  const cartLines = useCartLines()
  const totalUnits = cartLines.reduce((sum, l) => sum + l.qty, 0)
  if (totalUnits === 0) return null

  return (
    <Link
      href="/cart"
      aria-label={ctaCopy.cartLinkLabel(totalUnits)}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1A1A2E]/18"
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {totalUnits > 0 && (
        // Remounting on every count change (via `key`) replays the one-shot kc-pop settle —
        // the badge's own confirmation that an add actually landed, echoing the button's.
        <span
          key={totalUnits}
          style={{ '--kc-pop-delay': '0s' } as CSSProperties}
          className="kc-pop absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#C2185B] px-1 text-[9.5px] leading-none font-bold text-white"
        >
          {totalUnits}
        </span>
      )}
    </Link>
  )
}
