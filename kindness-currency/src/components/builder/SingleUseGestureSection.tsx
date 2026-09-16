'use client'

// The single-use "gesture" gallery on /create — one focused act-of-service coupon per card,
// distinct from the 8-coupon bundle templates below it. Display/pricing content comes from the
// src/lib/singleUseGestures.ts fixture; each gesture also has a real one-coupon `templates` row
// (see GestureFlow.tsx) so Save/Send can write a real coupon_sets row.

import { useEffect, useRef, useState } from 'react'
import { GoldCoupon } from '@/components/builder/GoldCoupon'
import { QuantityStepper } from '@/components/builder/QuantityStepper'
import { addToCart } from '@/lib/cart'
import { ctaCopy } from '@/constants/ctaCopy'
import { antiqueGold, type SingleUseGesture } from '@/lib/singleUseGestures'
import { gesturePriceForRegion, formatPrice, type PricingRegion } from '@/lib/geoPricing'

export type FilterValue = 'all' | 'focused' | 'range'

export function FilterPills({ value, onChange }: { value: FilterValue; onChange: (value: FilterValue) => void }) {
  const pills: { value: FilterValue; label: string }[] = [
    { value: 'all', label: ctaCopy.filterPillAll },
    { value: 'focused', label: ctaCopy.filterPillFocused },
    { value: 'range', label: ctaCopy.filterPillRange },
  ]
  return (
    <div className="flex gap-1 overflow-x-auto px-5.5 pb-4">
      {pills.map((pill) => (
        <button
          key={pill.value}
          type="button"
          aria-pressed={value === pill.value}
          onClick={() => onChange(pill.value)}
          className="shrink-0 rounded-full px-2 py-1.5 text-[10px] font-semibold whitespace-nowrap transition-colors"
          style={{
            backgroundColor: value === pill.value ? '#1A1A2E' : '#F0ECE4',
            color: value === pill.value ? '#fff' : '#2C2C2C',
          }}
        >
          {pill.label}
        </button>
      ))}
    </div>
  )
}

export function SingleUseGestureSection({
  gestures,
  layout,
  region,
  onChoose,
}: {
  gestures: SingleUseGesture[]
  layout: 'carousel' | 'stack' | 'hidden'
  region: PricingRegion
  onChoose: (gesture: SingleUseGesture) => void
}) {
  if (layout === 'hidden') return null

  return (
    <div className="bg-[#0a1f44] py-5">
      <div className="px-5.5">
        <h2 className="text-[22px] font-bold text-[#eaeaf2]" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.singleUseSectionHeading}
        </h2>
        <div className="mt-0.75 text-[12.5px] text-white/70">{ctaCopy.singleUseSectionSubheading}</div>
      </div>
      <div className="mt-4">
        {layout === 'stack' ? (
          <SingleUseStack gestures={gestures} region={region} onChoose={onChoose} />
        ) : (
          <SingleUseCarousel gestures={gestures} region={region} onChoose={onChoose} />
        )}
      </div>
    </div>
  )
}

function GestureCard({
  gesture,
  region,
  onChoose,
}: {
  gesture: SingleUseGesture
  region: PricingRegion
  onChoose: (g: SingleUseGesture) => void
}) {
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const justAddedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPaid = gesture.price > 0
  const unitPrice = gesturePriceForRegion(gesture, region)

  useEffect(() => () => {
    if (justAddedTimeout.current) clearTimeout(justAddedTimeout.current)
  }, [])

  const handleAddToCart = () => {
    addToCart(gesture.slug, qty)
    setQty(1)
    // Same confirmed-state pattern as the bundle template card: holds the button in its "Added"
    // state long enough to read before reverting, so a hesitant re-tap can't silently double it up.
    setJustAdded(true)
    if (justAddedTimeout.current) clearTimeout(justAddedTimeout.current)
    justAddedTimeout.current = setTimeout(() => setJustAdded(false), 1300)
  }

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-[0_14px_30px_-24px_rgba(26,26,46,0.5)]"
      style={{ border: `1px solid ${antiqueGold}40` }}
    >
      {/* Tapping the coupon itself opens the design flow directly, same as tapping a bundle
          template card — works regardless of price. The priced button below is the separate,
          explicit "buy now" action (bulk add-to-cart), mirroring the bundle card exactly. */}
      <button type="button" onClick={() => onChoose(gesture)} className="block w-full px-4 pt-4 text-left">
        <GoldCoupon
          serviceTitle={gesture.serviceTitle}
          microCopy={gesture.microCopy}
          finePrint={gesture.finePrint}
          backgroundEffect="none"
          motif={gesture.motif}
          imageSrc={null}
          expiresAt={null}
          status="sent"
        />
      </button>

      <div className="flex flex-col gap-2.5 px-4 pt-3 pb-4">
        {isPaid ? (
          // Priced gestures get one CTA, not two: the price lives on the button itself (matching
          // the bundle template card's "Design My Gift · $total" pattern) instead of a separate
          // "Choose This" that skipped straight to designing without ever showing a price.
          <div className="flex items-center gap-2">
            <QuantityStepper
              value={qty}
              onDecrease={() => setQty((q) => Math.max(1, q - 1))}
              onIncrease={() => setQty((q) => q + 1)}
              decreaseLabel={ctaCopy.qtyDecreaseLabel(gesture.serviceTitle)}
              increaseLabel={ctaCopy.qtyIncreaseLabel(gesture.serviceTitle)}
            />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={justAdded}
              className="flex-1 rounded-2xl p-3 text-center font-sans text-[14.5px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,24,91,0.7)] transition-colors duration-300"
              style={{ backgroundColor: justAdded ? '#2E7D6B' : '#C2185B' }}
            >
              <span aria-live="polite" className={justAdded ? 'kc-pop inline-block' : 'inline-block'}>
                {justAdded ? ctaCopy.designMyGiftAddedCta : ctaCopy.designMyGiftCta(formatPrice(unitPrice * qty, region))}
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onChoose(gesture)}
            className="w-full rounded-2xl bg-[#C2185B] p-3 text-center font-sans text-[14.5px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,24,91,0.7)]"
          >
            {ctaCopy.singleUseFreeCta}
          </button>
        )}
      </div>
    </div>
  )
}

function SingleUseStack({
  gestures,
  region,
  onChoose,
}: {
  gestures: SingleUseGesture[]
  region: PricingRegion
  onChoose: (g: SingleUseGesture) => void
}) {
  return (
    <div className="flex flex-col gap-5 px-5.5 pb-2">
      {gestures.map((gesture) => (
        <GestureCard key={gesture.slug} gesture={gesture} region={region} onChoose={onChoose} />
      ))}
    </div>
  )
}

// No-peek carousel: each slide fills the full viewport width, so exactly one card is ever visible
// at a time — nothing from a neighboring card shows at the edges. Native scroll-snap handles the
// swipe; every visible card is always "the current one," so there's no focus/dimming state to track.
function SingleUseCarousel({
  gestures,
  region,
  onChoose,
}: {
  gestures: SingleUseGesture[]
  region: PricingRegion
  onChoose: (g: SingleUseGesture) => void
}) {
  return (
    <div className="flex snap-x snap-mandatory overflow-x-auto pb-2">
      {gestures.map((gesture) => (
        <div key={gesture.slug} className="w-full shrink-0 snap-center px-5.5">
          <GestureCard gesture={gesture} region={region} onChoose={onChoose} />
        </div>
      ))}
    </div>
  )
}
