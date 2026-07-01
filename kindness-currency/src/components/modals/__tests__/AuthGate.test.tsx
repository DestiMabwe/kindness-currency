import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthGate } from '../AuthGate'

const signInWithOtp = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOtp } }),
}))

describe('AuthGate', () => {
  beforeEach(() => {
    signInWithOtp.mockReset()
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: 'Alex Rivera' },
      },
    })
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
})
