'use client'

import { useState } from 'react'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'

export type ResetPinModalProps = {
  recipientName: string
  onReset: () => Promise<{ success: true; pin: string } | { success: false; error: string }>
  onClose: () => void
}

export function ResetPinModal({ recipientName, onReset, onClose }: ResetPinModalProps) {
  const [step, setStep] = useState<'confirm' | 'revealed'>('confirm')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  const handleConfirm = async () => {
    setSubmitting(true)
    setError('')
    const result = await onReset()
    setSubmitting(false)
    if (!result.success) {
      setError(ctaCopy.resetPinError)
      return
    }
    setPin(result.pin)
    setStep('revealed')
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-[#1A1A2E]/60 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-pin-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#FFF8F0] px-6 pt-6.5 pb-7.5"
      >
        {step === 'confirm' ? (
          <div className="text-center">
            <h2
              id="reset-pin-heading"
              className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {ctaCopy.resetPinConfirmHeading}
            </h2>
            <div className="mt-2 text-[13px] leading-relaxed text-[#2C2C2C] opacity-75">
              {ctaCopy.resetPinConfirmBody(recipientName)}
            </div>
            {error && (
              <div role="alert" className="mt-2 text-[12.5px] text-[#C2185B]">
                {error}
              </div>
            )}
            <div className="mt-4.5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full rounded-[14px] bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-50"
              >
                {ctaCopy.resetPinConfirmSubmit}
              </button>
              <button type="button" onClick={onClose} className="w-full p-1.5 font-sans text-sm font-semibold text-[#2C2C2C] opacity-70">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2
              id="reset-pin-heading"
              className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {ctaCopy.resetPinRevealedHeading}
            </h2>
            <div className="mt-2 text-[13px] leading-relaxed text-[#2C2C2C] opacity-75">{ctaCopy.resetPinRevealedBody}</div>

            <div className="mt-4.5 rounded-[18px] bg-[#1A1A2E] p-4.5">
              <div className="flex items-center justify-center gap-3">
                {pin.split('').map((digit, i) => (
                  <span
                    key={i}
                    className="flex h-[58px] w-[46px] items-center justify-center rounded-xl border border-white/16 bg-white/6 text-[30px] font-bold text-white"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {digit}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4.5 w-full rounded-[14px] bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white"
            >
              {ctaCopy.resetPinDone}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
