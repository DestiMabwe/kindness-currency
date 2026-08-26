import { describe, it, expect, vi, beforeEach } from 'vitest'
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
vi.mock('@/app/auth/actions', () => ({
  devInstantLoginAction: (email: string) => devInstantLoginAction(email),
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

  it('shows an error and stays on the form if sending fails', async () => {
    signInWithOtp.mockResolvedValue({ error: { message: 'rate limited' } })
    render(<AuthGate onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Email address'), 'alex@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a magic link' }))

    expect(await screen.findByText(/Something went wrong sending your link/)).toBeInTheDocument()
    expect(screen.queryByText('Check your inbox')).not.toBeInTheDocument()
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
})
