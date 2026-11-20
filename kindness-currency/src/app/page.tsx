import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createCampaignBannerRepository } from '@/lib/campaignBannerRepository'
import { CampaignBanner } from '@/components/shared/CampaignBanner'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { HeroTintWash } from '@/components/shared/HeroTintWash'
import { TemplateCoverArt } from '@/components/shared/TemplateCoverArt'
import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { templateVisuals, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import { PromoBanner } from '@/components/shared/PromoBanner'
import { bundleTierBySlug } from '@/lib/bundleTiers'
import { REGION_TIER_PRICE, formatPrice } from '@/lib/geoPricing'
import { getRegion } from '@/lib/region'

// Which coupon each hero marquee card shows, by template slug. Matched on title so reordering
// coupons in the database doesn't change the hero; a template with no entry (or a title that no
// longer exists) falls back to its first coupon.
const heroCouponTitleBySlug: Partial<Record<string, string>> = {
  mothers_day: 'Home-Cooked Meal',
  valentines: 'Love Letter',
  birthday: 'Birthday Meal, Your Choice',
  besties: 'Ugly Cry Session',
  'requested-by-him': 'Initiated Intimacy',
  'requested-by-her': 'Total Logistics Takeover',
}

export default async function HomePage() {
  const supabase = createServiceClient()
  const templateRepo = createTemplateRepository(supabase)
  const bannerRepo = createCampaignBannerRepository(supabase)

  const [templates, banner, region] = await Promise.all([
    templateRepo.getActiveTemplatesWithCoupons(),
    bannerRepo.getActiveBanner(),
    getRegion(),
  ])

  const heroTemplates = templates.filter((t) => !t.is_age_restricted)
  const marqueeItems = [...heroTemplates, ...heroTemplates] // duplicated so the scroll loop is seamless

  return (
    <div className="flex min-h-screen flex-col">
      {banner && <CampaignBanner message={banner.message} />}
      <PromoBanner />

      <SiteHeader />

      <HeroTintWash
        initialTint={templateVisuals[(heroTemplates[0]?.slug ?? 'mothers_day') as TemplateSlug].accent}
        className="kc-hero-wash relative overflow-hidden px-5.5 pt-3.5 pb-6.5"
      >
        <div aria-hidden="true" className="relative mb-3.5 flex h-[270px] items-center overflow-hidden">
          <div className="kc-marquee-track flex w-max items-center gap-6">
            {marqueeItems.map((template, i) => {
              const visuals = templateVisuals[template.slug as TemplateSlug]
              const featuredTitle = heroCouponTitleBySlug[template.slug]
              const coupon =
                template.template_coupons.find((c) => c.service_title === featuredTitle) ?? template.template_coupons[0]
              if (!coupon) return null
              return (
                <div
                  key={`${template.id}-${i}`}
                  data-hero-accent={visuals.accent}
                  className="shrink-0"
                  style={{ transform: 'scale(0.62)' }}
                >
                  <CouponCardHero
                    serviceTitle={coupon.service_title}
                    microCopy={coupon.micro_copy}
                    finePrint={coupon.fine_print}
                    accent={visuals.accent}
                    backgroundEffect="none"
                    motif={visuals.motif}
                    imageSrc={visuals.imageSrc}
                    expiresAt={null}
                    status="sent"
                  />
                </div>
              )
            })}
          </div>
        </div>
        <h1
          className="kc-rise text-[38px] leading-[1.04] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)', ['--kc-rise-delay' as string]: '0.05s' }}
        >
          Connection,
          <br />
          without complication
        </h1>
        <div
          className="kc-rise mt-3 max-w-[300px] text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-78"
          style={{ ['--kc-rise-delay' as string]: '0.18s' }}
        >
          Kindness Currency lets you give time, care, and love. The gifts that matter most. Share promises, surprises, and acts of service — all wrapped in a single link.
        </div>
        <div className="kc-rise mt-5 flex gap-2.5" style={{ ['--kc-rise-delay' as string]: '0.3s' }}>
          <Link
            href="/create"
            className="flex-1 rounded-2xl bg-[#C2185B] p-3.75 text-center font-sans text-[15.5px] font-bold text-white shadow-[0_16px_30px_-14px_rgba(194,24,91,0.8)]"
          >
            {ctaCopy.heroCta}
          </Link>
          <Link
            href="/about"
            className="flex-1 rounded-2xl bg-[#1A1A2E] p-3.75 text-center font-sans text-[15.5px] font-bold text-white shadow-[0_16px_30px_-14px_rgba(26,26,46,0.5)]"
          >
            {ctaCopy.navAboutUs}
          </Link>
        </div>
        <div className="kc-rise mt-6" style={{ ['--kc-rise-delay' as string]: '0.42s' }}>
          <h2 className="text-[11px] font-bold tracking-[0.12em] text-[#C2185B] uppercase">
            {ctaCopy.homeHowItWorksHeading}
          </h2>
          <ol className="mt-3 flex flex-col gap-3.5">
            {ctaCopy.homeHowItWorksSteps.map((step, i) => (
              <li key={step.title} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1A1A2E] font-sans text-[13px] font-bold text-white"
                >
                  {i + 1}
                </span>
                <div>
                  <div className="text-[16px] leading-tight font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {step.title}
                  </div>
                  <p className="mt-0.5 text-[13.5px] leading-snug text-[#2C2C2C] opacity-78">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </HeroTintWash>

      <div className="bg-[#0a1f44] py-5">
        <div className="px-5.5">
          <div className="text-[22px] font-bold text-[#eaeaf2]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Trending Templates
          </div>
          <div className="mt-0.75 text-[12.5px] text-white/70">{ctaCopy.templatesSubheading}</div>
        </div>
        <div className="mt-4 flex gap-3.25 overflow-x-auto px-5.5 pb-1.5">
          {heroTemplates.map((template) => {
            const visuals = templateVisuals[template.slug as TemplateSlug]
            return (
              <Link
                key={template.id}
                href="/create"
                className="w-[172px] shrink-0 overflow-hidden rounded-[18px] border border-[#1A1A2E]/8 bg-white shadow-[0_14px_30px_-22px_rgba(26,26,46,0.5)]"
              >
                <div className="relative aspect-[1748/1240] w-full">
                  {visuals.coverImageSrc ? (
                    <Image src={visuals.coverImageSrc} alt={template.name} fill sizes="172px" className="object-cover" />
                  ) : (
                    <TemplateCoverArt name={template.name} accent={visuals.accent} tint={visuals.tint} imageSrc={visuals.imageSrc} />
                  )}
                </div>
                <div className="p-3.75">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="text-[16.5px] leading-tight font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-playfair)' }}>
                      {template.name}
                    </div>
                    {bundleTierBySlug[template.slug] && (
                      <span className="shrink-0 text-[12.5px] font-bold text-[#C2185B]">
                        {formatPrice(REGION_TIER_PRICE[region][bundleTierBySlug[template.slug]], region)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.25 text-[11.5px] leading-snug text-[#2C2C2C] opacity-70">{template.theme}</div>
                  <div className="mt-3 text-[11.5px] font-semibold" style={{ color: visuals.accent }}>
                    8 coupons →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-auto border-t border-[#1A1A2E]/7 bg-[#FFF8F0] px-5.5 py-5.5 text-center">
        <div className="text-[15px] text-[#1A1A2E] italic opacity-85" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.footerTagline}
        </div>
        <div className="mt-2 text-[10.5px] tracking-[0.06em] text-[#2C2C2C] opacity-80">KINDNESS CURRENCY</div>
      </div>
    </div>
  )
}
