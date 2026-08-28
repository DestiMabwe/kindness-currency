'use client'

// Dismissable 3-for-2 announcement banner for the home page. Separate from the data-driven
// CampaignBanner (src/components/shared/CampaignBanner.tsx) rather than extending it: that
// component has no dismiss state today and is wired to campaignBannerRepository for live
// campaign content — bolting static dismiss logic onto it would touch real behavior other
// campaigns depend on.
//
// Dismiss is sessionStorage-scoped, not permanent: this is a revenue-driving promo, so it should
// resurface every new visit rather than vanishing forever the first time anyone closes it (which
// is what localStorage would do, and did — a single dismiss on a device silenced it there for good).

import { useEffect, useState } from 'react'
import { ctaCopy } from '@/constants/ctaCopy'

const DISMISS_KEY = 'kindness-currency:promo-banner-dismissed'

export function PromoBanner() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-mount sync from sessionStorage, not a render-time update
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  if (dismissed) return null

  return (
    <div className="flex items-center gap-3 bg-[#C2185B] px-5.5 py-2.5 text-white">
      <div className="flex-1 text-[12.5px] leading-snug font-medium">{ctaCopy.promoBannerMessage}</div>
      <button
        type="button"
        aria-label={ctaCopy.promoBannerDismiss}
        onClick={() => {
          window.sessionStorage.setItem(DISMISS_KEY, 'true')
          setDismissed(true)
        }}
        className="shrink-0 p-1 text-sm opacity-80"
      >
        ✕
      </button>
    </div>
  )
}
