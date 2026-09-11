'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { devInstantLoginAction } from '@/app/auth/actions'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'
import { TabPills } from '@/components/shared/TabPills'

export type AuthGateProps = {
  onClose: () => void
  /** Where to land after auth completes and the callback route exchanges the code. Defaults to /create. */
  redirectTo?: string
  /** Which framing to open with — the person can still switch. Defaults to 'signup'. */
  initialMode?: 'signup' | 'login'
}

// Deliberately loose (no length caps, no TLD allowlist) — this only needs to catch the obvious
// "forgot the @" / "forgot the domain" typos before they cost a network round trip, not fully
// validate RFC 5322. Supabase itself is still the real validator.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SendErrorLike = { message?: string; code?: string } | null

// Supabase's AuthError carries a stable .code alongside a human .message; map the ones a sender
// could actually hit here to specific, actionable copy instead of one catch-all sentence — a
// rate limit and a real failure otherwise look identical to whoever's stuck retrying into either.
function describeSendError(error: SendErrorLike): string {
  const code = error?.code ?? ''
  const message = (error?.message ?? '').toLowerCase()
  if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) {
    return "You've requested a few of these recently — please wait a minute before trying again."
  }
  if (code === 'email_address_invalid' || (message.includes('invalid') && message.includes('email'))) {
    return "That doesn't look like a valid email address."
  }
  return 'Something went wrong sending your link. Please try again.'
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
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Enter your email ♥')
      return
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("That doesn't look like a valid email address.")
      return
    }
    setSubmitting(true)
    setError('')

    if (mode === 'login') {
      // Dev-only shortcut: skips the inbox round trip so local testing doesn't need real email
      // access. devInstantLoginAction is hard-blocked server-side outside development, so this
      // branch is purely a local convenience — production always takes the real path below.
      if (process.env.NODE_ENV !== 'production') {
        const result = await devInstantLoginAction(trimmedEmail)
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

      // Production: a real magic-link login, same mechanism Sign Up uses, gated to existing
      // accounts only — shouldCreateUser: false means an unrecognized email errors here instead
      // of silently creating a new account under "Log In".
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { emailRedirectTo: callbackUrl(), shouldCreateUser: false },
      })
      setSubmitting(false)
      if (otpError) {
        // shouldCreateUser: false failing is overwhelmingly "no account for this email" — the one
        // other real case a sender can hit here is a rate limit, which gets its own message so it
        // doesn't read as "we don't know you" when really it just means "wait a minute".
        setError(
          otpError.code === 'over_email_send_rate_limit' || /rate limit/i.test(otpError.message ?? '')
            ? describeSendError(otpError)
            : "We couldn't find an account for that email. Want to sign up instead?"
        )
        return
      }
      setStep('otp')
      return
    }

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { emailRedirectTo: callbackUrl(), data: { full_name: name.trim() } },
    })
    setSubmitting(false)
    if (otpError) {
      setError(describeSendError(otpError))
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
            <TabPills
              ariaLabel="Sign up or log in"
              value={mode}
              onChange={(next) => {
                setMode(next)
                setError('')
              }}
              options={[
                { value: 'signup', label: ctaCopy.authModalTabSignup, id: 'auth-gate-tab-signup', panelId: 'auth-gate-panel' },
                { value: 'login', label: ctaCopy.authModalTabLogin, id: 'auth-gate-tab-login', panelId: 'auth-gate-panel' },
              ]}
            />
            <div role="tabpanel" id="auth-gate-panel" aria-labelledby={mode === 'signup' ? 'auth-gate-tab-signup' : 'auth-gate-tab-login'}>
              <h2 id="auth-gate-heading" className="mt-4 text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
                {mode === 'signup' ? ctaCopy.authModalHeading : ctaCopy.authModalLoginHeading}
              </h2>
              <div className="mt-2 text-[12.5px] leading-relaxed text-[#2C2C2C] opacity-72">
                {mode === 'signup' ? ctaCopy.authModalSubtext : ctaCopy.authModalLoginSubtext}
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="mt-4.5 flex w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 font-sans text-[15px] font-bold text-[#1A1A2E]"
              >
                <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.32Z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
                </svg>
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
                    className="w-full rounded-[14px] border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
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
                  className="w-full rounded-[14px] border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
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
                className="mt-4 w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-50"
              >
                {mode === 'signup' ? ctaCopy.authModalSignupSubmit : ctaCopy.authModalLoginSubmit}
              </button>
            </div>
            <button type="button" onClick={onClose} className="mt-2 w-full p-1.5 text-[13.5px] font-semibold text-[#2C2C2C] opacity-70">
              Not yet
            </button>
          </div>
        ) : (
          <div className="py-1.5 text-center">
            <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF8F00] text-2xl text-white">✉</div>
            <h2 id="auth-gate-heading" className="mt-4 text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
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
