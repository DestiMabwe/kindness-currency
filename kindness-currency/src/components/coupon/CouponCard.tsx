import type { CouponStatus, FontChoice, BackgroundEffect } from '@/schemas/couponSchema'

export type CouponCardProps = {
  serviceTitle: string
  microCopy?: string | null
  finePrint?: string | null
  fontChoice: FontChoice
  backgroundColor?: string | null
  backgroundEffect: BackgroundEffect
  status: CouponStatus
  accent: string
  motif: string
  /** Colour behind the punch-hole notches — should match whatever surface the card sits on. */
  punchColor?: string
  showRedeem?: boolean
  onRedeem?: () => void
}

const barcodeBars = ['w-[2px]', 'w-1', 'w-[1.5px]', 'w-[3px]', 'w-[1.5px]', 'w-[2.5px]', 'w-[1.5px]', 'w-[3.5px]']

export function CouponCard({
  serviceTitle,
  microCopy,
  finePrint,
  fontChoice,
  backgroundColor = '#FFF8F0',
  backgroundEffect,
  status,
  accent,
  motif,
  punchColor = '#FFF8F0',
  showRedeem = false,
  onRedeem,
}: CouponCardProps) {
  const isRedeemed = status === 'redeemed'
  const accentSoft = `${accent}66`
  const accentGlow = `${accent}33`

  return (
    <div
      className="relative flex w-full min-h-[148px] overflow-hidden rounded-2xl border-2 shadow-[0_10px_26px_-16px_rgba(26,26,46,0.45)] transition-opacity duration-300"
      style={{ borderColor: accent, backgroundColor: backgroundColor ?? '#FFF8F0', opacity: isRedeemed ? 0.72 : 1 }}
    >
      {backgroundEffect === 'soft-glow' && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(120px 90px at 30% 25%, ${accentGlow}, transparent 70%)` }}
        />
      )}
      {backgroundEffect === 'confetti' && (
        <div className="pointer-events-none absolute inset-0">
          <span className="absolute top-[14%] left-[12%] h-[7px] w-[7px] -rotate-[20deg] rounded-sm bg-[#C2185B]" />
          <span className="absolute top-[62%] left-[8%] h-1.5 w-1.5 rounded-full bg-[#FF8F00]" />
          <span className="absolute top-[30%] left-[40%] h-[10px] w-[5px] rotate-[25deg] rounded-sm bg-[#D4658A]" />
          <span className="absolute top-[74%] left-[34%] h-[7px] w-[7px] rotate-[15deg] rounded-sm bg-[#FF8F00]" />
          <span className="absolute top-[18%] left-[60%] h-1.5 w-1.5 rounded-full bg-[#C2185B]" />
          <span className="absolute top-1/2 left-[54%] h-[9px] w-[5px] rotate-[35deg] rounded-sm bg-[#FF8F00]" />
          <span className="absolute top-[82%] left-[60%] h-[7px] w-[7px] -rotate-[15deg] rounded-sm bg-[#D4658A]" />
        </div>
      )}
      {backgroundEffect === 'sparkle' && (
        <div className="pointer-events-none absolute inset-0" style={{ color: accent }}>
          <span className="absolute top-[12%] left-[14%] text-[13px] opacity-50">✦</span>
          <span className="absolute top-[58%] left-[9%] text-[9px] opacity-40">✦</span>
          <span className="absolute top-[34%] left-[46%] text-[11px] opacity-45">✦</span>
          <span className="absolute top-[78%] left-[40%] text-[8px] opacity-35">✦</span>
          <span className="absolute top-[22%] left-[62%] text-[10px] opacity-40">✦</span>
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col py-4 pr-3.5 pl-[18px]">
        <div
          className="pointer-events-none absolute top-1.5 right-2.5 font-sans text-[46px] leading-none opacity-[0.14]"
          style={{ color: accent }}
        >
          {motif}
        </div>
        <div className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color: accent }}>
          GOOD FOR
        </div>
        <div
          className="mt-[5px] pr-[30px] text-[21px] leading-[1.12] font-bold text-[#1A1A2E]"
          style={{
            fontFamily: fontChoice === 'dm-sans' ? 'var(--font-dm-sans)' : 'var(--font-playfair)',
            fontStyle: fontChoice === 'dm-sans' ? 'normal' : 'italic',
          }}
        >
          {serviceTitle}
        </div>
        {microCopy && <div className="mt-[7px] font-sans text-[12.5px] leading-tight text-[#2C2C2C] opacity-[0.82]">{microCopy}</div>}
        <div className="min-h-2 flex-1" />
        {finePrint && (
          <div className="mt-2 flex items-center gap-[7px]">
            <span className="inline-block h-[5px] w-[5px] shrink-0 rounded-full opacity-60" style={{ backgroundColor: accent }} />
            <span className="font-sans text-[9.5px] tracking-[0.08em] text-[#2C2C2C] uppercase opacity-55">{finePrint}</span>
          </div>
        )}
        {showRedeem && !isRedeemed && (
          <button
            type="button"
            onClick={onRedeem}
            className="mt-[13px] self-start rounded-full bg-[#C2185B] px-[18px] py-2.5 font-sans text-[13px] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(194,24,91,0.7)] hover:bg-[#a8154f]"
          >
            Redeem This ♥
          </button>
        )}
      </div>

      <div
        className="relative flex w-12 shrink-0 items-center justify-center border-l-2 border-dashed py-2.5"
        style={{ borderColor: accentSoft }}
      >
        <div className="flex h-[78%] items-stretch gap-[2.5px]">
          {barcodeBars.map((width, i) => (
            <div key={i} className={`${width} bg-[#1A1A2E] opacity-[0.78]`} />
          ))}
        </div>
        <div className="absolute -top-[9px] -left-[9px] h-4 w-4 rounded-full" style={{ backgroundColor: punchColor }} />
        <div className="absolute -bottom-[9px] -left-[9px] h-4 w-4 rounded-full" style={{ backgroundColor: punchColor }} />
      </div>

      {isRedeemed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="-rotate-[11deg] rounded-[10px] border-[3px] border-[#C2185B] bg-[#FFF8F0]/62 px-4 py-[7px] text-[21px] font-bold text-[#C2185B] italic shadow-[0_4px_14px_-6px_rgba(194,24,91,0.5)]">
            Redeemed ♥
          </div>
        </div>
      )}
    </div>
  )
}
