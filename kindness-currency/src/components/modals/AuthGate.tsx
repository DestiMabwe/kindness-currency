'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { devInstantLoginAction } from '@/app/auth/actions'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'

export type AuthGateProps = {
  onClose: () => void
  /** Where to land after auth completes and the callback route exchanges the code. Defaults to /create. */
  redirectTo?: string
  /** Which framing to open with — the person can still switch. Defaults to 'signup'. */
  initialMode?: 'signup' | 'login'
}

export function AuthGate({ onClose, redirectTo = '/create', initialMode = 'signup' }: AuthGateProps) {
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Enter your email ♥')
      return
    }
    setSubmitting(true)
    setError('')

    if (mode === 'login') {
      const result = await devInstantLoginAction(email)
      if (!result.success) {
        setSubmitting(false)
        setError(result.error)
        return
      }
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: result.tokenHash, type: 'magiclink' })
      setSubmitting(false)
      if (verifyError) {
        setError("We couldn't find an account for that email. Want to sign up instead?")
        return
      }
      window.location.assign(redirectTo)
      return
    }

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(), data: { full_name: name } },
    })
    setSubmitting(false)
    if (otpError) {
      setError('Something went wrong sending your link. Please try again.')
      return
    }
    setStep('otp')
  }

  const handleGoogleSignIn = async () => {
    setError('')
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
    if (oauthError) {
      setError('Something went wrong signing in with Google. Please try again.')
    }
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
            <div role="tablist" aria-label="Sign up or log in" className="flex gap-1.5">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => {
                  setMode('signup')
                  setError('')
                }}
                className="rounded-full px-4 py-2 text-[13px] font-semibold"
                style={{ backgroundColor: mode === 'signup' ? '#C2185B' : '#F0ECE4', color: mode === 'signup' ? '#fff' : '#2C2C2C' }}
              >
                {ctaCopy.authModalTabSignup}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
                className="rounded-full px-4 py-2 text-[13px] font-semibold"
                style={{ backgroundColor: mode === 'login' ? '#C2185B' : '#F0ECE4', color: mode === 'login' ? '#fff' : '#2C2C2C' }}
              >
                {ctaCopy.authModalTabLogin}
              </button>
            </div>
            <h2 id="auth-gate-heading" className="mt-4 text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
              {mode === 'signup' ? ctaCopy.authModalHeading : ctaCopy.authModalLoginHeading}
            </h2>
            <div className="mt-2 text-[12.5px] leading-relaxed text-[#2C2C2C] opacity-72">
              {mode === 'signup' ? ctaCopy.authModalSubtext : ctaCopy.authModalLoginSubtext}
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mt-4.5 w-full rounded-2xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 font-sans text-[15px] font-bold text-[#1A1A2E]"
            >
              Continue with Google
            </button>
            <div className="mt-3.5 flex items-center gap-2.5 text-[11.5px] font-semibold text-[#2C2C2C] opacity-50">
              <span className="h-px flex-1 bg-[#1A1A2E]/14" />
              or
              <span className="h-px flex-1 bg-[#1A1A2E]/14" />
            </div>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {mode === 'signup' && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  aria-label="Full name"
                  className="w-full rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
                />
              )}
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
              {mode === 'signup' ? ctaCopy.authModalSignupSubmit : ctaCopy.authModalLoginSubmit}
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
