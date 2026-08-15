'use client'

import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'

export type AgeGateProps = {
  templateName: string
  onConfirm: () => void
  onDismiss: () => void
}

export function AgeGate({ templateName, onConfirm, onDismiss }: AgeGateProps) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onDismiss)

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#FFF8F0] px-6 pt-7 pb-7.5"
      >
        <div aria-hidden="true" className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-[#7B3F61] text-2xl text-white">☾</div>
        <h2 id="age-gate-heading" className="mt-4 text-2xl font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          A grown-up gift
        </h2>
        <div className="mt-2 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-78">
          {templateName} contains adult themes. Please confirm you&apos;re 18 or older to continue.
        </div>
        <div className="mt-5.5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-[14px] bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white"
          >
            {ctaCopy.ageGateConfirm}
          </button>
          <button type="button" onClick={onDismiss} className="w-full p-2 font-sans text-sm font-semibold text-[#2C2C2C]">
            {ctaCopy.ageGateDismiss}
          </button>
        </div>
      </div>
    </div>
  )
}
