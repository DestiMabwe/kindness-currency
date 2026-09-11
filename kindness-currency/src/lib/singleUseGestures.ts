// Display/pricing fixture for the single-use "gesture" gallery on /create — a fixed, hand-curated
// set rather than rows this file reads from a table. Each gesture does have a real one-coupon
// `templates` row now (see supabase/seed.sql), matched by slug, so coupon_sets.template_id has
// something valid to reference when a gesture is saved/sent (GestureFlow.tsx) — distinguished from
// bundle templates by templates.is_single_use, a boolean, not a template_type TEXT enum (see
// CLAUDE.md's ban on that). Content here (motif, price, message starter) stays out of the DB.

export type SingleUseGestureSlug =
  | 'relief'
  | 'presence'
  | 'celebration'
  | 'repair'
  | 'restoration'
  | 'encouragement'
  | 'adventure'
  | 'honest-truth'

export type SingleUseGesture = {
  slug: SingleUseGestureSlug
  serviceTitle: string
  microCopy: string
  finePrint: string
  motif: string
  // Pricing model: a sender's first 5 gestures (ever, per account) are free; every one after
  // that is $1.99. Here that's fixture-level — each gesture just carries what it costs, not
  // which "slot number" it'd be for a given sender (there's no account/counter in this mock).
  price: number
  // A suggested opening line for the sender's message, tailored to this gesture — offered as a
  // tappable starting point on paid gestures only (see GestureFlow's isPaid checks), since free
  // gestures don't get this extra nudge any more than they get editable coupon text.
  messageStarter?: string
}

// Shared across every single-use card — deliberately one color for the whole tier, distinct from
// every bundle-template accent and from the two sitewide functional colors (Kindness Red, Warmth Amber).
// Kept as a plain hex, not a gradient: CouponCardHero's `accent` prop also feeds a hex-alpha
// string (the soft-glow effect) and a plain `color:` (the motif tint), both of which silently
// break on a gradient value. The shine is layered on top instead — see GoldCoupon.tsx.
export const antiqueGold = '#D4AF37'

// antiqueGold as actual text (badges, labels) on a light background fails contrast — gold is
// inherently too light a hue at this saturation. This darker bronze keeps the "gold family"
// association while staying legible; antiqueGold itself stays reserved for the frame/border/ring
// uses where it sits against white or transparent, not as small text.
export const antiqueGoldText = '#8B6F1F'

// Free gestures listed first, paid ones after — matches the gallery's display order.
export const singleUseGestures: SingleUseGesture[] = [
  {
    slug: 'relief',
    serviceTitle: 'Rescue Mission',
    microCopy: 'Let me take over something for you — you choose what',
    finePrint: "Redeemable whenever it's heavy",
    motif: '☁',
    price: 0,
    messageStarter: "You've had a lot on your plate lately — let me take one thing off it.",
  },
  {
    slug: 'presence',
    serviceTitle: 'Quiet Visit',
    microCopy: "I'll come sit with you. We don't have to talk",
    finePrint: 'No agenda · Just show up as you are',
    motif: '◐',
    price: 0,
    messageStarter: "I don't need to fix anything. I just want to be there with you.",
  },
  {
    slug: 'encouragement',
    serviceTitle: 'Pep Talk',
    microCopy: "You've got this — let me remind you why",
    finePrint: 'Whenever the doubt creeps in',
    motif: '✯',
    price: 0,
    messageStarter: "I see how hard you're trying, and I need you to hear that from me.",
  },
  {
    slug: 'repair',
    serviceTitle: 'Do-Over',
    microCopy: 'Let me make this right, however that looks',
    finePrint: "No conditions · Redeemable when you're ready",
    motif: '✚',
    price: 0,
    messageStarter: "I know I got this wrong — let me make it right, on your terms.",
  },
  {
    slug: 'restoration',
    serviceTitle: 'Recharge Session',
    microCopy: "You've been giving so much — let me pour into you",
    finePrint: "For the one who's always giving first",
    motif: '❁',
    price: 0,
    messageStarter: "You give so much to everyone else. Let me give some of it back to you.",
  },
  {
    slug: 'celebration',
    serviceTitle: 'Night Out',
    microCopy: 'Let me take you out to celebrate — just us',
    finePrint: 'For the win nobody else noticed',
    motif: '✧',
    price: 1.99,
    messageStarter: "I've been wanting to celebrate you properly — no better excuse than tonight.",
  },
  {
    slug: 'adventure',
    serviceTitle: 'Spontaneous Escape',
    microCopy: "Let's go somewhere — no plan needed",
    finePrint: 'No itinerary required',
    motif: '↯',
    price: 1.99,
    messageStarter: "You've been dreaming of getting away — let's just go, no plan needed.",
  },
  {
    slug: 'honest-truth',
    serviceTitle: 'Hard Talk',
    microCopy: "There's something we need to say out loud",
    finePrint: 'Said with love, not blame',
    motif: '◆',
    price: 1.99,
    messageStarter: "There's something I've been wanting to say to you, and I want to say it with love.",
  },
]
