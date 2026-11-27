import Link from 'next/link'
import { HowItWorksDemo } from '@/components/home/HowItWorksDemo'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createCampaignBannerRepository } from '@/lib/campaignBannerRepository'
import { CampaignBanner } from '@/components/shared/CampaignBanner'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { HeroTintWash } from '@/components/shared/HeroTintWash'
import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { templateVisuals, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import { PromoBanner } from '@/components/shared/PromoBanner'

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
  const {
    data: { user },
  } = await (await createServerClient()).auth.getUser()
  const templateRepo = createTemplateRepository(supabase)
  const bannerRepo = createCampaignBannerRepository(supabase)

  const [templates, banner] = await Promise.all([
    templateRepo.getActiveTemplatesWithCoupons(),
    bannerRepo.getActiveBanner(),
  ])

  const heroTemplates = templates.filter((t) => !t.is_age_restricted)
  const demoCouponTitle = heroTemplates[0]?.template_coupons[0]?.service_title ?? 'Home-Cooked Meal'
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
          Kindness Currency lets you give time, care, and love. The gifts that matter most. Share promises, surprises, and acts of service, all wrapped in a single link.
        </div>
        <div className="kc-rise mt-5 flex gap-2.5" style={{ ['--kc-rise-delay' as string]: '0.3s' }}>
          <Link
            href="/create"
            className="flex-1 rounded-2xl bg-[#C2185B] p-3.75 text-center font-sans text-[15.5px] font-bold text-white shadow-[0_16px_30px_-14px_rgba(194,24,91,0.8)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2185B]"
          >
            {ctaCopy.heroCta}
          </Link>
          <Link
            href="/about"
            className="flex-1 rounded-2xl bg-[#1A1A2E] p-3.75 text-center font-sans text-[15.5px] font-bold text-white shadow-[0_16px_30px_-14px_rgba(26,26,46,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2185B]"
          >
            {ctaCopy.navAboutUs}
          </Link>
        </div>
        {!user && (
          <Link
            href="/signup"
            className="kc-rise mt-2.5 block rounded-2xl border-2 border-[#1A1A2E] p-3.25 text-center font-sans text-[15.5px] font-bold text-[#1A1A2E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2185B]"
            style={{ ['--kc-rise-delay' as string]: '0.36s' }}
          >
            {ctaCopy.heroCreateAccountCta}
          </Link>
        )}
      </HeroTintWash>

      <HowItWorksDemo couponTitle={demoCouponTitle} />

      <div className="mt-auto border-t border-[#1A1A2E]/7 bg-[#FFF8F0] px-5.5 py-5.5 text-center">
        <div className="text-[15px] text-[#1A1A2E] italic opacity-85" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.footerTagline}
        </div>
        <div className="mt-2 text-[10.5px] tracking-[0.06em] text-[#2C2C2C] opacity-80">KINDNESS CURRENCY</div>
      </div>
    </div>
  )
}
