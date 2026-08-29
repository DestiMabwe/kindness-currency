import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReminderFrequencyPicker } from '../ReminderFrequencyPicker'

const setReminderFrequencyAction = vi.fn()
vi.mock('@/app/give/[id]/actions', () => ({
  setReminderFrequencyAction: (setId: string, frequency: unknown) => setReminderFrequencyAction(setId, frequency),
}))

const linkAction = vi.fn()

const baseProps = {
  setId: 'set-1',
  currentFrequency: null as null,
  isLoggedIn: true,
  alreadyLinked: true,
  linkAction,
  redirectTo: '/give/set-1',
}

beforeEach(() => {
  setReminderFrequencyAction.mockReset()
  setReminderFrequencyAction.mockResolvedValue({ success: true })
  linkAction.mockReset()
  linkAction.mockResolvedValue({ success: true })
})

describe('ReminderFrequencyPicker', () => {
  it('saves the chosen frequency and reports it back through onClose', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker {...baseProps} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Once a month' }))

    expect(setReminderFrequencyAction).toHaveBeenCalledWith('set-1', 'monthly')
    expect(onClose).toHaveBeenCalledWith('monthly')
  })

  it('saves null when "Don\'t remind me" is chosen', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker {...baseProps} currentFrequency="monthly" onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: "Don't remind me" }))

    expect(setReminderFrequencyAction).toHaveBeenCalledWith('set-1', null)
    expect(onClose).toHaveBeenCalledWith(null)
  })

  it('does not require an account to turn reminders off while logged out', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker {...baseProps} isLoggedIn={false} alreadyLinked={false} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: "Don't remind me" }))

    expect(setReminderFrequencyAction).toHaveBeenCalledWith('set-1', null)
    expect(linkAction).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledWith(null)
  })

  it('dismisses without saving when "Not now" is tapped', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker {...baseProps} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Not now' }))

    expect(setReminderFrequencyAction).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledWith()
  })

  it('prompts account-linking instead of saving when choosing a cadence while logged out', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker {...baseProps} isLoggedIn={false} alreadyLinked={false} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Once a month' }))

    expect(await screen.findByText('Almost there — save your coupons')).toBeInTheDocument()
    expect(setReminderFrequencyAction).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('silently links the account before saving when already logged in but not yet linked', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker {...baseProps} isLoggedIn={true} alreadyLinked={false} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Once a month' }))

    expect(linkAction).toHaveBeenCalledWith('set-1')
    expect(setReminderFrequencyAction).toHaveBeenCalledWith('set-1', 'monthly')
    expect(screen.queryByText('Almost there — save your coupons')).not.toBeInTheDocument()
  })
})
