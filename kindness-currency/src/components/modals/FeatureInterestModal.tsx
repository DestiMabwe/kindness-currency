'use client'

import { useState } from 'react'
import { recordFeatureInterestAction } from '@/app/feature-interest/actions'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'
import type { FeatureInterestSlug } from '@/schemas/featureInterestSchema'

export type FeatureInterestModalProps = {
  feature: FeatureInterestSlug
  userEmail: string | null
  onClose: () => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function FeatureInterestModal({ feature, userEmail, onClose }: FeatureInterestModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  const submit = async (targetEmail: string) => {
    setSubmitting(true)
    setError('')
    const result = await recordFeatureInterestAction({ feature, email: targetEmail })
    setSubmitting(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  const handleOneClick = () => {
    if (userEmail) void submit(userEmail)
  }

  const handleEmailSubmit = () => {
    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(ctaCopy.featureInterestInvalidEmail)
      return
    }
    void submit(trimmedEmail)
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-interest-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#FFF8F0] px-6 pt-6.5 pb-7.5"
      >
        {sent ? (
          <div className="py-1.5 text-center">
            <div className="text-[15px] font-semibold text-[#1A1A2E]">{ctaCopy.featureInterestThankYou}</div>
            <button type="button" onClick={onClose} className="mt-5 w-full p-1.5 text-[13.5px] font-semibold text-[#2C2C2C] opacity-70">
              Close
            </button>
          </div>
        ) : (
          <div>
            <h2
              id="feature-interest-heading"
              className="text-[23px] font-extrabold text-[#1A1A2E] italic"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {ctaCopy.featureInterestHeading}
            </h2>
            <div className="mt-2 text-[12.5px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.featureInterestSubtext}</div>

            {userEmail ? (
              <button
                type="button"
                onClick={handleOneClick}
                disabled={submitting}
                className="mt-4.5 w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-60"
              >
                {ctaCopy.featureInterestSubmitButton} — {userEmail}
              </button>
            ) : (
              <div className="mt-4.5 flex flex-col gap-2.5">
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  type="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  className="w-full rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
                />
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-60"
                >
                  {ctaCopy.featureInterestSubmitButton}
                </button>
              </div>
            )}

            {error && (
              <div role="alert" className="mt-2 text-[12.5px] text-[#C2185B]">
                {error}
              </div>
            )}

            <button type="button" onClick={onClose} className="mt-3.5 w-full p-1.5 text-[13.5px] font-semibold text-[#2C2C2C] opacity-70">
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
