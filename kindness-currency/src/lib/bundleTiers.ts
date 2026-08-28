// Maps every bundle template (live + coming-soon) to PRICING.md's three pricing tiers, for the
// /create tier-pill filter and the /pricing page. PRICING.md's tier tables already assign every
// template a tier by slug; this mirrors that mapping in code (the real `templates`/
// `coming_soon_templates` tables have no tier/price column yet — that's a separate schema
// decision, not made here).

export type BundleTier = 'everyday' | 'occasion' | 'romance'

export const tierPrice: Record<BundleTier, number> = {
  everyday: 2.99,
  occasion: 4.99,
  romance: 6.99,
}

export const flagshipPrice = 9.99

// Live templates (src/lib/templateRepository.ts) + coming-soon templates
// (src/lib/comingSoonTemplateRepository.ts), by slug — see PRICING.md's per-tier tables.
export const bundleTierBySlug: Record<string, BundleTier> = {
  // Live
  mothers_day: 'everyday',
  birthday: 'everyday',
  besties: 'everyday',
  valentines: 'occasion',
  lovers: 'romance',
  // Coming soon
  dads: 'everyday',
  siblings: 'everyday',
  'meal-coupons': 'everyday',
  'movie-marathon': 'everyday',
  christmas: 'occasion',
  'travel-buddies': 'occasion',
  'shopping-spree': 'occasion',
  'long-distance-lovers': 'occasion',
  'made-by-him': 'romance',
  'made-by-her': 'romance',
}

// made-by-him + made-by-her are individually Romance-tier, but PRICING.md prices them as a
// $9.99 couple's bundle when both are in the cart rather than $6.99 + $6.99 — surfaced as a
// footnote on the pricing page, not modeled as its own tier.
export const pairedBundlePrice = 9.99

// Only the 5 live templates are ever addable to the cart (coming-soon ones are teasers only, not
// purchasable), so the cart view only needs names for these — avoids a server round-trip from a
// client component just to label cart lines.
export const liveTemplateNameBySlug: Record<string, string> = {
  mothers_day: "Mom's Promise Tokens",
  birthday: 'Birthday Joy Tokens',
  besties: "Bestie's Surprise Passes",
  valentines: "Valentine's Love Passes",
  lovers: "Lover's Intimate Promises",
}
