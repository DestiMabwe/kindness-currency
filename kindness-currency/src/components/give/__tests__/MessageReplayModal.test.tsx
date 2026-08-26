import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageReplayModal } from '../MessageReplayModal'

describe('MessageReplayModal', () => {
  it('shows the sender name and message', () => {
    render(<MessageReplayModal senderName="Alex" senderMessage="Thinking of you every day." onClose={vi.fn()} />)

    expect(screen.getByText('A gift from Alex')).toBeInTheDocument()
    expect(screen.getByText(/Thinking of you every day\./)).toBeInTheDocument()
  })

  it('fires onClose when Close is tapped', async () => {
    const onClose = vi.fn()
    render(<MessageReplayModal senderName="Alex" senderMessage="Thinking of you every day." onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalled()
  })
})
