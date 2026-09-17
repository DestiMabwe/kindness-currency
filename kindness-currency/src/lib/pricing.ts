// Pure pricing math — no 'use client', so this is safely importable from Server Actions and route
// handlers (cart.ts, which used to own this, is 'use client' and can't be). This is the one place
// a checkout charge amount is computed; server code must always recompute from {slug, qty} pairs
// here, never trust a client-sent total.
//
// Display price (what a visitor sees) and settlement price (what Paystack actually charges, always
// ZAR — see geoPricing.ts) are two separate lookups over the same slugs. cartTotals() itself stays
// currency-agnostic: it takes whichever price table's lines you hand it, plus that table's own
// paired-bundle price, and applies the same 3-for-2 / pair-discount math either way.

import { bundleTierBySlug, liveTemplateNameBySlug, pairedSlugBySlug } from '@/lib/bundleTiers'
import { singleUseGestures } from '@/lib/singleUseGestures'
import {
  REGION_TIER_PRICE,
  REGION_GESTURE_UNLOCK_PRICE,
  gesturePriceForRegion,
  settlementGesturePriceForBucket,
  SETTLEMENT_TIER_PRICE_ZAR,
  SETTLEMENT_GESTURE_UNLOCK_PRICE_ZAR,
  type PricingRegion,
  type SettlementBucket,
} from '@/lib/geoPricing'

const gestureBySlug = Object.fromEntries(singleUseGestures.map((g) => [g.slug, g]))

export type CartLineItem = { slug: string; qty: number }
export type CartLine = { slug: string; name: string; price: number; qty: number }

export function priceForSlug(slug: string, region: PricingRegion): number | null {
  const tier = bundleTierBySlug[slug]
  if (tier) return REGION_TIER_PRICE[region][tier]
  const gesture = gestureBySlug[slug]
  return gesture ? gesturePriceForRegion(gesture, region) : null
}

/** The checkout price for a given slug + product — 'gestureUnlock' is only meaningful for a
 * slug whose base price is 0 (a free gesture being unlocked for full customization); every other
 * slug/product combination falls back to priceForSlug. Never let a caller send a raw price. */
export function resolveCheckoutPrice(slug: string, product: 'base' | 'gestureUnlock', region: PricingRegion): number | null {
  if (product === 'gestureUnlock') {
    const gesture = gestureBySlug[slug]
    return gesture && gesture.price === 0 ? REGION_GESTURE_UNLOCK_PRICE[region] : null
  }
  return priceForSlug(slug, region)
}

function nameForSlug(slug: string): string | undefined {
  return liveTemplateNameBySlug[slug] ?? gestureBySlug[slug]?.serviceTitle
}

export function linesForSlugs(slugs: string[], region: PricingRegion): CartLine[] {
  return slugs
    .map((slug) => {
      const price = priceForSlug(slug, region)
      const name = nameForSlug(slug)
      return price !== null && name ? { slug, name, price, qty: 1 } : null
    })
    .filter((line): line is CartLine => line !== null)
}

export function linesForCart(items: CartLineItem[], region: PricingRegion): CartLine[] {
  return items
    .map(({ slug, qty }) => {
      const price = priceForSlug(slug, region)
      const name = nameForSlug(slug)
      return price !== null && name ? { slug, name, price, qty } : null
    })
    .filter((line): line is CartLine => line !== null)
}

/** Each matched pair of a paired-bundle template (e.g. requested-by-him + requested-by-her) is
 * billed at pairedPrice instead of full price each. Runs independently of (and stacks with) the
 * 3-for-2 mechanic below: pairing is a per-line pricing rule, 3-for-2 is a per-cart-size rule,
 * and neither suppresses the other. */
function pairDiscount(lines: CartLine[], pairedPrice: number): number {
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
    discount += pairs * (line.price + partner.price - pairedPrice)
  }
  return discount
}

/** The single cheapest unit is free once the cart holds 3 or more coupon-book units total (across
 * any mix of lines/quantities) — mirrors the 3-for-2 mechanic. One-time gestures are priced and
 * sold individually (see resolveCheckoutPrice's gestureUnlock case) and never count toward the
 * threshold or qualify as the free unit — 3-for-2 is a coupon-book bulk discount, not a
 * storewide one. Currency-agnostic: pass display lines + REGION_PAIRED_BUNDLE_PRICE[region] for
 * what a visitor sees, or settlement lines + SETTLEMENT_PAIRED_BUNDLE_PRICE_ZAR[bucket] for what
 * Paystack actually charges — same math. */
export function cartTotals(lines: CartLine[], pairedPrice: number) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  const pairSavings = pairDiscount(lines, pairedPrice)

  const bookLines = lines.filter((l) => !(l.slug in gestureBySlug))
  const bookUnits = bookLines.reduce((sum, l) => sum + l.qty, 0)
  if (bookUnits < 3) {
    return { subtotal, pairDiscount: pairSavings, discount: 0, total: subtotal - pairSavings, freeSlug: null as string | null, bookUnits }
  }
  const cheapest = bookLines.reduce((min, l) => (l.price < min.price ? l : min), bookLines[0])
  return {
    subtotal,
    pairDiscount: pairSavings,
    discount: cheapest.price,
    total: subtotal - pairSavings - cheapest.price,
    freeSlug: cheapest.slug,
    bookUnits,
  }
}

// --- Settlement (what Paystack actually charges — always ZAR) ---------------------------------
// Same shape as the display-price functions above, sourced from geoPricing.ts's settlement
// tables instead. Used only by checkoutService.ts.

export function settlementPriceForSlug(slug: string, bucket: SettlementBucket): number | null {
  const tier = bundleTierBySlug[slug]
  if (tier) return SETTLEMENT_TIER_PRICE_ZAR[bucket][tier]
  const gesture = gestureBySlug[slug]
  return gesture ? settlementGesturePriceForBucket(gesture, bucket) : null
}

export function resolveSettlementPrice(slug: string, product: 'base' | 'gestureUnlock', bucket: SettlementBucket): number | null {
  if (product === 'gestureUnlock') {
    const gesture = gestureBySlug[slug]
    return gesture && gesture.price === 0 ? SETTLEMENT_GESTURE_UNLOCK_PRICE_ZAR[bucket] : null
  }
  return settlementPriceForSlug(slug, bucket)
}

export function settlementLinesForCart(items: CartLineItem[], bucket: SettlementBucket): CartLine[] {
  return items
    .map(({ slug, qty }) => {
      const price = settlementPriceForSlug(slug, bucket)
      const name = nameForSlug(slug)
      return price !== null && name ? { slug, name, price, qty } : null
    })
    .filter((line): line is CartLine => line !== null)
}
