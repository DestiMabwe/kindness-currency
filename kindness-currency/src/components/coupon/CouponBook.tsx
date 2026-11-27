'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export type CouponBookProps = {
  /** One entry per page. Each fills the full width, so only one is ever in view. */
  slides: ReactNode[]
  /** Names the region for screen readers, e.g. "Your coupons". */
  label: string
}

// Swipeable pages. The browser's own scroll-snap does the swiping (no gesture library); this only
// keeps track of which page is showing and offers arrows, dots and arrow keys for people who
// can't, or don't want to, swipe.
export function CouponBook({ slides, label }: CouponBookProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const last = slides.length - 1

  const goTo = (target: number) => {
    const track = trackRef.current
    if (!track) return
    const page = Math.min(Math.max(target, 0), last)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: page * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' })
    setIndex(page)
  }

  const handleScroll = () => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    setIndex(Math.min(Math.max(Math.round(track.scrollLeft / track.clientWidth), 0), last))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') goTo(index + 1)
    else if (e.key === 'ArrowLeft') goTo(index - 1)
  }

  const showPager = slides.length > 1

  return (
    <section aria-label={label} tabIndex={0} onKeyDown={handleKeyDown} className="relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A2E]/40">
      <div
        ref={trackRef}
        data-testid="coupon-book-track"
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="page"
            aria-label={`${i + 1} of ${slides.length}`}
            className="flex w-full shrink-0 snap-center justify-center px-4 pt-5 pb-2"
          >
            {slide}
          </div>
        ))}
      </div>

      {showPager && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous coupon"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A2E] text-lg text-white disabled:opacity-25"
          >
            ‹
          </button>
          <div className="min-w-[70px] text-center">
            <div aria-live="polite" className="text-[13px] font-bold text-[#1A1A2E]">
              {`${index + 1} of ${slides.length}`}
            </div>
            <div className="mt-1.5 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to coupon ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 w-2 rounded-full ${i === index ? 'bg-[#1A1A2E]' : 'bg-[#1A1A2E]/25'}`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === last}
            aria-label="Next coupon"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A2E] text-lg text-white disabled:opacity-25"
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}
