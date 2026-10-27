import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { GiftUnwrapGate } from '../GiftUnwrapGate'

const baseProps = {
  senderName: 'Alex',
  accent: '#C2185B',
}

const MESSAGE = 'Thinking of you every day.'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GiftUnwrapGate', () => {
  it('lands straight on the coupon page, with no intro screen in front of it', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage={MESSAGE} hasVisitedBefore={false}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    expect(screen.getByText('The coupon page')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('unseals the message over the coupons 5 seconds into a first visit', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage={MESSAGE} hasVisitedBefore={false}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    act(() => vi.advanceTimersByTime(4900))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole('dialog', { name: 'A gift from Alex' })).toBeInTheDocument()
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
    expect(screen.getByText('The coupon page')).toBeInTheDocument()
  })

  it('closes the message back to the coupons', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage={MESSAGE} hasVisitedBefore={false}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    act(() => vi.advanceTimersByTime(5000))
    fireEvent.click(screen.getByRole('button', { name: 'Back to my coupons ♥' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('waits for another open dialog (e.g. PIN entry) to close before showing the message', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage={MESSAGE} hasVisitedBefore={false}>
        <div role="dialog" aria-modal="true" aria-label="Enter PIN">
          PIN modal
        </div>
      </GiftUnwrapGate>
    )

    act(() => vi.advanceTimersByTime(8000))
    expect(screen.queryByRole('dialog', { name: 'A gift from Alex' })).not.toBeInTheDocument()

    act(() => screen.getByText('PIN modal').removeAttribute('aria-modal'))
    act(() => vi.advanceTimersByTime(500))
    expect(screen.getByRole('dialog', { name: 'A gift from Alex' })).toBeInTheDocument()
  })

  it('never auto-shows the message on a repeat visit', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage={MESSAGE} hasVisitedBefore={true}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    act(() => vi.advanceTimersByTime(10000))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows no popup at all when there is no sender_message', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage={null} hasVisitedBefore={false}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    act(() => vi.advanceTimersByTime(10000))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
