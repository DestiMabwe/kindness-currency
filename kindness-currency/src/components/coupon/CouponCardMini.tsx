export type CouponCardMiniProps = {
  title: string
  accent: string
  motif: string
}

/** Decorative, non-interactive preview card used only in the home hero float animation. */
export function CouponCardMini({ title, accent, motif }: CouponCardMiniProps) {
  return (
    <div
      className="relative flex h-[86px] w-full overflow-hidden rounded-xl border-[1.5px] bg-white shadow-[0_12px_26px_-14px_rgba(26,26,46,0.5)]"
      style={{ borderColor: accent }}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center py-[9px] pr-2 pl-[11px]">
        <div className="font-sans text-[7px] font-semibold tracking-[0.18em] uppercase" style={{ color: accent }}>
          GOOD FOR
        </div>
        <div className="mt-[3px] text-[13px] leading-[1.1] font-bold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {title}
        </div>
        <div className="pointer-events-none absolute top-1 right-[38px] text-2xl opacity-[0.14]" style={{ color: accent }}>
          {motif}
        </div>
      </div>
      <div className="flex w-[30px] shrink-0 items-center justify-center gap-[1.5px] border-l-[1.5px] border-dashed" style={{ borderColor: `${accent}66` }}>
        <div className="h-[58%] w-[1.5px] bg-[#1A1A2E] opacity-75" />
        <div className="h-[58%] w-[3px] bg-[#1A1A2E] opacity-75" />
        <div className="h-[58%] w-[1.5px] bg-[#1A1A2E] opacity-75" />
        <div className="h-[58%] w-[2.5px] bg-[#1A1A2E] opacity-75" />
      </div>
    </div>
  )
}
