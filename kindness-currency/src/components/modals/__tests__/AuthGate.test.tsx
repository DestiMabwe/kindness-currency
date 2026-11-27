import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthGate } from '../AuthGate'
import { ctaCopy } from '@/constants/ctaCopy'

const mockFlags = vi.hoisted(() => ({ googleSignIn: true }))
vi.mock('@/lib/flags', () => ({ flags: mockFlags }))

const signInWithOtp = vi.fn()
const signInWithOAuth = vi.fn()
const verifyOtp = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOtp, signInWithOAuth, verifyOtp } }),
}))

const devInstantLoginAction = vi.fn()
const checkAuthRateLimitAction = vi.fn()
vi.mock('@/app/auth/actions', () => ({
  devInstantLoginAction: (email: string) => devInstantLoginAction(email),
  checkAuthRateLimitAction: (email?: string) => checkAuthRateLimitAction(email),
}))

const routerRefresh = vi.fn()
const routerReplace = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: routerRefresh, replace: routerReplace }) }))

const locationAssign = vi.fn()
Object.defineProperty(window, 'location', {
  configurable: true,
  value: { ...window.location, assign: locationAssign },
})

describe('AuthGate', () => {
  beforeEach(() => {
    mockFlags.googleSignIn = true
    signInWithOtp.mockReset()
    signInWithOAuth.mockReset()
    verifyOtp.mockReset()
    devInstantLoginAction.mockReset()
    locationAssign.mockReset()
    routerRefresh.mockReset()
    routerReplace.mockReset()
    window.localStorage.clear()
    checkAuthRateLimitAction.mockReset().mockResolvedValue({ allowed: true })
  })

  it('renders as part of the page, not as a dialog that can vanish on navigation', () => {
    render(<AuthGate />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(Not yet|Close)$/ })).not.toBeInTheDocument()
  })

  it('renders the exact auth modal heading and subtext', () => {
    render(<AuthGate />)
    expect(screen.getByText('Almost there — save your coupons')).toBeInTheDocument()
  })

  it('hides Continue with Google (and its "or" divider) while the googleSignIn flag is off, keeping email sign-in', () => {
    mockFlags.googleSignIn = false
    render(<AuthGate />)

    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument()
    expect(screen.queryByText('or')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Email me a magic link' })).toBeInTheDocument()
  })

  it('requires an email before submitting', async () => {
    render(<AuthGate />)

    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(screen.getByText('Enter your email ♥')).toBeInTheDocument()
    expect(signInWithOtp).not.toHaveBeenCalled()
  })

  it('sends the OTP with an environment-aware redirect and the full name in user metadata', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    render(<AuthGate />)

    await userEvent.type(screen.getByLabelText('Full name'), 'Alex Rivera')
    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'alex@example.com',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2F`,
        data: { full_name: 'Alex Rivera' },
      },
    })
  })

  it('encodes a custom next path into the callback URL', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    render(<AuthGate next="/give/set-1" />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fgive%2Fset-1` }),
      })
    )
  })

  it('shows the "check your inbox" step after a successful send', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    render(<AuthGate />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText('Enter your code')).toBeInTheDocument()
  })

  // Regression coverage: magic links from this app's shared transactional-email sender have
  // landed in spam for real senders (see the session's own email-deliverability investigation) —
  // the "check your inbox" step must make checking spam/junk unmissable, not a buried aside.
  it('makes checking spam/junk unmissable on the "check your inbox" step', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    render(<AuthGate />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText(/Check your spam or junk folder/)).toBeInTheDocument()
  })

  describe('code entry step', () => {
    async function reachCodeStep(props: Partial<React.ComponentProps<typeof AuthGate>> = {}) {
      signInWithOtp.mockResolvedValue({ error: null })
      render(<AuthGate {...props} />)
      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))
      return screen.findByLabelText('6-digit code')
    }

    it('verifies a correct code, then goes to the page the person came from — without a full reload', async () => {
      verifyOtp.mockResolvedValue({ error: null })
      const codeInput = await reachCodeStep({ next: '/cart' })

      await userEvent.type(codeInput, '123456')

      expect(verifyOtp).toHaveBeenCalledWith({ email: 'alex@example.com', token: '123456', type: 'email' })
      await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/cart'))
      expect(locationAssign).not.toHaveBeenCalled()
    })

    it('goes to the home page when no next path was given', async () => {
      verifyOtp.mockResolvedValue({ error: null })
      const codeInput = await reachCodeStep()

      await userEvent.type(codeInput, '123456')

      await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/'))
    })

    it('never navigates to an off-site next path, even if one is passed in', async () => {
      verifyOtp.mockResolvedValue({ error: null })
      const codeInput = await reachCodeStep({ next: '//evil.com' })

      await userEvent.type(codeInput, '123456')

      await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/'))
    })

    it('shows a soft error and clears the field for a wrong or expired code, staying put', async () => {
      verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } })
      const codeInput = await reachCodeStep({ next: '/cart' })

      await userEvent.type(codeInput, '000000')

      expect(await screen.findByRole('alert')).toHaveTextContent("That code didn't work — check it or send a new one")
      expect(codeInput).toHaveValue('')
      expect(routerReplace).not.toHaveBeenCalled()
    })

    it('only allows a new code after a 60-second cooldown (Supabase allows one email per address per minute), then sends it through the rate-limit check', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      try {
        await reachCodeStep()
        expect(signInWithOtp).toHaveBeenCalledTimes(1)
        const resend = screen.getByRole('button', { name: /Send a new code/ })
        expect(resend).toBeDisabled()
        expect(resend).toHaveTextContent('60')

        await act(async () => {
          await vi.advanceTimersByTimeAsync(60_000)
        })
        expect(resend).toBeEnabled()

        await userEvent.click(resend)

        expect(checkAuthRateLimitAction).toHaveBeenLastCalledWith('alex@example.com')
        await vi.waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(2))
        expect(screen.getByRole('button', { name: /Send a new code/ })).toBeDisabled()
      } finally {
        vi.useRealTimers()
      }
    })

    describe('after a sign-in link failed', () => {
      it('reopens on the code step with the remembered email and an immediately available resend', async () => {
        const first = render(<AuthGate />)
        await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
        signInWithOtp.mockResolvedValue({ error: null })
        await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))
        await screen.findByLabelText('6-digit code')
        first.unmount()

        render(<AuthGate authFailed />)

        expect(await screen.findByLabelText('6-digit code')).toBeInTheDocument()
        expect(screen.getByText('alex@example.com')).toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveTextContent(ctaCopy.authModalResumeNotice)
        expect(screen.getByRole('button', { name: ctaCopy.authModalResend })).toBeEnabled()
      })

      it('falls back to the email form with an explanation when this browser never started the sign-in', () => {
        render(<AuthGate authFailed />)

        expect(screen.getByLabelText('Email address')).toBeInTheDocument()
        expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument()
        expect(screen.getByRole('status')).toHaveTextContent(ctaCopy.authModalResumeNoticeNoEmail)
      })

      it('forgets the remembered email once sign-in succeeds', async () => {
        verifyOtp.mockResolvedValue({ error: null })
        const codeInput = await reachCodeStep()
        await userEvent.type(codeInput, '123456')
        await vi.waitFor(() => expect(routerReplace).toHaveBeenCalled())
        cleanup()

        render(<AuthGate authFailed />)

        expect(screen.getAllByLabelText('Email address').length).toBeGreaterThan(0)
        expect(screen.queryAllByLabelText('6-digit code')).toHaveLength(0)
      })
    })

    describe('coming back after leaving the page', () => {
      async function startSignup() {
        signInWithOtp.mockResolvedValue({ error: null })
        const first = render(<AuthGate />)
        await userEvent.type(screen.getByLabelText('Full name'), 'Alex Rivera')
        await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))
        await screen.findByLabelText('6-digit code')
        first.unmount()
      }

      afterEach(() => {
        vi.useRealTimers()
      })

      it('reopens on the code step with the email shown, no error notice, after a reload', async () => {
        await startSignup()

        render(<AuthGate />)

        expect(await screen.findByLabelText('6-digit code')).toBeInTheDocument()
        expect(screen.getByText('alex@example.com')).toBeInTheDocument()
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      it('lets them finish signing in with the code already in their inbox', async () => {
        await startSignup()
        verifyOtp.mockResolvedValue({ error: null })
        render(<AuthGate next="/cart" />)

        await userEvent.type(await screen.findByLabelText('6-digit code'), '123456')

        expect(verifyOtp).toHaveBeenCalledWith({ email: 'alex@example.com', token: '123456', type: 'email' })
        await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/cart'))
      })

      it('keeps the resend countdown running instead of restarting it', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        await startSignup()
        await act(async () => {
          await vi.advanceTimersByTimeAsync(45_000)
        })

        render(<AuthGate />)

        const resend = await screen.findByRole('button', { name: /Send a new code/ })
        expect(resend).toBeDisabled()
        expect(resend).toHaveTextContent('15')
      })

      it('keeps the signup name, so a resent code still creates the account with it', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        await startSignup()
        await act(async () => {
          await vi.advanceTimersByTimeAsync(61_000)
        })
        render(<AuthGate />)

        await userEvent.click(await screen.findByRole('button', { name: ctaCopy.authModalResend }))

        await vi.waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(2))
        expect(signInWithOtp).toHaveBeenLastCalledWith(
          expect.objectContaining({ options: expect.objectContaining({ data: { full_name: 'Alex Rivera' } }) })
        )
      })

      it('starts fresh once the code is more than an hour old', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        await startSignup()
        await act(async () => {
          await vi.advanceTimersByTimeAsync(61 * 60_000)
        })

        render(<AuthGate />)

        expect(screen.getByLabelText('Email address')).toHaveValue('')
        expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument()
      })

      it('starts fresh after signing in', async () => {
        await startSignup()
        verifyOtp.mockResolvedValue({ error: null })
        render(<AuthGate />)
        await userEvent.type(await screen.findByLabelText('6-digit code'), '123456')
        await vi.waitFor(() => expect(routerReplace).toHaveBeenCalled())
        cleanup()

        render(<AuthGate />)

        expect(screen.getByLabelText('Email address')).toHaveValue('')
      })

      it('starts fresh after choosing to fix the email', async () => {
        await startSignup()
        render(<AuthGate />)
        await userEvent.click(await screen.findByRole('button', { name: /Fix it and we'll send a new code/ }))
        cleanup()

        render(<AuthGate />)

        expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument()
      })

      it('ignores a saved record it cannot read', () => {
        window.localStorage.setItem('kindness-currency:pending-signin', '{not json')

        render(<AuthGate />)

        expect(screen.getByLabelText('Email address')).toHaveValue('')
      })
    })

    it('lets someone who mistyped their email go back to the form with their details kept', async () => {
      await reachCodeStep()

      await userEvent.click(screen.getByRole('button', { name: /Fix it and we'll send a new code/ }))

      expect(screen.getByLabelText('Email address')).toHaveValue('alex@example.com')
      expect(screen.getByLabelText('Email address')).toHaveFocus()
      expect(screen.queryByLabelText('6-digit code')).not.toBeInTheDocument()
    })
  })

  it('shows a generic error and stays on the form for an unrecognized failure', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'internal server error', code: 'unexpected_failure' } })
    render(<AuthGate />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText(/Something went wrong sending your link/)).toBeInTheDocument()
    expect(screen.queryByText('Enter your code')).not.toBeInTheDocument()
  })

  it('rejects an obviously malformed email before ever calling Supabase', async () => {
    render(<AuthGate />)

    await userEvent.type(screen.getByLabelText('Email address'), 'notanemail')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(screen.getByText("That doesn't look like a valid email address.")).toBeInTheDocument()
    expect(signInWithOtp).not.toHaveBeenCalled()
  })

  it('shows a specific rate-limit message instead of the generic failure text', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' } })
    render(<AuthGate />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText(/wait a minute before trying again/)).toBeInTheDocument()
    expect(screen.queryByText(/Something went wrong sending your link/)).not.toBeInTheDocument()
  })

  it('distinguishes a rate limit from an invalid email, even though both are 4xx failures', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'Unable to validate email address: invalid format', code: 'email_address_invalid' } })
    render(<AuthGate />)

    // A format Supabase itself rejects but this component's own light client-side check doesn't
    // (the regex only screens the obvious cases) still needs to reach the network and come back
    // with its own distinct message, not the rate-limit or generic one.
    await userEvent.type(screen.getByLabelText('Email address'), 'a@b.c')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText("That doesn't look like a valid email address.")).toBeInTheDocument()
  })

  describe('login mode', () => {
    it('opens in login mode when initialMode is "login", hiding the name field but keeping email + Google', () => {
      render(<AuthGate initialMode="login" />)

      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Email me a magic link' })).not.toBeInTheDocument()
    })

    it('signs in with Google from login mode', async () => {
      signInWithOAuth.mockResolvedValue({ error: null })
      render(<AuthGate initialMode="login" />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=%2F` },
      })
    })

    it('shows a disabled loading state on the Google button while redirecting', async () => {
      signInWithOAuth.mockReturnValue(new Promise(() => {}))
      render(<AuthGate initialMode="login" />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      const loading = await screen.findByRole('button', { name: 'Redirecting to Google…' })
      expect(loading).toBeDisabled()
      expect(loading).toHaveAttribute('aria-busy', 'true')
    })

    it('restores the Google button and shows an error if Google sign-in fails', async () => {
      signInWithOAuth.mockResolvedValue({ error: { message: 'boom' } })
      render(<AuthGate initialMode="login" />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(await screen.findByText('Something went wrong signing in with Google. Please try again.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()
    })

    it('logs in immediately from an email with no inbox round trip', async () => {
      devInstantLoginAction.mockResolvedValue({ success: true, tokenHash: 'hashed-token-1' })
      verifyOtp.mockResolvedValue({ error: null })
      render(<AuthGate initialMode="login" />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

      expect(devInstantLoginAction).toHaveBeenCalledWith('alex@example.com')
      expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'hashed-token-1', type: 'magiclink' })
      await vi.waitFor(() => expect(locationAssign).toHaveBeenCalledWith('/'))
    })

    it('shows a sign-up nudge when no account exists for that email', async () => {
      devInstantLoginAction.mockResolvedValue({ success: false, error: 'Could not log in with that email.' })
      render(<AuthGate initialMode="login" />)

      await userEvent.type(screen.getByLabelText('Email address'), 'nobody@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

      expect(await screen.findByText('Could not log in with that email.')).toBeInTheDocument()
      expect(verifyOtp).not.toHaveBeenCalled()
    })

    it('shows a nudge if the generated token fails to verify', async () => {
      devInstantLoginAction.mockResolvedValue({ success: true, tokenHash: 'hashed-token-1' })
      verifyOtp.mockResolvedValue({ error: { message: 'expired' } })
      render(<AuthGate initialMode="login" />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

      expect(await screen.findByText(/Want to sign up instead/)).toBeInTheDocument()
      expect(locationAssign).not.toHaveBeenCalled()
    })

    describe('in production', () => {
      afterEach(() => {
        vi.unstubAllEnvs()
      })

      it('sends a real magic link gated to existing accounts instead of the dev instant-login shortcut', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        signInWithOtp.mockResolvedValue({ error: null })
        render(<AuthGate initialMode="login" />)

        await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

        expect(signInWithOtp).toHaveBeenCalledWith({
          email: 'alex@example.com',
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=%2F`,
            shouldCreateUser: false,
          },
        })
        expect(devInstantLoginAction).not.toHaveBeenCalled()
      })

      it('shows the "check your inbox" step after a successful production login send', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        signInWithOtp.mockResolvedValue({ error: null })
        render(<AuthGate initialMode="login" />)

        await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

        expect(await screen.findByText('Enter your code')).toBeInTheDocument()
      })

      it('shows a sign-up nudge when no account exists for that email, without creating one', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        signInWithOtp.mockResolvedValue({ error: { message: 'Signups not allowed for otp', code: 'otp_disabled' } })
        render(<AuthGate initialMode="login" />)

        await userEvent.type(screen.getByLabelText('Email address'), 'nobody@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

        expect(await screen.findByText(/Want to sign up instead/)).toBeInTheDocument()
        expect(screen.queryByText('Enter your code')).not.toBeInTheDocument()
      })

      it('shows a rate-limit message rather than the "no account" nudge when that\'s the real cause', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        signInWithOtp.mockResolvedValue({ error: { message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' } })
        render(<AuthGate initialMode="login" />)

        await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

        expect(await screen.findByText(/wait a minute before trying again/)).toBeInTheDocument()
        expect(screen.queryByText(/Want to sign up instead/)).not.toBeInTheDocument()
      })
    })

    it('switches from signup to login and back via the tabs', async () => {
      render(<AuthGate />)

      expect(screen.getByLabelText('Full name')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('tab', { name: 'Log In' }))

      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('tab', { name: 'Sign Up' }))

      expect(screen.getByText('Almost there — save your coupons')).toBeInTheDocument()
      expect(screen.getByLabelText('Full name')).toBeInTheDocument()
    })

    it('opens with the Sign Up tab active by default', () => {
      render(<AuthGate />)

      expect(screen.getByRole('tab', { name: 'Sign Up' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Log In' })).toHaveAttribute('aria-selected', 'false')
    })

    it('links each tab to the panel it controls, and the panel back to whichever tab is active', () => {
      render(<AuthGate />)

      const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
      const panel = screen.getByRole('tabpanel')

      expect(signUpTab).toHaveAttribute('aria-controls', panel.id)
      expect(panel).toHaveAttribute('aria-labelledby', signUpTab.id)
    })

    it('opens with the Log In tab active when initialMode is "login"', () => {
      render(<AuthGate initialMode="login" />)

      expect(screen.getByRole('tab', { name: 'Log In' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Sign Up' })).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('Google sign-in', () => {
    it('calls signInWithOAuth with the google provider and an environment-aware redirect', async () => {
      signInWithOAuth.mockResolvedValue({ error: null })
      render(<AuthGate />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=%2F` },
      })
    })

    it('shows an error if Google sign-in fails to start', async () => {
      signInWithOAuth.mockResolvedValue({ error: { message: 'provider not configured' } })
      render(<AuthGate />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(await screen.findByText(/Something went wrong signing in with Google/)).toBeInTheDocument()
    })

    it('does not affect the existing email magic-link flow', async () => {
      signInWithOtp.mockResolvedValue({ error: null })
      render(<AuthGate />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

      expect(await screen.findByText('Enter your code')).toBeInTheDocument()
      expect(signInWithOAuth).not.toHaveBeenCalled()
    })
  })

  describe('rate limiting', () => {
    it('blocks a signup send and never calls Supabase once our own limit is exceeded', async () => {
      checkAuthRateLimitAction.mockResolvedValue({ allowed: false, error: 'Too many requests. Please wait.' })
      render(<AuthGate />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

      expect(await screen.findByText('Too many requests. Please wait.')).toBeInTheDocument()
      expect(signInWithOtp).not.toHaveBeenCalled()
      expect(checkAuthRateLimitAction).toHaveBeenCalledWith('alex@example.com')
    })

    it('blocks a production login send once our own limit is exceeded', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      checkAuthRateLimitAction.mockResolvedValue({ allowed: false, error: 'Too many requests. Please wait.' })
      render(<AuthGate initialMode="login" />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

      expect(await screen.findByText('Too many requests. Please wait.')).toBeInTheDocument()
      expect(signInWithOtp).not.toHaveBeenCalled()
      vi.unstubAllEnvs()
    })

    it('blocks Google sign-in once our own IP limit is exceeded, checked with no email', async () => {
      checkAuthRateLimitAction.mockResolvedValue({ allowed: false, error: 'Too many requests. Please wait.' })
      render(<AuthGate />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(await screen.findByText('Too many requests. Please wait.')).toBeInTheDocument()
      expect(signInWithOAuth).not.toHaveBeenCalled()
      expect(checkAuthRateLimitAction).toHaveBeenCalledWith(undefined)
    })
  })
})
