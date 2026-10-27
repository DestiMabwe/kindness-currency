import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftReminderRow } from '../GiftReminderRow'
import { pendingReminderKey } from '../ReminderFrequencyPicker'

const setReminderFrequencyAction = vi.fn()
vi.mock('@/app/give/[id]/actions', () => ({
  setReminderFrequencyAction: (setId: string, frequency: unknown) => setReminderFrequencyAction(setId, frequency),
}))

const linkRecipientAction = vi.fn()

const baseProps = {
  setId: 'set-1',
  couponCount: 3,
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

describe('GiftReminderRow', () => {
  it('invites the recipient to set a reminder for a bundle', () => {
    render(<GiftReminderRow {...baseProps} />)

    expect(screen.getByRole('button', { name: /Want a nudge to use these\?.*Set a reminder/ })).toBeInTheDocument()
  })

  it('speaks of a single coupon as "it"', () => {
    render(<GiftReminderRow {...baseProps} couponCount={1} />)

    expect(screen.getByRole('button', { name: /Want a nudge to use it\?.*Set a reminder/ })).toBeInTheDocument()
  })

  it('opens the reminder picker when tapped, worded for the bundle', async () => {
    render(<GiftReminderRow {...baseProps} />)

    await userEvent.click(screen.getByRole('button', { name: /Set a reminder/ }))

    expect(screen.getByRole('dialog', { name: 'Want a nudge to redeem these?' })).toBeInTheDocument()
  })

  it('words the picker for a single coupon', async () => {
    render(<GiftReminderRow {...baseProps} couponCount={1} />)

    await userEvent.click(screen.getByRole('button', { name: /Set a reminder/ }))

    expect(screen.getByRole('dialog', { name: 'Want a nudge to redeem it?' })).toBeInTheDocument()
  })

  it('shows the reminder already set, with a way to change it', () => {
    render(<GiftReminderRow {...baseProps} initialReminderFrequency="monthly" />)

    expect(screen.getByRole('button', { name: /Reminding you once a month.*Change/ })).toBeInTheDocument()
    expect(screen.queryByText('Set a reminder')).not.toBeInTheDocument()
  })

  it('reflects a new choice made in the picker', async () => {
    render(<GiftReminderRow {...baseProps} />)

    await userEvent.click(screen.getByRole('button', { name: /Set a reminder/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Every 2 weeks' }))

    expect(await screen.findByRole('button', { name: /Reminding you every 2 weeks.*Change/ })).toBeInTheDocument()
  })

  it('goes back to inviting a reminder once reminders are turned off', async () => {
    render(<GiftReminderRow {...baseProps} initialReminderFrequency="monthly" />)

    await userEvent.click(screen.getByRole('button', { name: /Change/ }))
    await userEvent.click(screen.getByRole('button', { name: "Don't remind me" }))

    expect(await screen.findByRole('button', { name: /Want a nudge to use these\?.*Set a reminder/ })).toBeInTheDocument()
  })

  it('completes a reminder choice made before logging in, once the recipient returns logged in', async () => {
    window.localStorage.setItem(pendingReminderKey('set-1'), 'monthly')

    render(<GiftReminderRow {...baseProps} alreadyLinked={false} />)

    await vi.waitFor(() => {
      expect(linkRecipientAction).toHaveBeenCalledWith('set-1')
      expect(setReminderFrequencyAction).toHaveBeenCalledWith('set-1', 'monthly')
    })
    expect(await screen.findByRole('button', { name: /Reminding you once a month/ })).toBeInTheDocument()
    expect(window.localStorage.getItem(pendingReminderKey('set-1'))).toBeNull()
  })

  it('leaves a pending reminder choice alone while still logged out', () => {
    window.localStorage.setItem(pendingReminderKey('set-1'), 'monthly')

    render(<GiftReminderRow {...baseProps} isLoggedIn={false} alreadyLinked={false} />)

    expect(linkRecipientAction).not.toHaveBeenCalled()
    expect(setReminderFrequencyAction).not.toHaveBeenCalled()
  })
})
