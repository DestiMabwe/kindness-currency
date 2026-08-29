import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftFloatingActions } from '../GiftFloatingActions'
import { pendingReminderKey } from '../ReminderFrequencyPicker'

const setReminderFrequencyAction = vi.fn()
vi.mock('@/app/give/[id]/actions', () => ({
  setReminderFrequencyAction: (setId: string, frequency: unknown) => setReminderFrequencyAction(setId, frequency),
}))

const linkRecipientAction = vi.fn()

const baseProps = {
  setId: 'set-1',
  senderName: 'Alex',
  senderMessage: null as string | null,
  initialReminderFrequency: null,
  isLoggedIn: true,
  alreadyLinked: true,
  linkRecipientAction,
  redirectTo: '/give/set-1',
}

beforeEach(() => {
  setReminderFrequencyAction.mockReset()
  setReminderFrequencyAction.mockResolvedValue({ success: true })
  linkRecipientAction.mockReset()
  linkRecipientAction.mockResolvedValue({ success: true })
  window.localStorage.clear()
})

describe('GiftFloatingActions', () => {
  it('shows the envelope icon when there is a message to re-read', () => {
    render(<GiftFloatingActions {...baseProps} senderMessage="Thinking of you." />)

    expect(screen.getByRole('button', { name: 'Read the message again' })).toBeInTheDocument()
  })

  it('hides the envelope icon when there is no message', () => {
    render(<GiftFloatingActions {...baseProps} />)

    expect(screen.queryByRole('button', { name: 'Read the message again' })).not.toBeInTheDocument()
  })

  it('opens the message replay modal on envelope tap', async () => {
    render(<GiftFloatingActions {...baseProps} senderMessage="Thinking of you." />)

    await userEvent.click(screen.getByRole('button', { name: 'Read the message again' }))

    expect(screen.getByText(/Thinking of you\./)).toBeInTheDocument()
  })

  it('always shows the reminder bell, even when reminders were declined', () => {
    render(<GiftFloatingActions {...baseProps} />)

    expect(screen.getByRole('button', { name: 'Reminders' })).toBeInTheDocument()
  })

  it('opens the reminder picker on bell tap', async () => {
    render(<GiftFloatingActions {...baseProps} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reminders' }))

    expect(screen.getByText('Want a nudge to redeem these?')).toBeInTheDocument()
  })

  it('completes a pending reminder choice on mount after the recipient logs in and returns', async () => {
    window.localStorage.setItem(pendingReminderKey('set-1'), 'monthly')

    render(<GiftFloatingActions {...baseProps} alreadyLinked={false} />)

    await vi.waitFor(() => {
      expect(linkRecipientAction).toHaveBeenCalledWith('set-1')
      expect(setReminderFrequencyAction).toHaveBeenCalledWith('set-1', 'monthly')
    })
    expect(window.localStorage.getItem(pendingReminderKey('set-1'))).toBeNull()
  })

  it('does not complete a pending reminder choice while still logged out', () => {
    window.localStorage.setItem(pendingReminderKey('set-1'), 'monthly')

    render(<GiftFloatingActions {...baseProps} isLoggedIn={false} alreadyLinked={false} />)

    expect(linkRecipientAction).not.toHaveBeenCalled()
    expect(setReminderFrequencyAction).not.toHaveBeenCalled()
  })
})
