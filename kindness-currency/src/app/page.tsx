import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createCampaignBannerRepository } from '@/lib/campaignBannerRepository'
import { CampaignBanner } from '@/components/shared/CampaignBanner'
import { CouponCardMini } from '@/components/coupon/CouponCardMini'
import { templateVisuals, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'

const HERO_FLOATS: { top?: string; bottom?: string; left?: string; right?: string; rotate: number; duration: string; delay: string; width: string }[] = [
  { top: '6px', left: '6px', rotate: -8, duration: '6s', delay: '0s', width: '38%' },
  { top: '30px', right: '2px', rotate: 7, duration: '7s', delay: '0.6s', width: '38%' },
  { bottom: '0px', left: '24px', rotate: 5, duration: '6.6s', delay: '0.3s', width: '38%' },
  { bottom: '14px', right: '30px', rotate: -6, duration: '7.4s', delay: '0.9s', width: '36%' },
]

export default async function HomePage() {
  const supabase = createServiceClient()
  const templateRepo = createTemplateRepository(supabase)
  const bannerRepo = createCampaignBannerRepository(supabase)

  const [templates, banner] = await Promise.all([templateRepo.getActiveTemplatesWithCoupons(), bannerRepo.getActiveBanner()])

  const heroTemplates = templates.filter((t) => !t.is_age_restricted).slice(0, 4)

  return (
    <div className="flex min-h-screen flex-col">
      {banner && <CampaignBanner message={banner.message} />}

      <div className="flex items-center justify-between px-4.5 pt-3.5 pb-3">
        <span className="font-sans text-lg font-extrabold text-[#1A1A2E]">Kindness Currency</span>
        <button type="button" className="rounded-full border border-[#1A1A2E]/18 px-4 py-1.75 font-sans text-[12.5px] font-semibold text-[#1A1A2E]">
          Log In
        </button>
      </div>

      <div className="relative overflow-hidden px-5.5 pt-3.5 pb-6.5">
        <div className="relative mx-[-6px] mb-1.5 h-[188px]">
          {heroTemplates.map((template, i) => {
            const visuals = templateVisuals[template.slug as TemplateSlug]
            const float = HERO_FLOATS[i]
            const coupon = template.template_coupons[0]
            if (!float || !coupon) return null
            return (
              <div
                key={template.id}
                className="kc-float absolute"
                style={{
                  top: float.top,
                  bottom: float.bottom,
                  left: float.left,
                  right: float.right,
                  width: float.width,
                  ['--kc-float-rotate' as string]: `${float.rotate}deg`,
                  ['--kc-float-duration' as string]: float.duration,
                  ['--kc-float-delay' as string]: float.delay,
                }}
              >
                <CouponCardMini title={coupon.service_title} accent={visuals.accent} motif={visuals.motif} />
              </div>
            )
          })}
        </div>
        <div className="text-[38px] leading-[1.04] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Give a promise,
          <br />
          not a thing.
        </div>
        <div className="mt-3 max-w-[300px] text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-78">
          Hand-craft a set of acts-of-service coupons and send them with a single link. No app for them to download. Just love, redeemable.
        </div>
        <Link
          href="/create"
          className="mt-5 block w-full rounded-2xl bg-[#C2185B] p-3.75 text-center font-sans text-[15.5px] font-bold text-white shadow-[0_16px_30px_-14px_rgba(194,24,91,0.8)]"
        >
          {ctaCopy.heroCta}
        </Link>
      </div>

      <div className="bg-[#0a1f44] py-5">
        <div className="px-5.5">
          <div className="text-[22px] font-bold text-[#eaeaf2]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Trending Templates
          </div>
          <div className="mt-0.75 text-[12.5px] text-white/70">{ctaCopy.templatesSubheading}</div>
        </div>
        <div className="mt-4 flex gap-3.25 overflow-x-auto px-5.5 pb-1.5">
          {templates.map((template) => {
            const visuals = templateVisuals[template.slug as TemplateSlug]
            return (
              <Link
                key={template.id}
                href="/create"
                className="w-[172px] shrink-0 overflow-hidden rounded-[18px] border border-[#1A1A2E]/8 bg-white shadow-[0_14px_30px_-22px_rgba(26,26,46,0.5)]"
              >
                <div className="relative aspect-[1748/1240] w-full">
                  <img src={visuals.coverImageSrc} alt={template.name} className="h-full w-full object-cover" />
                  {template.is_age_restricted && (
                    <span className="absolute top-2 right-2 rounded-full border border-[#C2185B] bg-white/92 px-1.75 py-0.5 text-[9px] font-bold tracking-[0.08em] text-[#C2185B]">
                      18+
                    </span>
                  )}
                </div>
                <div className="p-3.75">
                  <div className="text-[16.5px] leading-tight font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {template.name}
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
        <div className="mt-2 text-[10.5px] tracking-[0.06em] text-[#2C2C2C] opacity-45">KINDNESS CURRENCY</div>
      </div>
    </div>
  )
}
