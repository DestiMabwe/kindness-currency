'use client'

// Shared cart icon + count badge, used both in /create's own header (which doesn't render
// SiteHeader at all) and inside SiteHeader itself, so the cart stays visible wherever a sender
// might be, not just on /create. Self-contained: reads the cart via useCartSlugs() rather than
// requiring every caller to pass the count down, and renders nothing once the cart is empty.

import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { useCartSlugs } from '@/lib/cart'

export function CartIcon() {
  const cartSlugs = useCartSlugs()
  if (cartSlugs.length === 0) return null

  return (
    <Link
      href="/cart"
      aria-label={ctaCopy.cartLinkLabel(cartSlugs.length)}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1A1A2E]/18"
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#C2185B] px-1 text-[9.5px] font-bold text-white">
        {cartSlugs.length}
      </span>
    </Link>
  )
}
