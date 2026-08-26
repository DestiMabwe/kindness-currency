import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EarlyAccessSignupForm } from '../EarlyAccessSignupForm'

const signUpForEarlyAccessAction = vi.fn()
vi.mock('@/app/early-access/actions', () => ({
  signUpForEarlyAccessAction: (input: unknown) => signUpForEarlyAccessAction(input),
}))

beforeEach(() => {
  signUpForEarlyAccessAction.mockReset()
})

describe('EarlyAccessSignupForm', () => {
  it('renders name and email fields plus a submit button', () => {
    render(<EarlyAccessSignupForm templateSlug="made-by-him" />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notify me/i })).toBeInTheDocument()
  })

  it('shows an inline error and does not submit when the email is not valid', async () => {
    render(<EarlyAccessSignupForm templateSlug="made-by-him" />)

    await userEvent.type(screen.getByLabelText('Name'), 'Jamie')
    await userEvent.type(screen.getByLabelText('Email address'), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: /notify me/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i)
    expect(signUpForEarlyAccessAction).not.toHaveBeenCalled()
  })

  it('shows an inline error asking for a name and does not submit when the name is blank', async () => {
    render(<EarlyAccessSignupForm templateSlug="made-by-him" />)

    await userEvent.type(screen.getByLabelText('Email address'), 'jamie@example.com')
    await userEvent.click(screen.getByRole('button', { name: /notify me/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/name/i)
    expect(signUpForEarlyAccessAction).not.toHaveBeenCalled()
  })

  it('calls the signup action with the trimmed email, name, and template slug on valid submit', async () => {
    let resolveAction: (value: { success: true; alreadySignedUp: false }) => void = () => {}
    signUpForEarlyAccessAction.mockReturnValue(new Promise((resolve) => (resolveAction = resolve)))
    render(<EarlyAccessSignupForm templateSlug="made-by-him" />)

    await userEvent.type(screen.getByLabelText('Name'), 'Jamie')
    await userEvent.type(screen.getByLabelText('Email address'), ' jamie@example.com ')
    await userEvent.click(screen.getByRole('button', { name: /notify me/i }))

    expect(signUpForEarlyAccessAction).toHaveBeenCalledWith({
      name: 'Jamie',
      email: 'jamie@example.com',
      templateSlug: 'made-by-him',
    })
    expect(screen.getByRole('button', { name: /notify me/i })).toBeDisabled()

    resolveAction({ success: true, alreadySignedUp: false })
  })

  it('shows a success message and hides the form after a successful signup', async () => {
    signUpForEarlyAccessAction.mockResolvedValue({ success: true, alreadySignedUp: false })
    render(<EarlyAccessSignupForm templateSlug="made-by-him" />)

    await userEvent.type(screen.getByLabelText('Name'), 'Jamie')
    await userEvent.type(screen.getByLabelText('Email address'), 'jamie@example.com')
    await userEvent.click(screen.getByRole('button', { name: /notify me/i }))

    expect(await screen.findByText(/you.?re on the list/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument()
  })

  it('shows a friendly message when the signup is a duplicate', async () => {
    signUpForEarlyAccessAction.mockResolvedValue({ success: true, alreadySignedUp: true })
    render(<EarlyAccessSignupForm templateSlug="made-by-him" />)

    await userEvent.type(screen.getByLabelText('Name'), 'Jamie')
    await userEvent.type(screen.getByLabelText('Email address'), 'jamie@example.com')
    await userEvent.click(screen.getByRole('button', { name: /notify me/i }))

    expect(await screen.findByText(/already on the list/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument()
  })

  it('shows an inline error and keeps the form when the server call fails', async () => {
    signUpForEarlyAccessAction.mockResolvedValue({ success: false, error: 'Something went wrong. Please try again.' })
    render(<EarlyAccessSignupForm templateSlug="made-by-him" />)

    await userEvent.type(screen.getByLabelText('Name'), 'Jamie')
    await userEvent.type(screen.getByLabelText('Email address'), 'jamie@example.com')
    await userEvent.click(screen.getByRole('button', { name: /notify me/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.')
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
  })
})
