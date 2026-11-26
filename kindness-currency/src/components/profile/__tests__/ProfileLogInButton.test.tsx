import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfileLogInButton } from '../ProfileLogInButton'

describe('ProfileLogInButton', () => {
  it('links to the login page and comes back to the profile after signing in', () => {
    render(<ProfileLogInButton />)

    expect(screen.getByRole('link', { name: 'Log In / Sign Up' })).toHaveAttribute('href', '/login?mode=login&next=%2Fprofile')
  })
})
