import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftFloatingActions } from '../GiftFloatingActions'

const setReminderFrequencyAction = vi.fn()
vi.mock('@/app/give/[id]/actions', () => ({
  setReminderFrequencyAction: (setId: string, frequency: unknown) => setReminderFrequencyAction(setId, frequency),
}))

beforeEach(() => {
  setReminderFrequencyAction.mockReset()
  setReminderFrequencyAction.mockResolvedValue({ success: true })
})

describe('GiftFloatingActions', () => {
  it('shows the envelope icon when there is a message to re-read', () => {
    render(
      <GiftFloatingActions setId="set-1" senderName="Alex" senderMessage="Thinking of you." initialReminderFrequency={null} />
    )

    expect(screen.getByRole('button', { name: 'Read the message again' })).toBeInTheDocument()
  })

  it('hides the envelope icon when there is no message', () => {
    render(<GiftFloatingActions setId="set-1" senderName="Alex" senderMessage={null} initialReminderFrequency={null} />)

    expect(screen.queryByRole('button', { name: 'Read the message again' })).not.toBeInTheDocument()
  })

  it('opens the message replay modal on envelope tap', async () => {
    render(
      <GiftFloatingActions setId="set-1" senderName="Alex" senderMessage="Thinking of you." initialReminderFrequency={null} />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Read the message again' }))

    expect(screen.getByText(/Thinking of you\./)).toBeInTheDocument()
  })

  it('always shows the reminder bell, even when reminders were declined', () => {
    render(<GiftFloatingActions setId="set-1" senderName="Alex" senderMessage={null} initialReminderFrequency={null} />)

    expect(screen.getByRole('button', { name: 'Reminders' })).toBeInTheDocument()
  })

  it('opens the reminder picker on bell tap', async () => {
    render(<GiftFloatingActions setId="set-1" senderName="Alex" senderMessage={null} initialReminderFrequency={null} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reminders' }))

    expect(screen.getByText('Want a nudge to redeem these?')).toBeInTheDocument()
  })
})
