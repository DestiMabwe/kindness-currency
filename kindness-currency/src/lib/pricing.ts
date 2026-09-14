// Pure pricing math — no 'use client', so this is safely importable from Server Actions and route
// handlers (cart.ts, which used to own this, is 'use client' and can't be). This is the one place
// a checkout charge amount is computed; server code must always recompute from {slug, qty} pairs
// here, never trust a client-sent total.

import { bundleTierBySlug, tierPrice, liveTemplateNameBySlug, pairedSlugBySlug, pairedBundlePrice } from '@/lib/bundleTiers'
import { singleUseGestures } from '@/lib/singleUseGestures'

const gestureBySlug = Object.fromEntries(singleUseGestures.map((g) => [g.slug, g]))

export type CartLineItem = { slug: string; qty: number }
export type CartLine = { slug: string; name: string; price: number; qty: number }

// The "Make This Gift Yours" upsell price for an otherwise-free gesture — same price point as a
// gesture that's paid from the start (see GestureFlow.tsx), not a separate tier.
export const GESTURE_UNLOCK_PRICE = 1.99

export function priceForSlug(slug: string): number | null {
  const tier = bundleTierBySlug[slug]
  if (tier) return tierPrice[tier]
  return gestureBySlug[slug]?.price ?? null
}

/** The checkout price for a given slug + product — 'gestureUnlock' is only meaningful for a
 * slug whose base price is 0 (a free gesture being unlocked for full customization); every other
 * slug/product combination falls back to priceForSlug. Never let a caller send a raw price. */
export function resolveCheckoutPrice(slug: string, product: 'base' | 'gestureUnlock'): number | null {
  if (product === 'gestureUnlock') {
    const gesture = gestureBySlug[slug]
    return gesture && gesture.price === 0 ? GESTURE_UNLOCK_PRICE : null
  }
  return priceForSlug(slug)
}

function nameForSlug(slug: string): string | undefined {
  return liveTemplateNameBySlug[slug] ?? gestureBySlug[slug]?.serviceTitle
}

export function linesForSlugs(slugs: string[]): CartLine[] {
  return slugs
    .map((slug) => {
      const price = priceForSlug(slug)
      const name = nameForSlug(slug)
      return price !== null && name ? { slug, name, price, qty: 1 } : null
    })
    .filter((line): line is CartLine => line !== null)
}

export function linesForCart(items: CartLineItem[]): CartLine[] {
  return items
    .map(({ slug, qty }) => {
      const price = priceForSlug(slug)
      const name = nameForSlug(slug)
      return price !== null && name ? { slug, name, price, qty } : null
    })
    .filter((line): line is CartLine => line !== null)
}

/** Each matched pair of a paired-bundle template (e.g. requested-by-him + requested-by-her) is
 * billed at pairedBundlePrice instead of full price each — see PRICING.md. Runs independently of
 * (and stacks with) the 3-for-2 mechanic below: pairing is a per-line pricing rule, 3-for-2 is a
 * per-cart-size rule, and PRICING.md doesn't say either should suppress the other. */
function pairDiscount(lines: CartLine[]): number {
  const bySlug = Object.fromEntries(lines.map((l) => [l.slug, l]))
  const seen = new Set<string>()
  let discount = 0
  for (const line of lines) {
    if (seen.has(line.slug)) continue
    const partner = bySlug[pairedSlugBySlug[line.slug]]
    if (!partner) continue
    seen.add(line.slug)
    seen.add(partner.slug)
    const pairs = Math.min(line.qty, partner.qty)
    discount += pairs * (line.price + partner.price - pairedBundlePrice)
  }
  return discount
}

/** The single cheapest unit is free once the cart holds 3 or more units total (across any mix of
 * lines/quantities) — mirrors PRICING.md's 3-for-2 mechanic. */
export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  const pairSavings = pairDiscount(lines)
  const totalUnits = lines.reduce((sum, l) => sum + l.qty, 0)
  if (totalUnits < 3) {
    return { subtotal, pairDiscount: pairSavings, discount: 0, total: subtotal - pairSavings, freeSlug: null as string | null }
  }
  const cheapest = lines.reduce((min, l) => (l.price < min.price ? l : min), lines[0])
  return {
    subtotal,
    pairDiscount: pairSavings,
    discount: cheapest.price,
    total: subtotal - pairSavings - cheapest.price,
    freeSlug: cheapest.slug,
  }
}
