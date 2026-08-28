'use client'

// The single-use "gesture" gallery on /create — one focused act-of-service coupon per card,
// distinct from the 8-coupon bundle templates below it. Not wired to Supabase; uses fixture data
// from src/lib/singleUseGestures.ts (see CLAUDE.md's ban on a template_type TEXT enum).

import { GoldCoupon } from '@/components/builder/GoldCoupon'
import { ctaCopy } from '@/constants/ctaCopy'
import { antiqueGold, antiqueGoldText, type SingleUseGesture } from '@/lib/singleUseGestures'

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
  onChoose,
}: {
  gestures: SingleUseGesture[]
  layout: 'carousel' | 'stack' | 'hidden'
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
          <SingleUseStack gestures={gestures} onChoose={onChoose} />
        ) : (
          <SingleUseCarousel gestures={gestures} onChoose={onChoose} />
        )}
      </div>
    </div>
  )
}

function GestureCard({ gesture, onChoose }: { gesture: SingleUseGesture; onChoose: (g: SingleUseGesture) => void }) {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-[0_14px_30px_-24px_rgba(26,26,46,0.5)]"
      style={{ border: `1px solid ${antiqueGold}40` }}
    >
      <div className="flex justify-end px-4 pt-3">
        <span
          className="rounded-full border bg-white px-1.75 py-0.5 text-[9px] font-bold tracking-[0.08em]"
          style={{ borderColor: antiqueGold, color: antiqueGoldText }}
        >
          {gesture.price === 0 ? 'FREE' : `$${gesture.price.toFixed(2)}`}
        </span>
      </div>

      <div className="px-4 pt-1">
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
      </div>

      <div className="px-4 pt-3 pb-4">
        <button
          type="button"
          onClick={() => onChoose(gesture)}
          className="w-full rounded-2xl bg-[#C2185B] p-3 text-center font-sans text-[14.5px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(194,24,91,0.7)]"
        >
          {ctaCopy.singleUseChooseCta}
        </button>
      </div>
    </div>
  )
}

function SingleUseStack({ gestures, onChoose }: { gestures: SingleUseGesture[]; onChoose: (g: SingleUseGesture) => void }) {
  return (
    <div className="flex flex-col gap-5 px-5.5 pb-2">
      {gestures.map((gesture) => (
        <GestureCard key={gesture.slug} gesture={gesture} onChoose={onChoose} />
      ))}
    </div>
  )
}

// No-peek carousel: each slide fills the full viewport width, so exactly one card is ever visible
// at a time — nothing from a neighboring card shows at the edges. Native scroll-snap handles the
// swipe; every visible card is always "the current one," so there's no focus/dimming state to track.
function SingleUseCarousel({ gestures, onChoose }: { gestures: SingleUseGesture[]; onChoose: (g: SingleUseGesture) => void }) {
  return (
    <div className="flex snap-x snap-mandatory overflow-x-auto pb-2">
      {gestures.map((gesture) => (
        <div key={gesture.slug} className="w-full shrink-0 snap-center px-5.5">
          <GestureCard gesture={gesture} onChoose={onChoose} />
        </div>
      ))}
    </div>
  )
}
