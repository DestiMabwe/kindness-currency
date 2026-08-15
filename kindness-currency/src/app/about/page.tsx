import { SiteHeader } from '@/components/shared/SiteHeader'
import { ctaCopy } from '@/constants/ctaCopy'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <div className="px-5.5 pt-2 pb-10">
        <h1
          className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          About Kindness Currency
        </h1>
        <div className="mt-4 flex flex-col gap-3.5 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
          <p>
            Kindness Currency lets you give the things that matter most — your time, your care, your attention —
            wrapped up as a set of redeemable promises instead of another object no one needs.
          </p>
          <p>
            Pick a template, personalize eight coupons, and send them with a single link. No app to download, no
            account for the recipient to create. Just love, redeemable whenever they&apos;re ready to cash it in.
          </p>
          <p className="text-[15px] font-bold text-[#C2185B] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            {ctaCopy.footerTagline}
          </p>
        </div>
      </div>
    </div>
  )
}
