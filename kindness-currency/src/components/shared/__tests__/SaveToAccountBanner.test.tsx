import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveToAccountBanner } from '../SaveToAccountBanner'

const routerPush = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: routerPush }) }))

const linkAction = vi.fn()

beforeEach(() => {
  routerPush.mockReset()
  linkAction.mockReset()
  window.localStorage.clear()
})

const renderBanner = (overrides: Partial<React.ComponentProps<typeof SaveToAccountBanner>> = {}) =>
  render(
    <SaveToAccountBanner
      setId="set-1"
      isLoggedIn={false}
      alreadyLinked={false}
      linkAction={linkAction}
      redirectTo="/give/set-1"
      storageScope="recipient"
      {...overrides}
    />
  )

describe('SaveToAccountBanner', () => {
  it('does not render when the set is already linked', () => {
    renderBanner({ isLoggedIn: true, alreadyLinked: true })

    expect(screen.queryByText('Add this to your account')).not.toBeInTheDocument()
  })

  it('shows "Save this to your account" when logged out', () => {
    renderBanner({ isLoggedIn: false })

    expect(screen.getByText('Save this to your account')).toBeInTheDocument()
  })

  it('shows "Add this to your account" when logged in but unlinked', () => {
    renderBanner({ isLoggedIn: true })

    expect(screen.getByText('Add this to your account')).toBeInTheDocument()
  })

  it('sends a logged-out visitor to log in, marking a pending link, when clicked', async () => {
    renderBanner({ isLoggedIn: false })

    await userEvent.click(screen.getByText('Save this to your account'))

    expect(routerPush).toHaveBeenCalledWith('/login?next=%2Fgive%2Fset-1')
    expect(window.localStorage.getItem('kindness-currency:pending-link:recipient:set-1')).toBe('true')
    expect(linkAction).not.toHaveBeenCalled()
  })

  it('links immediately with no auth step when clicked while logged in', async () => {
    linkAction.mockResolvedValue({ success: true })
    renderBanner({ isLoggedIn: true })

    await userEvent.click(screen.getByText('Add this to your account'))

    expect(linkAction).toHaveBeenCalledWith('set-1')
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('hides the banner once linking succeeds', async () => {
    linkAction.mockResolvedValue({ success: true })
    renderBanner({ isLoggedIn: true })

    await userEvent.click(screen.getByText('Add this to your account'))

    await waitFor(() => expect(screen.queryByText('Add this to your account')).not.toBeInTheDocument())
  })

  it('auto-completes the link on mount if a pending-link flag was set before an auth redirect', async () => {
    window.localStorage.setItem('kindness-currency:pending-link:recipient:set-1', 'true')
    linkAction.mockResolvedValue({ success: true })

    renderBanner({ isLoggedIn: true })

    expect(linkAction).toHaveBeenCalledWith('set-1')
    expect(window.localStorage.getItem('kindness-currency:pending-link:recipient:set-1')).toBeNull()
  })

  it('completes a pending link in place when the visitor logs in without the page reloading', async () => {
    window.localStorage.setItem('kindness-currency:pending-link:recipient:set-1', 'true')
    linkAction.mockResolvedValue({ success: true })
    const props = { setId: 'set-1', alreadyLinked: false, linkAction, redirectTo: '/give/set-1', storageScope: 'recipient' as const }
    const { rerender } = render(<SaveToAccountBanner {...props} isLoggedIn={false} />)
    expect(linkAction).not.toHaveBeenCalled()

    rerender(<SaveToAccountBanner {...props} isLoggedIn={true} />)

    await waitFor(() => expect(linkAction).toHaveBeenCalledWith('set-1'))
    expect(window.localStorage.getItem('kindness-currency:pending-link:recipient:set-1')).toBeNull()
  })

  it('does not auto-link on mount without a pending-link flag, even when logged in and unlinked', () => {
    renderBanner({ isLoggedIn: true })

    expect(linkAction).not.toHaveBeenCalled()
  })

  it('dismissing hides the banner and persists across remounts of the same set', () => {
    const { unmount } = renderBanner({ isLoggedIn: false })
    unmount()

    window.localStorage.setItem('kindness-currency:save-banner-dismissed:recipient:set-1', 'true')
    renderBanner({ isLoggedIn: false })

    expect(screen.queryByText('Save this to your account')).not.toBeInTheDocument()
  })

  it('dismiss button writes to localStorage and hides the banner', async () => {
    renderBanner({ isLoggedIn: false })

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(window.localStorage.getItem('kindness-currency:save-banner-dismissed:recipient:set-1')).toBe('true')
    expect(screen.queryByText('Save this to your account')).not.toBeInTheDocument()
  })

  it('keeps pending-link state separate per storageScope, so two banners on the same setId do not collide', async () => {
    window.localStorage.setItem('kindness-currency:pending-link:sender:set-1', 'true')
    linkAction.mockResolvedValue({ success: true })

    renderBanner({ isLoggedIn: true, storageScope: 'recipient' })

    expect(linkAction).not.toHaveBeenCalled()
  })
})
