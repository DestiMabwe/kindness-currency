// Pricing catalog — every template, live and upcoming, grouped by tier. No checkout happens on
// this page itself; it's purely informational (see PRICING.md for the tier model this mirrors).

import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createComingSoonTemplateRepository } from '@/lib/comingSoonTemplateRepository'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { ctaCopy } from '@/constants/ctaCopy'
import { bundleTierBySlug, tierPrice, flagshipPrice, type BundleTier } from '@/lib/bundleTiers'

const TIER_ORDER: { tier: BundleTier; label: string }[] = [
  { tier: 'everyday', label: ctaCopy.bundleTierPillEveryday },
  { tier: 'occasion', label: ctaCopy.bundleTierPillOccasion },
  { tier: 'romance', label: ctaCopy.bundleTierPillRomance },
]

type Row = { name: string; status: 'live' | 'coming-soon' }

export default async function PricingPage() {
  const supabase = createServiceClient()
  const templateRepo = createTemplateRepository(supabase)
  const comingSoonRepo = createComingSoonTemplateRepository(supabase)
  const [templates, comingSoonTemplates] = await Promise.all([
    templateRepo.getActiveTemplates(),
    comingSoonRepo.getActiveComingSoonTemplates(),
  ])

  const rowsByTier: Record<BundleTier, Row[]> = { everyday: [], occasion: [], romance: [] }
  for (const template of templates) {
    const tier = bundleTierBySlug[template.slug]
    if (tier) rowsByTier[tier].push({ name: template.name, status: 'live' })
  }
  for (const template of comingSoonTemplates) {
    const tier = bundleTierBySlug[template.slug]
    if (tier) rowsByTier[tier].push({ name: template.name, status: 'coming-soon' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <div className="px-5.5 pt-2 pb-10">
        <h1 className="text-[26px] leading-[1.15] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.pricingPageHeading}
        </h1>
        <div className="mt-1.5 text-[13.5px] text-[#2C2C2C] opacity-72">{ctaCopy.pricingPageSubheading}</div>

        <div className="mt-4 rounded-2xl bg-[#C2185B]/8 px-4 py-3.5 text-[12.5px] leading-relaxed text-[#1A1A2E]">
          {ctaCopy.pricingBundleNote}
        </div>

        <div className="mt-7 flex flex-col gap-7">
          {TIER_ORDER.map(({ tier, label }) => (
            <div key={tier}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[18px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {label}
                </h2>
                <span className="text-[15px] font-bold text-[#C2185B]">${tierPrice[tier].toFixed(2)}</span>
              </div>
              <div className="mt-2.5 flex flex-col gap-2">
                {rowsByTier[tier].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-xl border border-[#1A1A2E]/8 bg-white px-3.5 py-2.5"
                  >
                    <span className="text-[13.5px] font-semibold text-[#1A1A2E]">{row.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.08em] uppercase"
                      style={{
                        backgroundColor: row.status === 'live' ? '#DCEEE8' : '#F0ECE4',
                        color: row.status === 'live' ? '#2E7D6B' : '#2C2C2C',
                      }}
                    >
                      {row.status === 'live' ? ctaCopy.pricingAvailableNow : ctaCopy.pricingComingSoon}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 text-[11px] leading-relaxed text-[#2C2C2C] opacity-55">{ctaCopy.pricingPairNote}</div>

        <div className="mt-7 h-px bg-[#1A1A2E]/10" />

        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
              {ctaCopy.pricingFlagshipHeading}
            </h2>
            <span className="text-[15px] font-bold text-[#C2185B]">${flagshipPrice.toFixed(2)}</span>
          </div>
          <div className="mt-2 text-[13px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.pricingFlagshipBody}</div>
        </div>
      </div>
    </div>
  )
}
