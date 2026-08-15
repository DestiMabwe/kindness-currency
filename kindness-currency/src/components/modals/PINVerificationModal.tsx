'use client'

import { useState } from 'react'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'

export type PINVerificationModalProps = {
  couponTitle: string
  senderName: string
  onVerify: (pin: string) => Promise<boolean>
  onClose: () => void
}

export function PINVerificationModal({ couponTitle, senderName, onVerify, onClose }: PINVerificationModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  const handleConfirm = async () => {
    if (pin.length !== 4 || submitting) return
    setSubmitting(true)
    const ok = await onVerify(pin)
    setSubmitting(false)
    if (!ok) {
      setError(ctaCopy.pinWrongError(senderName))
      setPin('')
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-[#1A1A2E]/60 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-modal-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#FFF8F0] px-6 pt-6.5 pb-7.5"
      >
        <div className="text-center">
          <h2 id="pin-modal-heading" className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            Redeem this right now?
          </h2>
          <div className="mt-2 text-[13px] leading-relaxed text-[#2C2C2C] opacity-75">
            &ldquo;{couponTitle}&rdquo; — once you redeem, it can&apos;t be undone. Ready?
          </div>
        </div>

        <div className="mt-5">
          <div className="text-center font-sans text-[11px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-55">
            Enter your 4-digit PIN
          </div>
          <input
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))
              setError('')
            }}
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            aria-label="4-digit PIN"
            className="mt-2.5 w-full rounded-[14px] border-[1.5px] bg-white p-[15px] text-center text-[26px] font-bold text-[#1A1A2E] tracking-[0.5em] outline-none"
            style={{ borderColor: error ? '#C2185B' : 'rgba(26,26,46,0.14)', fontFamily: 'var(--font-playfair)' }}
          />
          {error && (
            <div role="alert" className="mt-2 text-center text-[12.5px] leading-tight text-[#C2185B]">
              {error}
            </div>
          )}
        </div>

        <div className="mt-4.5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pin.length !== 4 || submitting}
            className="w-full rounded-[14px] bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-50"
          >
            Yes, redeem with love ♥
          </button>
          <button type="button" onClick={onClose} className="w-full p-1.5 font-sans text-sm font-semibold text-[#2C2C2C] opacity-70">
            Not yet
          </button>
        </div>
      </div>
    </div>
  )
}
