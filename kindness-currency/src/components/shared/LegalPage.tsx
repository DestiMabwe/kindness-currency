import { SiteHeader } from '@/components/shared/SiteHeader'
import { legal } from '@/constants/legal'

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <div className="px-5.5 pt-2 pb-10">
        <h1
          className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {title}
        </h1>
        <p className="mt-1 text-[12.5px] text-[#2C2C2C] opacity-60">Last updated {legal.lastUpdated}</p>
        <div className="mt-4 flex flex-col gap-3.5 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-90">
          {children}
        </div>
      </div>
    </div>
  )
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2
        className="mt-2 text-[17px] leading-[1.2] font-extrabold text-[#1A1A2E] italic"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {heading}
      </h2>
      {children}
    </section>
  )
}
