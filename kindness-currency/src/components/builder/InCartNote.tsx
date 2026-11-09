'use client'

// Persistent "N in your cart · View cart" line under a card's add button. The button's own
// "Added ✓" confirmation only lasts ~1.3s, so this is what tells a buyer the add stuck and
// gives them a direct way to the cart afterwards.

import Link from 'next/link'
import { useCartLines } from '@/lib/cart'
import { ctaCopy } from '@/constants/ctaCopy'

export function InCartNote({ slug, className = '' }: { slug: string; className?: string }) {
  const qty = useCartLines().find((l) => l.slug === slug)?.qty ?? 0
  if (qty <= 0) return null

  return (
    <div className={`flex items-center justify-between text-[11.5px] ${className}`}>
      <span className="font-semibold text-[#2E7D6B]">{ctaCopy.inCartNote(qty)}</span>
      <Link href="/cart" className="font-semibold text-[#C2185B] underline underline-offset-2">
        {ctaCopy.viewCartLink}
      </Link>
    </div>
  )
}
