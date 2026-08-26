import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftUnwrapGate } from '../GiftUnwrapGate'

describe('GiftUnwrapGate', () => {
  it('shows the message screen first when a sender_message exists', () => {
    render(
      <GiftUnwrapGate senderName="Alex" senderMessage="Thinking of you every day." accent="#C2185B">
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    expect(screen.getByText('A gift from Alex')).toBeInTheDocument()
    expect(screen.getByText(/Thinking of you every day\./)).toBeInTheDocument()
    expect(screen.queryByText('The coupon page')).not.toBeInTheDocument()
  })

  it('reveals the coupon page once "Open Your Coupons" is tapped', async () => {
    render(
      <GiftUnwrapGate senderName="Alex" senderMessage="Thinking of you every day." accent="#C2185B">
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Open Your Coupons' }))

    expect(screen.getByText('The coupon page')).toBeInTheDocument()
    expect(screen.queryByText('A gift from Alex')).not.toBeInTheDocument()
  })

  it('skips straight to the coupon page when there is no sender_message', () => {
    render(
      <GiftUnwrapGate senderName="Alex" senderMessage={null} accent="#C2185B">
        <div>The coupon page</div>
      </GiftUnwrapGate>
    )

    expect(screen.getByText('The coupon page')).toBeInTheDocument()
    expect(screen.queryByText('A gift from Alex')).not.toBeInTheDocument()
  })
})
