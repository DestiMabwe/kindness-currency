import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReminderFrequencyPicker } from '../ReminderFrequencyPicker'

const setReminderFrequencyAction = vi.fn()
vi.mock('@/app/give/[id]/actions', () => ({
  setReminderFrequencyAction: (setId: string, frequency: unknown) => setReminderFrequencyAction(setId, frequency),
}))

beforeEach(() => {
  setReminderFrequencyAction.mockReset()
  setReminderFrequencyAction.mockResolvedValue({ success: true })
})

describe('ReminderFrequencyPicker', () => {
  it('saves the chosen frequency and reports it back through onClose', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker setId="set-1" currentFrequency={null} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Once a month' }))

    expect(setReminderFrequencyAction).toHaveBeenCalledWith('set-1', 'monthly')
    expect(onClose).toHaveBeenCalledWith('monthly')
  })

  it('saves null when "Don\'t remind me" is chosen', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker setId="set-1" currentFrequency="monthly" onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: "Don't remind me" }))

    expect(setReminderFrequencyAction).toHaveBeenCalledWith('set-1', null)
    expect(onClose).toHaveBeenCalledWith(null)
  })

  it('dismisses without saving when "Not now" is tapped', async () => {
    const onClose = vi.fn()
    render(<ReminderFrequencyPicker setId="set-1" currentFrequency={null} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Not now' }))

    expect(setReminderFrequencyAction).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledWith()
  })
})
