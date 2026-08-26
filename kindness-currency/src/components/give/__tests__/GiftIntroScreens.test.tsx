import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftMessageScreen, GiftInstructionsScreen } from '../GiftIntroScreens'

describe('GiftMessageScreen', () => {
  it('shows the sender name and message', () => {
    render(<GiftMessageScreen senderName="Alex" senderMessage="Thinking of you." accent="#C2185B" onContinue={vi.fn()} />)

    expect(screen.getByText('A gift from Alex')).toBeInTheDocument()
    expect(screen.getByText(/Thinking of you\./)).toBeInTheDocument()
  })

  it('fires onContinue when tapped', async () => {
    const onContinue = vi.fn()
    render(<GiftMessageScreen senderName="Alex" senderMessage="Thinking of you." accent="#C2185B" onContinue={onContinue} />)

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('has no close button when onClose is not provided (the real recipient flow)', () => {
    render(<GiftMessageScreen senderName="Alex" senderMessage="Thinking of you." accent="#C2185B" onContinue={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Close preview' })).not.toBeInTheDocument()
  })

  it('shows a close button that fires onClose when provided (the preview flow)', async () => {
    const onClose = vi.fn()
    render(
      <GiftMessageScreen senderName="Alex" senderMessage="Thinking of you." accent="#C2185B" onContinue={vi.fn()} onClose={onClose} />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('GiftInstructionsScreen', () => {
  it('shows the how-it-works heading and mentions the sender by name', () => {
    render(<GiftInstructionsScreen senderName="Alex" accent="#C2185B" onContinue={vi.fn()} />)

    expect(screen.getByText('How Kindness Currency Works')).toBeInTheDocument()
    expect(screen.getByText(/PIN Alex shared with you/)).toBeInTheDocument()
  })

  it('fires onContinue when tapped', async () => {
    const onContinue = vi.fn()
    render(<GiftInstructionsScreen senderName="Alex" accent="#C2185B" onContinue={onContinue} />)

    await userEvent.click(screen.getByRole('button', { name: 'Open Your Coupons' }))

    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('has no close button when onClose is not provided', () => {
    render(<GiftInstructionsScreen senderName="Alex" accent="#C2185B" onContinue={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Close preview' })).not.toBeInTheDocument()
  })

  it('shows a close button that fires onClose when provided', async () => {
    const onClose = vi.fn()
    render(<GiftInstructionsScreen senderName="Alex" accent="#C2185B" onContinue={vi.fn()} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
