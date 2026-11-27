'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { devInstantLoginAction, checkAuthRateLimitAction } from '@/app/auth/actions'
import { ctaCopy } from '@/constants/ctaCopy'
import { flags } from '@/lib/flags'
import { safeNextPath } from '@/lib/authRedirect'
import { TabPills } from '@/components/shared/TabPills'

export type AuthGateProps = {
  /** Page to go to once signed in (path only — anything else becomes "/"). Also what the emailed link returns to. */
  next?: string
  /** Which framing to open with — the person can still switch. Defaults to 'signup'. */
  initialMode?: 'signup' | 'login'
  /** Set after /auth/callback reported a failed link. Opens on the code step with the email this
   * browser remembers, or on the email form (with an explanation) if it never started the sign-in. */
  authFailed?: boolean
}

// A sign-in that has had its code emailed but not finished. Kept in localStorage (never the URL) so a
// reload, or leaving the site and coming back, reopens on the code step instead of a blank form.
// The code itself is never stored — only what's needed to ask for it again.
const PENDING_SIGNIN_KEY = 'kindness-currency:pending-signin'
// Matches how long the emailed code stays valid.
const PENDING_SIGNIN_TTL_MS = 60 * 60 * 1000

type PendingSignIn = { email: string; mode: 'signup' | 'login'; name: string; sentAt: number }

function parsePendingSignIn(raw: string | null): PendingSignIn | null {
  if (!raw) return null
  try {
    const saved: unknown = JSON.parse(raw)
    if (
      typeof saved === 'object' && saved !== null &&
      'email' in saved && typeof saved.email === 'string' && saved.email &&
      'mode' in saved && (saved.mode === 'signup' || saved.mode === 'login') &&
      'name' in saved && typeof saved.name === 'string' &&
      'sentAt' in saved && typeof saved.sentAt === 'number' &&
      Date.now() - saved.sentAt < PENDING_SIGNIN_TTL_MS
    ) {
      return { email: saved.email, mode: saved.mode, name: saved.name, sentAt: saved.sentAt }
    }
  } catch {
    // unreadable — treated like nothing saved
  }
  return null
}

function savePendingSignIn(pending: PendingSignIn) {
  window.localStorage.setItem(PENDING_SIGNIN_KEY, JSON.stringify(pending))
}

function clearPendingSignIn() {
  window.localStorage.removeItem(PENDING_SIGNIN_KEY)
}

const OTP_LENGTH = 6
// Supabase allows one email per address per 60s (auth max_frequency); a shorter cooldown would unlock
// a button whose next tap is guaranteed to fail with a rate-limit error.
const RESEND_COOLDOWN_SECONDS = 60

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

const noSubscription = () => () => {}

// Reads the saved sign-in without an effect: the server (and the first hydration pass) see "nothing
// saved", the browser then sees the real value. The inner form is keyed on it, so it starts on the
// right step instead of flashing the blank form first.
export function AuthGate(props: AuthGateProps) {
  const raw = useSyncExternalStore(
    noSubscription,
    () => window.localStorage.getItem(PENDING_SIGNIN_KEY),
    () => null
  )
  const saved = useMemo(() => parsePendingSignIn(raw), [raw])
  return <AuthGateForm key={saved ? 'resume' : 'fresh'} {...props} saved={saved} />
}

function AuthGateForm({
  next: rawNext,
  initialMode = 'signup',
  authFailed = false,
  saved,
}: AuthGateProps & { saved: PendingSignIn | null }) {
  const router = useRouter()
  const next = safeNextPath(rawNext)
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(saved?.email ?? null)
  const [step, setStep] = useState<'form' | 'otp'>(saved ? 'otp' : 'form')
  const [code, setCode] = useState('')
  const [fixingEmail, setFixingEmail] = useState(false)
  // Resend is gated by a deadline rather than a decrementing counter, so a backgrounded tab
  // (where timers throttle) still shows the true time left when it wakes.
  // After a failed link the old code is spent, so a new one is wanted straight away; otherwise the
  // countdown carries on from when the last one was sent.
  const [cooldownEndsAt, setCooldownEndsAt] = useState(
    saved && !authFailed ? saved.sentAt + RESEND_COOLDOWN_SECONDS * 1000 : 0
  )
  const [now, setNow] = useState(() => Date.now())
  const cooldown = Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000))
  const [mode, setMode] = useState<'signup' | 'login'>(saved?.mode ?? initialMode)
  const [name, setName] = useState(saved?.name ?? '')
  const [email, setEmail] = useState(saved?.email ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Stays true after a successful signInWithOAuth call on purpose: the browser is mid-redirect to
  // Google, so the button should keep showing progress until the page actually unloads.
  const [googleLoading, setGoogleLoading] = useState(false)
  const [noAccount, setNoAccount] = useState(false)

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  // Login only ever signs in existing accounts; signup creates one and stores the name.
  const otpOptions = () =>
    mode === 'login'
      ? { emailRedirectTo: callbackUrl(), shouldCreateUser: false }
      : { emailRedirectTo: callbackUrl(), data: { full_name: name.trim() } }

  useEffect(() => {
    if (cooldownEndsAt <= Date.now()) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [cooldownEndsAt])

  // A code just went out: remember it for a return visit and hold the resend button for a minute.
  const rememberSend = () => {
    const current = Date.now()
    savePendingSignIn({ email: email.trim(), mode, name: name.trim(), sentAt: current })
    setNow(current)
    setCooldownEndsAt(current + RESEND_COOLDOWN_SECONDS * 1000)
  }

  const goToCodeStep = () => {
    rememberSend()
    setStep('otp')
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    const trimmedEmail = email.trim()
    setError('')
    const rateLimit = await checkAuthRateLimitAction(trimmedEmail)
    if (!rateLimit.allowed) {
      setError(rateLimit.error)
      return
    }
    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({ email: trimmedEmail, options: otpOptions() })
    if (otpError) {
      setError(describeSendError(otpError))
      return
    }
    rememberSend()
  }

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
    setNoAccount(false)

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
        window.location.assign(next)
        return
      }

      // Production: a real magic-link login, same mechanism Sign Up uses, gated to existing
      // accounts only — shouldCreateUser: false means an unrecognized email errors here instead
      // of silently creating a new account under "Log In".
      const rateLimit = await checkAuthRateLimitAction(trimmedEmail)
      if (!rateLimit.allowed) {
        setSubmitting(false)
        setError(rateLimit.error)
        return
      }
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: otpOptions(),
      })
      setSubmitting(false)
      if (otpError) {
        // Only Supabase's "signups not allowed" response (what shouldCreateUser: false returns for
        // an unknown email) means "no account". Anything else — rate limit, bad email, server
        // failure — gets its own honest message instead of wrongly telling someone we don't know them.
        if (otpError.code === 'otp_disabled' || /signups? not allowed/i.test(otpError.message ?? '')) {
          setError("We couldn't find an account for that email. Want to sign up instead?")
          setNoAccount(true)
        } else {
          setError(describeSendError(otpError))
        }
        return
      }
      goToCodeStep()
      return
    }

    const rateLimit = await checkAuthRateLimitAction(trimmedEmail)
    if (!rateLimit.allowed) {
      setSubmitting(false)
      setError(rateLimit.error)
      return
    }
    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: otpOptions(),
    })
    setSubmitting(false)
    if (otpError) {
      setError(describeSendError(otpError))
      return
    }
    goToCodeStep()
  }

  const handleCodeChange = async (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH)
    setCode(digits)
    if (digits.length < OTP_LENGTH) return
    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: digits, type: 'email' })
    if (verifyError) {
      setCode('')
      setError(ctaCopy.authModalCodeError)
      return
    }
    clearPendingSignIn()
    router.replace(next)
  }

  const handleGoogleSignIn = async () => {
    if (googleLoading) return
    setError('')
    setGoogleLoading(true)
    try {
      // No email yet at this point (Google collects it after redirect) — IP-only check.
      const rateLimit = await checkAuthRateLimitAction()
      if (!rateLimit.allowed) {
        setGoogleLoading(false)
        setError(rateLimit.error)
        return
      }
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl() },
      })
      if (oauthError) {
        setGoogleLoading(false)
        setError('Something went wrong signing in with Google. Please try again.')
      }
    } catch {
      setGoogleLoading(false)
      setError('Something went wrong signing in with Google. Please try again.')
    }
  }

  return (
    <div className="w-full rounded-[26px] bg-[#FFF8F0] px-6 pt-6.5 pb-7.5">
      <div>
        {step === 'form' ? (
          <div>
            {authFailed && !rememberedEmail && (
              <div role="status" className="mb-3 rounded-xl bg-[#FF8F00]/10 px-3.5 py-3 text-[12.5px] leading-relaxed text-[#1A1A2E]">
                {ctaCopy.authModalResumeNoticeNoEmail}
              </div>
            )}
            <TabPills
              ariaLabel="Sign up or log in"
              value={mode}
              onChange={(next) => {
                setMode(next)
                setError('')
                setNoAccount(false)
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
              {flags.googleSignIn && (
              <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || submitting}
                aria-busy={googleLoading}
                className="mt-4.5 flex w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 font-sans text-[15px] font-bold text-[#1A1A2E] transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {googleLoading ? (
                  <span aria-hidden="true" className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[#1A1A2E]/20 border-t-[#1A1A2E]" />
                ) : (
                <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.32Z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
                </svg>
                )}
                {googleLoading ? ctaCopy.authModalGoogleLoading : 'Continue with Google'}
              </button>
              <div className="mt-3.5 flex items-center gap-2.5 text-[11.5px] font-semibold text-[#2C2C2C] opacity-50">
                <span className="h-px flex-1 bg-[#1A1A2E]/14" />
                or
                <span className="h-px flex-1 bg-[#1A1A2E]/14" />
              </div>
              </>
              )}
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
                  autoFocus={fixingEmail}
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
              {noAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError('')
                    setNoAccount(false)
                  }}
                  className="mt-1 text-[13px] font-bold text-[#C2185B] underline"
                >
                  Switch to Sign Up
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || googleLoading}
                className="mt-4 w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white disabled:opacity-50"
              >
                {mode === 'signup' ? ctaCopy.authModalSignupSubmit : ctaCopy.authModalLoginSubmit}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-1.5 text-center">
            <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF8F00] text-2xl text-white">✉</div>
            <h2 id="auth-gate-heading" className="mt-4 text-[23px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
              {ctaCopy.authModalCodeHeading}
            </h2>
            <div className="mt-2 text-[13px] leading-relaxed text-[#2C2C2C] opacity-72">
              We sent a 6-digit code to <b>{email}</b>. Type it here, or tap the link in the email — no password needed.
            </div>
            {authFailed && rememberedEmail && (
              <div role="status" className="mt-3 rounded-xl bg-[#FF8F00]/10 px-3.5 py-3 text-left text-[12.5px] leading-relaxed text-[#1A1A2E]">
                {ctaCopy.authModalResumeNotice}
              </div>
            )}
            <input
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              aria-label="6-digit code"
              className="mt-4 w-full rounded-[14px] border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-center text-[22px] tracking-[0.4em] text-[#1A1A2E] outline-none"
            />
            {error && (
              <div role="alert" className="mt-2 text-[12.5px] text-[#C2185B]">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="mt-3 text-[13px] font-bold text-[#C2185B] underline disabled:no-underline disabled:opacity-50"
            >
              {cooldown > 0 ? `${ctaCopy.authModalResend} (${cooldown}s)` : ctaCopy.authModalResend}
            </button>
            <div className="mt-3 text-[13px] text-[#2C2C2C]">
              {ctaCopy.authModalFixEmailPrompt}{' '}
              <button
                type="button"
                onClick={() => {
                  clearPendingSignIn()
                  setRememberedEmail(null)
                  setCode('')
                  setError('')
                  setFixingEmail(true)
                  setStep('form')
                }}
                className="font-bold text-[#C2185B] underline"
              >
                {ctaCopy.authModalFixEmailAction}
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-[#FF8F00]/10 px-3.5 py-3 text-left text-[12.5px] leading-relaxed text-[#1A1A2E]">
              <b>Don&apos;t see it? Check your spam or junk folder.</b> These emails sometimes land there
              instead of your main inbox — search for &quot;Kindness Currency&quot; if it&apos;s hard to
              spot.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
