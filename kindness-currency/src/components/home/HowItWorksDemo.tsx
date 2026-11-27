import { ctaCopy } from '@/constants/ctaCopy'

const serif = { fontFamily: 'var(--font-playfair)' }

function MiniCoupon({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[#C2185B] bg-white p-3 text-center">
      <div className="text-[9px] font-bold tracking-[0.14em] text-[#C2185B]">GOOD FOR ONE</div>
      <div className="mt-1 text-[18px] leading-tight font-bold italic" style={serif}>
        {title}
      </div>
      <div className="mt-1 text-[10.5px] text-[#2C2C2C] opacity-70">{note}</div>
    </div>
  )
}

function Scene({ n, label, children, center = false }: { n: number; label: string; children: React.ReactNode; center?: boolean }) {
  return (
    <div
      data-scene={n}
      className={`kc-demo-scene flex flex-col justify-center gap-3 p-4 ${center ? 'items-center text-center' : ''}`}
    >
      <div className="text-[10px] font-bold tracking-widest text-[#C2185B]">{label}</div>
      {children}
    </div>
  )
}

// Looping, CSS-only walkthrough of make → send → redeem → deliver. Decorative: the numbered
// list below carries the same information for screen readers and reduced-motion users.
export function HowItWorksDemo({ couponTitle }: { couponTitle: string }) {
  return (
    <div className="bg-[#0a1f44] px-5.5 py-8 text-white">
      <h2 className="text-center text-[26px] leading-tight font-bold text-balance italic" style={serif}>
        {ctaCopy.homeDemoHeading}
      </h2>
      <p className="mx-auto mt-1.5 max-w-[300px] text-center text-[13.5px] leading-snug text-balance text-white/75">
        {ctaCopy.homeDemoSubheading}
      </p>

      <div
        aria-hidden="true"
        className="relative mx-auto mt-6 h-[420px] w-[230px] rounded-[34px] border-[6px] border-[#1A1A2E] bg-[#FFF8F0] text-[#1A1A2E] shadow-2xl ring-1 ring-white/20"
      >
        <div className="absolute top-2 left-1/2 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-[#1A1A2E]/80" />
        <div className="relative h-full w-full overflow-hidden rounded-[26px]">
          <Scene n={1} label="PERSONALIZE">
            <MiniCoupon title={couponTitle} note="For Mum, with love" />
            <div className="rounded-lg bg-white p-2 text-[11px] shadow-sm">
              <span className="kc-demo-type">Your own words here…</span>
            </div>
          </Scene>
          <Scene n={2} label="SEND">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#C2185B] p-2.5 text-[11.5px] text-white">
              I made you something ♥
            </div>
            <div className="ml-auto max-w-[85%] rounded-xl bg-white p-2.5 text-[11px] shadow-sm">
              <div className="font-bold">A gift, just for you</div>
              <div className="opacity-60">…/give/your-gift</div>
            </div>
          </Scene>
          <Scene n={3} label="THEIR PHONE">
            <MiniCoupon title={couponTitle} note="Tap to call it in" />
            <div className="kc-demo-pulse rounded-xl bg-[#1A1A2E] p-2.5 text-center text-[12px] font-bold text-white">
              Call it in
            </div>
          </Scene>
          <Scene n={4} label="YOU ENTER THEIR PIN" center>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-3 w-3 rounded-full bg-[#1A1A2E]" />
              ))}
            </div>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10 text-[#C2185B]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            <div className="text-[18px] font-bold italic" style={serif}>
              Redeemed. Now go deliver!
            </div>
          </Scene>
        </div>
      </div>

      <ol className="mx-auto mt-6 flex max-w-[330px] flex-col gap-2.5">
        {ctaCopy.homeDemoSteps.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#0a1f44]"
            >
              {i + 1}
            </span>
            <div className="text-[13.5px] leading-snug">
              <b>{step.title}.</b> <span className="text-white/75">{step.body}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
