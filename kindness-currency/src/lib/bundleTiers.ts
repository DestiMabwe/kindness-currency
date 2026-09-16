// Maps every bundle template (live + coming-soon) to PRICING.md's three pricing tiers, for the
// /create tier-pill filter and the /pricing page. PRICING.md's tier tables already assign every
// template a tier by slug; this mirrors that mapping in code (the real `templates`/
// `coming_soon_templates` tables have no tier/price column yet — that's a separate schema
// decision, not made here).

export type BundleTier = 'everyday' | 'occasion' | 'romance'

// Live templates (src/lib/templateRepository.ts) + coming-soon templates
// (src/lib/comingSoonTemplateRepository.ts), by slug — see PRICING.md's per-tier tables.
export const bundleTierBySlug: Record<string, BundleTier> = {
  // Live
  mothers_day: 'everyday',
  birthday: 'everyday',
  besties: 'everyday',
  valentines: 'occasion',
  lovers: 'romance',
  'requested-by-him': 'romance',
  'requested-by-her': 'romance',
  // Coming soon
  dads: 'everyday',
  siblings: 'everyday',
  'meal-coupons': 'everyday',
  'movie-marathon': 'everyday',
  christmas: 'occasion',
  'travel-buddies': 'occasion',
  'shopping-spree': 'occasion',
  'long-distance-lovers': 'occasion',
}

// requested-by-him + requested-by-her are individually Romance-tier, but are priced as a couple's
// bundle when both are in the cart rather than full price + full price — surfaced as a footnote
// on the pricing page, not modeled as its own tier. The actual bundle price is region-specific
// (see geoPricing.ts's REGION_PAIRED_BUNDLE_PRICE), not a flat constant.

// The other half of each paired-bundle idea, by slug — see pairedBundlePrice. Used both to show
// "Pairs with X" on the template card/teaser and, in cart.ts, to detect when both halves are in
// the cart together so the pairing discount actually applies at checkout.
export const pairedSlugBySlug: Record<string, string> = {
  'requested-by-him': 'requested-by-her',
  'requested-by-her': 'requested-by-him',
}

// Only the 7 live templates are ever addable to the cart (coming-soon ones are teasers only, not
// purchasable), so the cart view only needs names for these — avoids a server round-trip from a
// client component just to label cart lines.
export const liveTemplateNameBySlug: Record<string, string> = {
  mothers_day: "Mom's Promise Tokens",
  birthday: 'Birthday Joy Tokens',
  besties: "Bestie's Surprise Passes",
  valentines: "Valentine's Love Passes",
  lovers: "Lover's Intimate Promises",
  'requested-by-him': "Requested By Him: Lover's Wishes",
  'requested-by-her': "Requested By Her: Lover's Wishes",
}
