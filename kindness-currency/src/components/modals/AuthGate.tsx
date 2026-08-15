'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'

export type AuthGateProps = {
  onClose: () => void
}

export function AuthGate({ onClose }: AuthGateProps) {
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Enter your email ♥')
      return
    }
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: name },
      },
    })
    setSubmitting(false)
    if (otpError) {
      setError('Something went wrong sending your link. Please try again.')
      return
    }
    setStep('otp')
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#FFF8F0] px-6 pt-6.5 pb-7.5"
      >
        {step === 'form' ? (
          <div>
            <h2 id="auth-gate-heading" className="text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
              {ctaCopy.authModalHeading}
            </h2>
            <div className="mt-2 text-[12.5px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.authModalSubtext}</div>
            <div className="mt-4.5 flex flex-col gap-2.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                aria-label="Full name"
                className="w-full rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
              />
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
            </div>
            {error && (
              <div role="alert" className="mt-2 text-[12.5px] text-[#C2185B]">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-60"
            >
              Email me a magic link
            </button>
            <button type="button" onClick={onClose} className="mt-2 w-full p-1.5 text-[13.5px] font-semibold text-[#2C2C2C] opacity-70">
              Not yet
            </button>
          </div>
        ) : (
          <div className="py-1.5 text-center">
            <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF8F00] text-2xl text-white">✉</div>
            <h2 id="auth-gate-heading" className="mt-4 text-[22px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
              Check your inbox
            </h2>
            <div className="mt-2 text-[13px] leading-relaxed text-[#2C2C2C] opacity-72">
              We sent a magic link to <b>{email}</b>. Tap it to verify — no password needed.
            </div>
            <button type="button" onClick={onClose} className="mt-5 w-full p-1.5 text-[13.5px] font-semibold text-[#2C2C2C] opacity-70">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
