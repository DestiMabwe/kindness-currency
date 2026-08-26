import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeaderMenu } from '../HeaderMenu'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe('HeaderMenu', () => {
  it('links to Create, About Us, Profile, and Feedback', async () => {
    render(<HeaderMenu isLoggedIn={false} />)

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.getByRole('link', { name: 'Create Coupons' })).toHaveAttribute('href', '/create')
    expect(screen.queryByRole('link', { name: 'Templates' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('link', { name: 'Give Us Feedback' })).toHaveAttribute('href', '/feedback')
  })

  it('does not show an Admin link for a non-admin viewer', async () => {
    render(<HeaderMenu isLoggedIn={true} isAdmin={false} />)

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('shows an Admin link for an admin viewer', async () => {
    render(<HeaderMenu isLoggedIn={true} isAdmin={true} />)

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
  })

  it('shows Log In / Sign Up when logged out and Log Out when logged in', async () => {
    const { rerender } = render(<HeaderMenu isLoggedIn={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('button', { name: 'Log In / Sign Up' })).toBeInTheDocument()

    rerender(<HeaderMenu isLoggedIn={true} />)
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log In / Sign Up' })).not.toBeInTheDocument()
  })
})
