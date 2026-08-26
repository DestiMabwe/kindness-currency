import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveToAccountBanner } from '../SaveToAccountBanner'

const linkRecipientAction = vi.fn()
vi.mock('@/app/give/[id]/actions', () => ({
  linkRecipientAction: (setId: string) => linkRecipientAction(setId),
}))

beforeEach(() => {
  linkRecipientAction.mockReset()
  window.localStorage.clear()
})

describe('SaveToAccountBanner', () => {
  it('does not render when the set is already linked', () => {
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={true} alreadyLinked={true} />)

    expect(screen.queryByText('Add this to your account')).not.toBeInTheDocument()
  })

  it('shows "Save this to your account" when logged out', () => {
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={false} alreadyLinked={false} />)

    expect(screen.getByText('Save this to your account')).toBeInTheDocument()
  })

  it('shows "Add this to your account" when logged in but unlinked', () => {
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={true} alreadyLinked={false} />)

    expect(screen.getByText('Add this to your account')).toBeInTheDocument()
  })

  it('opens AuthGate and marks a pending link when clicked while logged out', async () => {
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={false} alreadyLinked={false} />)

    await userEvent.click(screen.getByText('Save this to your account'))

    expect(await screen.findByText('Almost there — save your coupons')).toBeInTheDocument()
    expect(window.localStorage.getItem('kindness-currency:pending-link:set-1')).toBe('true')
    expect(linkRecipientAction).not.toHaveBeenCalled()
  })

  it('links immediately with no auth step when clicked while logged in', async () => {
    linkRecipientAction.mockResolvedValue({ success: true })
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={true} alreadyLinked={false} />)

    await userEvent.click(screen.getByText('Add this to your account'))

    expect(linkRecipientAction).toHaveBeenCalledWith('set-1')
    expect(screen.queryByText('Almost there — save your coupons')).not.toBeInTheDocument()
  })

  it('hides the banner once linking succeeds', async () => {
    linkRecipientAction.mockResolvedValue({ success: true })
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={true} alreadyLinked={false} />)

    await userEvent.click(screen.getByText('Add this to your account'))

    await waitFor(() => expect(screen.queryByText('Add this to your account')).not.toBeInTheDocument())
  })

  it('auto-completes the link on mount if a pending-link flag was set before an auth redirect', async () => {
    window.localStorage.setItem('kindness-currency:pending-link:set-1', 'true')
    linkRecipientAction.mockResolvedValue({ success: true })

    render(<SaveToAccountBanner setId="set-1" isLoggedIn={true} alreadyLinked={false} />)

    expect(linkRecipientAction).toHaveBeenCalledWith('set-1')
    expect(window.localStorage.getItem('kindness-currency:pending-link:set-1')).toBeNull()
  })

  it('does not auto-link on mount without a pending-link flag, even when logged in and unlinked', () => {
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={true} alreadyLinked={false} />)

    expect(linkRecipientAction).not.toHaveBeenCalled()
  })

  it('dismissing hides the banner and persists across remounts of the same set', () => {
    const { unmount } = render(<SaveToAccountBanner setId="set-1" isLoggedIn={false} alreadyLinked={false} />)
    unmount()

    window.localStorage.setItem('kindness-currency:save-banner-dismissed:set-1', 'true')
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={false} alreadyLinked={false} />)

    expect(screen.queryByText('Save this to your account')).not.toBeInTheDocument()
  })

  it('dismiss button writes to localStorage and hides the banner', async () => {
    render(<SaveToAccountBanner setId="set-1" isLoggedIn={false} alreadyLinked={false} />)

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(window.localStorage.getItem('kindness-currency:save-banner-dismissed:set-1')).toBe('true')
    expect(screen.queryByText('Save this to your account')).not.toBeInTheDocument()
  })
})
