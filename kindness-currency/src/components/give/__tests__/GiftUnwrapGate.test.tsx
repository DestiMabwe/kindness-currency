import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftUnwrapGate } from '../GiftUnwrapGate'

const baseProps = {
  setId: 'set-1',
  senderName: 'Alex',
  accent: '#C2185B',
  reminderFrequency: null,
  isLoggedIn: true,
  alreadyLinked: true,
  linkRecipientAction: async () => ({ success: true }),
  redirectTo: '/give/set-1',
}

describe('GiftUnwrapGate', () => {
  it('shows the message screen first when a sender_message exists and this is a first visit', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage="Thinking of you every day." hasVisitedBefore={false}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    expect(screen.getByText('A gift from Alex')).toBeInTheDocument()
    expect(screen.getByText(/Thinking of you every day\./)).toBeInTheDocument()
    expect(screen.queryByText('The coupon page')).not.toBeInTheDocument()
  })

  it('moves to the instructions screen once "Continue" is tapped', async () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage="Thinking of you every day." hasVisitedBefore={false}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByText('How Kindness Currency Works')).toBeInTheDocument()
    expect(screen.queryByText('A gift from Alex')).not.toBeInTheDocument()
  })

  it('reveals the coupon page once "Open Your Coupons" is tapped', async () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage="Thinking of you every day." hasVisitedBefore={false}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await userEvent.click(screen.getByRole('button', { name: 'Open Your Coupons' }))

    expect(screen.getByText('The coupon page')).toBeInTheDocument()
    expect(screen.queryByText('How Kindness Currency Works')).not.toBeInTheDocument()
  })

  it('skips straight to the instructions screen when there is no sender_message', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage={null} hasVisitedBefore={false}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    expect(screen.getByText('How Kindness Currency Works')).toBeInTheDocument()
    expect(screen.queryByText('A gift from Alex')).not.toBeInTheDocument()
  })

  it('skips the whole intro on a repeat visit, going straight to the coupon page', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage="Thinking of you every day." hasVisitedBefore={true}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    expect(screen.getByText('The coupon page')).toBeInTheDocument()
    expect(screen.queryByText('A gift from Alex')).not.toBeInTheDocument()
    expect(screen.queryByText('How Kindness Currency Works')).not.toBeInTheDocument()
  })

  it('renders the floating envelope icon once revealed, so the message stays reachable', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage="Thinking of you every day." hasVisitedBefore={true}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    expect(screen.getByRole('button', { name: 'Read the message again' })).toBeInTheDocument()
  })

  it('hides the envelope icon once revealed when there was never a message', () => {
    render(
      <GiftUnwrapGate {...baseProps} senderMessage={null} hasVisitedBefore={true}>
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    expect(screen.queryByRole('button', { name: 'Read the message again' })).not.toBeInTheDocument()
  })
})
