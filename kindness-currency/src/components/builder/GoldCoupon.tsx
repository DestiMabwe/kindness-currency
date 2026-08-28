'use client'

// Wraps CouponCardHero with a metallic shine, layered on top rather than smuggled through the
// `accent` prop. `accent` also drives CouponCardHero's soft-glow effect (`${accent}33`, a
// hex-alpha string) and the decorative motif's `color:` — both silently break if `accent` is a
// gradient. Feeding it a plain antiqueGold hex keeps those working; the sheen is a separate
// pointer-events-none overlay clipped to the card's own rounded footprint.

import { CouponCardHero, type CouponCardHeroProps } from '@/components/coupon/CouponCardHero'
import { antiqueGold } from '@/lib/singleUseGestures'

// Deliberately no badge/overlay slot here beyond the shine: CouponCardHero's own top-right corner
// is already claimed by the decorative motif (see CouponCardHero.module.css .decorativeMotif,
// top:6px/right:10px) — anything else anchored there collides with it. Callers that need a badge
// (see GestureCard) place it outside this wrapper, in their own surrounding chrome, not on the card.
export function GoldCoupon(props: Omit<CouponCardHeroProps, 'accent'>) {
  return (
    // The 100% term matters: this wrapper is nested inside padded containers (the gallery's own
    // px-5.5, the card's px-4), so 92vw alone can exceed the space actually available and get
    // clipped by an ancestor's overflow-hidden — the same reason CouponCardHero's own CSS caps
    // itself at min(92vw, 100%), not 92vw alone.
    <div className="relative mx-auto" style={{ width: 'min(620px, 92vw, 100%)' }}>
      <CouponCardHero {...props} accent={antiqueGold} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[26px]"
        style={{
          background: 'linear-gradient(135deg, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%)',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  )
}
