'use client'

import { useEffect, useState } from 'react'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'
import type { GeneratePinResult } from '@/lib/redemptionEngine'
import type { CouponStatus } from '@/schemas/couponSchema'

export type RecipientPinModalProps = {
  couponTitle: string
  senderName: string
  onGenerate: () => Promise<GeneratePinResult>
  /** Polled every 3s while a PIN is showing, to notice the sender confirming it. */
  onPollStatus: () => Promise<CouponStatus | null>
  /** Fired once the poll sees the coupon redeemed. */
  onRedeemed: () => void
  onClose: () => void
}

type Phase =
  | { kind: 'intro' }
  | { kind: 'live'; pin: string; expiresAtMs: number }
  | { kind: 'expired' }

const POLL_INTERVAL_MS = 3000

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** Recipient-side (no login): generates a 5-minute PIN to read out to the sender, and watches for
 * the sender's confirmation. The raw PIN lives only in this component's state. */
export function RecipientPinModal({ couponTitle, senderName, onGenerate, onPollStatus, onRedeemed, onClose }: RecipientPinModalProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' })
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  const expiresAtMs = phase.kind === 'live' ? phase.expiresAtMs : null

  useEffect(() => {
    if (expiresAtMs === null) return

    const tick = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= expiresAtMs) setPhase({ kind: 'expired' })
    }, 1000)

    let cancelled = false
    const poll = setInterval(async () => {
      const status = await onPollStatus()
      if (!cancelled && status === 'redeemed') onRedeemed()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(tick)
      clearInterval(poll)
    }
  }, [expiresAtMs, onPollStatus, onRedeemed])

  const handleGenerate = async () => {
    if (generating) return
    setGenerating(true)
    setError('')
    const result = await onGenerate()
    setGenerating(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    const expiry = new Date(result.expiresAt).getTime()
    setNow(Date.now())
    setPhase({ kind: 'live', pin: result.pin, expiresAtMs: expiry })
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end bg-[#1A1A2E]/60 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipient-pin-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#FFF8F0] px-6 pt-6.5 pb-7.5"
      >
        {phase.kind === 'live' ? (
          <div className="text-center">
            <h2
              id="recipient-pin-heading"
              className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {ctaCopy.recipientPinLiveHeading}
            </h2>
            <div className="mt-2 text-[13px] leading-relaxed text-[#2C2C2C] opacity-75">
              {ctaCopy.recipientPinLiveBody(senderName)}
            </div>

            <div className="mt-4.5 rounded-[18px] bg-[#1A1A2E] p-4.5">
              <div className="flex items-center justify-center gap-3" aria-label="Your PIN">
                {phase.pin.split('').map((digit, i) => (
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

            <div role="timer" className="mt-3 text-[12.5px] font-semibold text-[#2C2C2C] opacity-65">
              {ctaCopy.recipientPinExpiresIn(formatRemaining(phase.expiresAtMs - now))}
            </div>

            <button type="button" onClick={onClose} className="mt-3.5 w-full p-1.5 font-sans text-sm font-semibold text-[#2C2C2C] opacity-70">
              {ctaCopy.recipientPinNotYet}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h2
              id="recipient-pin-heading"
              className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {ctaCopy.recipientPinIntroHeading}
            </h2>
            <div className="mt-2 text-[13px] leading-relaxed text-[#2C2C2C] opacity-75">
              {phase.kind === 'expired' ? ctaCopy.recipientPinExpired : ctaCopy.recipientPinIntroBody(senderName, couponTitle)}
            </div>
            {error && (
              <div role="alert" className="mt-2 text-[12.5px] leading-tight text-[#C2185B]">
                {error}
              </div>
            )}
            <div className="mt-4.5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-[14px] bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-50"
              >
                {phase.kind === 'expired' ? ctaCopy.recipientPinGenerateAgain : ctaCopy.generatePinButton}
              </button>
              <button type="button" onClick={onClose} className="w-full p-1.5 font-sans text-sm font-semibold text-[#2C2C2C] opacity-70">
                {ctaCopy.recipientPinNotYet}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
