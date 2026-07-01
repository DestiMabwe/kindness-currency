import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftReadyScreen } from '../GiftReadyScreen'

describe('GiftReadyScreen', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('displays the shareable link', () => {
    render(<GiftReadyScreen shareLink="https://kindnesscurrency.app/give/abc123" pin="4821" />)
    expect(screen.getByText('https://kindnesscurrency.app/give/abc123')).toBeInTheDocument()
  })

  it('displays the PIN as 4 separate digits', () => {
    render(<GiftReadyScreen shareLink="https://kindnesscurrency.app/give/abc123" pin="4821" />)
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('copies the link (not the PIN) to the clipboard', async () => {
    render(<GiftReadyScreen shareLink="https://kindnesscurrency.app/give/abc123" pin="4821" />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy Link' }))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://kindnesscurrency.app/give/abc123')
    expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith(expect.stringContaining('4821'))
  })

  it('shares only the link via WhatsApp, never the PIN', async () => {
    render(<GiftReadyScreen shareLink="https://kindnesscurrency.app/give/abc123" pin="4821" />)

    await userEvent.click(screen.getByRole('button', { name: /Share via WhatsApp/ }))

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('https://kindnesscurrency.app/give/abc123')),
      '_blank',
      'noopener,noreferrer'
    )
    const calledUrl = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).not.toContain('4821')
  })
})
