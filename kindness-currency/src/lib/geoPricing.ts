// Region-aware pricing — fixed manual price lists (McDonald's/Shopify-Markets style), not live FX
// conversion. Every number here is a deliberate business decision, not a formula. See PRICING.md
// for the tier model this extends and the conversation history for why: Paystack's merchant
// account is South African and can only ever settle in ZAR (USD/NGN/GHS/KES are all rejected as
// `unsupported_currency` — confirmed against the live API), so display currency and settlement
// currency are two separate concerns here, not the same number converted.

import type { BundleTier } from '@/lib/bundleTiers'
import type { SingleUseGesture } from '@/lib/singleUseGestures'

export type PricingRegion = 'US' | 'UK' | 'ZA'
export const DEFAULT_REGION: PricingRegion = 'US'

/** ISO 3166-1 alpha-2 country code (from Vercel's geo header) -> pricing region. Everyone not in
 * the UK or South Africa gets US/USD display — the international default, not a guess. */
export function regionFromCountryCode(code: string | null | undefined): PricingRegion {
  if (code === 'ZA') return 'ZA'
  if (code === 'GB') return 'UK'
  return DEFAULT_REGION
}

/** Guards a value that's already a PricingRegion (e.g. read back from a cookie or a `?region=`
 * override) — distinct from regionFromCountryCode, which maps a raw ISO country code instead. */
export function isPricingRegion(value: string | null | undefined): value is PricingRegion {
  return value === 'US' || value === 'UK' || value === 'ZA'
}

export const REGION_CURRENCY: Record<PricingRegion, { symbol: string; code: string }> = {
  US: { symbol: '$', code: 'USD' },
  UK: { symbol: '£', code: 'GBP' },
  ZA: { symbol: 'R', code: 'ZAR' },
}

/** The one place a price becomes display text — every hand-rolled `$${x.toFixed(2)}` in the
 * codebase routes through here instead. */
export function formatPrice(amount: number, region: PricingRegion): string {
  return `${REGION_CURRENCY[region].symbol}${amount.toFixed(2)}`
}

export const REGION_TIER_PRICE: Record<PricingRegion, Record<BundleTier, number>> = {
  US: { everyday: 2.99, occasion: 4.99, romance: 6.99 },
  UK: { everyday: 2.49, occasion: 3.99, romance: 5.49 },
  ZA: { everyday: 19.99, occasion: 34.99, romance: 49.99 },
}

export const REGION_FLAGSHIP_PRICE: Record<PricingRegion, number> = {
  US: 9.99,
  UK: 7.99,
  ZA: 69.99,
}

export const REGION_PAIRED_BUNDLE_PRICE: Record<PricingRegion, number> = {
  US: 9.99,
  UK: 7.99,
  ZA: 69.99,
}

export const REGION_GESTURE_UNLOCK_PRICE: Record<PricingRegion, number> = {
  US: 1.99,
  UK: 1.49,
  ZA: 14.99,
}

/** Free gestures stay free everywhere; a paid gesture's real amount always comes from the
 * region's unlock price, never the gesture fixture's own placeholder number (see
 * singleUseGestures.ts — its `price` field is a free/paid classifier now, not an amount). */
export function gesturePriceForRegion(gesture: SingleUseGesture, region: PricingRegion): number {
  return gesture.price === 0 ? 0 : REGION_GESTURE_UNLOCK_PRICE[region]
}

// --- Settlement (what Paystack actually charges) ---------------------------------------------
// Only ZAR is ever chargeable. Two buckets, not one per display region: South African visitors
// pay the SA display amount directly (it's already ZAR); everyone else pays a single
// "international" ZAR amount per tier. Adding a 4th display region later is one more display row
// above, never a new settlement bucket.

export type SettlementBucket = 'ZA' | 'INTL'

export function settlementBucketForRegion(region: PricingRegion): SettlementBucket {
  return region === 'ZA' ? 'ZA' : 'INTL'
}

export const SETTLEMENT_TIER_PRICE_ZAR: Record<SettlementBucket, Record<BundleTier, number>> = {
  ZA: REGION_TIER_PRICE.ZA,
  INTL: { everyday: 54.99, occasion: 89.99, romance: 124.99 },
}

export const SETTLEMENT_FLAGSHIP_PRICE_ZAR: Record<SettlementBucket, number> = {
  ZA: REGION_FLAGSHIP_PRICE.ZA,
  INTL: 179.99,
}

export const SETTLEMENT_PAIRED_BUNDLE_PRICE_ZAR: Record<SettlementBucket, number> = {
  ZA: REGION_PAIRED_BUNDLE_PRICE.ZA,
  INTL: 179.99,
}

export const SETTLEMENT_GESTURE_UNLOCK_PRICE_ZAR: Record<SettlementBucket, number> = {
  ZA: REGION_GESTURE_UNLOCK_PRICE.ZA,
  INTL: 34.99,
}

export function settlementGesturePriceForBucket(gesture: SingleUseGesture, bucket: SettlementBucket): number {
  return gesture.price === 0 ? 0 : SETTLEMENT_GESTURE_UNLOCK_PRICE_ZAR[bucket]
}
