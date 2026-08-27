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
    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={vi.fn()}
      />)
    expect(screen.getByText('https://kindnesscurrency.app/give/abc123')).toBeInTheDocument()
  })

  it('displays the PIN as 4 separate digits', () => {
    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={vi.fn()}
      />)
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('copies the link with the personalized message (not the PIN) to the clipboard', async () => {
    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={vi.fn()}
      />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy Link' }))

    const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(copiedText).toContain('https://kindnesscurrency.app/give/abc123')
    expect(copiedText).toContain('Ally')
    expect(copiedText).toContain('Alex')
    expect(copiedText).not.toContain('4821')
  })

  it('shares the link with a personalized message via WhatsApp, never the PIN', async () => {
    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={vi.fn()}
      />)

    await userEvent.click(screen.getByRole('button', { name: /Share via WhatsApp/ }))

    const calledUrl = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    const sharedText = decodeURIComponent(calledUrl.replace('https://wa.me/?text=', ''))
    expect(sharedText).toContain('https://kindnesscurrency.app/give/abc123')
    expect(sharedText).toContain('Ally')
    expect(sharedText).toContain('Alex')
    expect(sharedText).not.toContain('4821')
    expect(window.open).toHaveBeenCalledWith(expect.any(String), '_blank', 'noopener,noreferrer')
  })

  it('shares the link with the same personalized message via the native share sheet, never the PIN', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share: shareSpy })

    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={vi.fn()}
      />)

    await userEvent.click(screen.getByRole('button', { name: 'Share…' }))

    expect(shareSpy).toHaveBeenCalledOnce()
    const sharedText = shareSpy.mock.calls[0][0].text as string
    expect(sharedText).toContain('https://kindnesscurrency.app/give/abc123')
    expect(sharedText).toContain('Ally')
    expect(sharedText).toContain('Alex')
    expect(sharedText).not.toContain('4821')
  })

  it('offers a way back to start a new coupon set', async () => {
    const onStartOver = vi.fn()
    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={onStartOver}
      />)

    await userEvent.click(screen.getByRole('button', { name: /Start a new coupon set/ }))

    expect(onStartOver).toHaveBeenCalledOnce()
  })

  it('shows the "spot another template" phrasing rather than "spot a typo"', () => {
    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={vi.fn()}
      />)

    expect(screen.getByText(/Spot another template\?/)).toBeInTheDocument()
  })

  it('links the logo home', () => {
    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={vi.fn()}
      />)

    expect(screen.getByRole('link', { name: 'Kindness Currency home' })).toHaveAttribute('href', '/')
  })

  it('shows an exit link back home', () => {
    render(
      <GiftReadyScreen
        shareLink="https://kindnesscurrency.app/give/abc123"
        pin="4821"
        senderName="Alex"
        recipientName="Ally"
        onStartOver={vi.fn()}
      />)

    expect(screen.getByRole('link', { name: 'Exit' })).toHaveAttribute('href', '/')
  })
})
