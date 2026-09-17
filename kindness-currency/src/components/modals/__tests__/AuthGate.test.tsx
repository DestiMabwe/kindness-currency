import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthGate } from '../AuthGate'

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

const locationAssign = vi.fn()
Object.defineProperty(window, 'location', {
  configurable: true,
  value: { ...window.location, assign: locationAssign },
})

describe('AuthGate', () => {
  beforeEach(() => {
    signInWithOtp.mockReset()
    signInWithOAuth.mockReset()
    verifyOtp.mockReset()
    devInstantLoginAction.mockReset()
    locationAssign.mockReset()
    checkAuthRateLimitAction.mockReset().mockResolvedValue({ allowed: true })
  })

  it('renders the exact auth modal heading and subtext', () => {
    render(<AuthGate onClose={vi.fn()} />)
    expect(screen.getByText('Almost there — save your coupons')).toBeInTheDocument()
  })

  it('requires an email before submitting', async () => {
    render(<AuthGate onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(screen.getByText('Enter your email ♥')).toBeInTheDocument()
    expect(signInWithOtp).not.toHaveBeenCalled()
  })

  it('sends the OTP with an environment-aware redirect and the full name in user metadata', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    render(<AuthGate onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Full name'), 'Alex Rivera')
    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'alex@example.com',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fcreate`,
        data: { full_name: 'Alex Rivera' },
      },
    })
  })

  it('encodes a custom redirectTo into the callback URL', async () => {
    signInWithOtp.mockResolvedValue({ error: null })
    render(<AuthGate onClose={vi.fn()} redirectTo="/give/set-1" />)

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
    render(<AuthGate onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText('Check your inbox')).toBeInTheDocument()
  })

  it('shows a generic error and stays on the form for an unrecognized failure', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'internal server error', code: 'unexpected_failure' } })
    render(<AuthGate onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText(/Something went wrong sending your link/)).toBeInTheDocument()
    expect(screen.queryByText('Check your inbox')).not.toBeInTheDocument()
  })

  it('rejects an obviously malformed email before ever calling Supabase', async () => {
    render(<AuthGate onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Email address'), 'notanemail')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(screen.getByText("That doesn't look like a valid email address.")).toBeInTheDocument()
    expect(signInWithOtp).not.toHaveBeenCalled()
  })

  it('shows a specific rate-limit message instead of the generic failure text', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' } })
    render(<AuthGate onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText(/wait a minute before trying again/)).toBeInTheDocument()
    expect(screen.queryByText(/Something went wrong sending your link/)).not.toBeInTheDocument()
  })

  it('distinguishes a rate limit from an invalid email, even though both are 4xx failures', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'Unable to validate email address: invalid format', code: 'email_address_invalid' } })
    render(<AuthGate onClose={vi.fn()} />)

    // A format Supabase itself rejects but this component's own light client-side check doesn't
    // (the regex only screens the obvious cases) still needs to reach the network and come back
    // with its own distinct message, not the rate-limit or generic one.
    await userEvent.type(screen.getByLabelText('Email address'), 'a@b.c')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText("That doesn't look like a valid email address.")).toBeInTheDocument()
  })

  describe('login mode', () => {
    it('opens in login mode when initialMode is "login", hiding the name field but keeping email + Google', () => {
      render(<AuthGate onClose={vi.fn()} initialMode="login" />)

      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
      expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Email me a magic link' })).not.toBeInTheDocument()
    })

    it('signs in with Google from login mode', async () => {
      signInWithOAuth.mockResolvedValue({ error: null })
      render(<AuthGate onClose={vi.fn()} initialMode="login" />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=%2Fcreate` },
      })
    })

    it('logs in immediately from an email with no inbox round trip', async () => {
      devInstantLoginAction.mockResolvedValue({ success: true, tokenHash: 'hashed-token-1' })
      verifyOtp.mockResolvedValue({ error: null })
      render(<AuthGate onClose={vi.fn()} initialMode="login" />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

      expect(devInstantLoginAction).toHaveBeenCalledWith('alex@example.com')
      expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'hashed-token-1', type: 'magiclink' })
      await vi.waitFor(() => expect(locationAssign).toHaveBeenCalledWith('/create'))
    })

    it('shows a sign-up nudge when no account exists for that email', async () => {
      devInstantLoginAction.mockResolvedValue({ success: false, error: 'Could not log in with that email.' })
      render(<AuthGate onClose={vi.fn()} initialMode="login" />)

      await userEvent.type(screen.getByLabelText('Email address'), 'nobody@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

      expect(await screen.findByText('Could not log in with that email.')).toBeInTheDocument()
      expect(verifyOtp).not.toHaveBeenCalled()
    })

    it('shows a nudge if the generated token fails to verify', async () => {
      devInstantLoginAction.mockResolvedValue({ success: true, tokenHash: 'hashed-token-1' })
      verifyOtp.mockResolvedValue({ error: { message: 'expired' } })
      render(<AuthGate onClose={vi.fn()} initialMode="login" />)

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
        render(<AuthGate onClose={vi.fn()} initialMode="login" />)

        await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

        expect(signInWithOtp).toHaveBeenCalledWith({
          email: 'alex@example.com',
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fcreate`,
            shouldCreateUser: false,
          },
        })
        expect(devInstantLoginAction).not.toHaveBeenCalled()
      })

      it('shows the "check your inbox" step after a successful production login send', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        signInWithOtp.mockResolvedValue({ error: null })
        render(<AuthGate onClose={vi.fn()} initialMode="login" />)

        await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

        expect(await screen.findByText('Check your inbox')).toBeInTheDocument()
      })

      it('shows a sign-up nudge when no account exists for that email, without creating one', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        signInWithOtp.mockResolvedValue({ error: { message: 'Unable to validate email address: not found' } })
        render(<AuthGate onClose={vi.fn()} initialMode="login" />)

        await userEvent.type(screen.getByLabelText('Email address'), 'nobody@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

        expect(await screen.findByText(/Want to sign up instead/)).toBeInTheDocument()
        expect(screen.queryByText('Check your inbox')).not.toBeInTheDocument()
      })

      it('shows a rate-limit message rather than the "no account" nudge when that\'s the real cause', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        signInWithOtp.mockResolvedValue({ error: { message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' } })
        render(<AuthGate onClose={vi.fn()} initialMode="login" />)

        await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
        await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

        expect(await screen.findByText(/wait a minute before trying again/)).toBeInTheDocument()
        expect(screen.queryByText(/Want to sign up instead/)).not.toBeInTheDocument()
      })
    })

    it('switches from signup to login and back via the tabs', async () => {
      render(<AuthGate onClose={vi.fn()} />)

      expect(screen.getByLabelText('Full name')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('tab', { name: 'Log In' }))

      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('tab', { name: 'Sign Up' }))

      expect(screen.getByText('Almost there — save your coupons')).toBeInTheDocument()
      expect(screen.getByLabelText('Full name')).toBeInTheDocument()
    })

    it('opens with the Sign Up tab active by default', () => {
      render(<AuthGate onClose={vi.fn()} />)

      expect(screen.getByRole('tab', { name: 'Sign Up' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Log In' })).toHaveAttribute('aria-selected', 'false')
    })

    it('links each tab to the panel it controls, and the panel back to whichever tab is active', () => {
      render(<AuthGate onClose={vi.fn()} />)

      const signUpTab = screen.getByRole('tab', { name: 'Sign Up' })
      const panel = screen.getByRole('tabpanel')

      expect(signUpTab).toHaveAttribute('aria-controls', panel.id)
      expect(panel).toHaveAttribute('aria-labelledby', signUpTab.id)
    })

    it('opens with the Log In tab active when initialMode is "login"', () => {
      render(<AuthGate onClose={vi.fn()} initialMode="login" />)

      expect(screen.getByRole('tab', { name: 'Log In' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Sign Up' })).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('Google sign-in', () => {
    it('calls signInWithOAuth with the google provider and an environment-aware redirect', async () => {
      signInWithOAuth.mockResolvedValue({ error: null })
      render(<AuthGate onClose={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=%2Fcreate` },
      })
    })

    it('shows an error if Google sign-in fails to start', async () => {
      signInWithOAuth.mockResolvedValue({ error: { message: 'provider not configured' } })
      render(<AuthGate onClose={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(await screen.findByText(/Something went wrong signing in with Google/)).toBeInTheDocument()
    })

    it('does not affect the existing email magic-link flow', async () => {
      signInWithOtp.mockResolvedValue({ error: null })
      render(<AuthGate onClose={vi.fn()} />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

      expect(await screen.findByText('Check your inbox')).toBeInTheDocument()
      expect(signInWithOAuth).not.toHaveBeenCalled()
    })
  })

  describe('rate limiting', () => {
    it('blocks a signup send and never calls Supabase once our own limit is exceeded', async () => {
      checkAuthRateLimitAction.mockResolvedValue({ allowed: false, error: 'Too many requests. Please wait.' })
      render(<AuthGate onClose={vi.fn()} />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

      expect(await screen.findByText('Too many requests. Please wait.')).toBeInTheDocument()
      expect(signInWithOtp).not.toHaveBeenCalled()
      expect(checkAuthRateLimitAction).toHaveBeenCalledWith('alex@example.com')
    })

    it('blocks a production login send once our own limit is exceeded', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      checkAuthRateLimitAction.mockResolvedValue({ allowed: false, error: 'Too many requests. Please wait.' })
      render(<AuthGate onClose={vi.fn()} initialMode="login" />)

      await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

      expect(await screen.findByText('Too many requests. Please wait.')).toBeInTheDocument()
      expect(signInWithOtp).not.toHaveBeenCalled()
      vi.unstubAllEnvs()
    })

    it('blocks Google sign-in once our own IP limit is exceeded, checked with no email', async () => {
      checkAuthRateLimitAction.mockResolvedValue({ allowed: false, error: 'Too many requests. Please wait.' })
      render(<AuthGate onClose={vi.fn()} />)

      await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

      expect(await screen.findByText('Too many requests. Please wait.')).toBeInTheDocument()
      expect(signInWithOAuth).not.toHaveBeenCalled()
      expect(checkAuthRateLimitAction).toHaveBeenCalledWith(undefined)
    })
  })
})
