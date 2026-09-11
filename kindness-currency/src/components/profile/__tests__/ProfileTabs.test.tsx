import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileTabs } from '../ProfileTabs'
import type { CouponSetSummary, ReceivedCouponSetSummary } from '@/lib/couponSetRepository'

const resetPinAction = vi.fn()
vi.mock('@/app/profile/actions', () => ({
  resetPinAction: (setId: string) => resetPinAction(setId),
}))

const sentSets: CouponSetSummary[] = [
  {
    id: 'set-1',
    recipient_name: 'Mom',
    status: 'sent',
    created_at: '2026-08-20T00:00:00Z',
    templateName: "Mom's Promise Tokens",
    coupons: [
      { id: 'c1', status: 'redeemed' },
      { id: 'c2', status: 'sent' },
    ],
    openedAt: '2026-08-21T00:00:00Z',
  },
]

const receivedSets: ReceivedCouponSetSummary[] = [
  {
    id: 'set-2',
    sender_name: 'Jordan',
    status: 'sent',
    created_at: '2026-08-19T00:00:00Z',
    templateName: "Valentine's Love Passes",
    coupons: [{ id: 'c3', status: 'sent' }],
  },
]

describe('ProfileTabs', () => {
  beforeEach(() => {
    resetPinAction.mockReset()
  })

  it('shows the Sent list by default', () => {
    render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)

    expect(screen.getByText('Mom')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Sent' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('Jordan')).not.toBeInTheDocument()
  })

  it('switches to the Received list when that tab is clicked', async () => {
    render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Received' }))

    expect(screen.getByText('Jordan')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Received' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('Mom')).not.toBeInTheDocument()
  })

  it('shows template name and redemption progress on a received item', async () => {
    render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Received' }))

    expect(screen.getByText("Valentine's Love Passes")).toBeInTheDocument()
    expect(screen.getByText('0 of 1 redeemed')).toBeInTheDocument()
  })

  it('shows the received empty state when nothing has been received', async () => {
    render(<ProfileTabs sentSets={sentSets} receivedSets={[]} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Received' }))

    expect(screen.getByText("You haven't received any coupon sets yet.")).toBeInTheDocument()
  })

  it('shows the sent empty state when nothing has been sent', () => {
    render(<ProfileTabs sentSets={[]} receivedSets={receivedSets} />)

    expect(screen.getByText("You haven't sent any coupon sets yet.")).toBeInTheDocument()
  })

  it('shows a View PIN button on each sent set', () => {
    render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)

    expect(screen.getByRole('button', { name: 'View PIN' })).toBeInTheDocument()
  })

  it('does not show a View PIN button on received sets', async () => {
    render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Received' }))

    expect(screen.queryByRole('button', { name: 'View PIN' })).not.toBeInTheDocument()
  })

  describe('reset PIN', () => {
    it('opens a confirmation dialog naming the recipient when View PIN is clicked', async () => {
      render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)

      await userEvent.click(screen.getByRole('button', { name: 'View PIN' }))

      expect(screen.getByText('Generate a new PIN?')).toBeInTheDocument()
      expect(screen.getByText(/re-share the new one with Mom/)).toBeInTheDocument()
      expect(resetPinAction).not.toHaveBeenCalled()
    })

    it('closes without resetting when Cancel is clicked', async () => {
      render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)
      await userEvent.click(screen.getByRole('button', { name: 'View PIN' }))

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByText('Generate a new PIN?')).not.toBeInTheDocument()
      expect(resetPinAction).not.toHaveBeenCalled()
    })

    it('reveals the new PIN after confirming', async () => {
      resetPinAction.mockResolvedValue({ success: true, pin: '7392' })
      render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)
      await userEvent.click(screen.getByRole('button', { name: 'View PIN' }))

      await userEvent.click(screen.getByRole('button', { name: 'Generate New PIN' }))

      expect(await screen.findByText('7', { selector: 'span' })).toBeInTheDocument()
      expect(screen.getByText('3', { selector: 'span' })).toBeInTheDocument()
      expect(screen.getByText('9', { selector: 'span' })).toBeInTheDocument()
      expect(screen.getByText('2', { selector: 'span' })).toBeInTheDocument()
      expect(resetPinAction).toHaveBeenCalledWith('set-1')
    })

    it('shows an error and stays on the confirm step if the reset fails', async () => {
      resetPinAction.mockResolvedValue({ success: false, error: 'Something went wrong. Please try again.' })
      render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)
      await userEvent.click(screen.getByRole('button', { name: 'View PIN' }))

      await userEvent.click(screen.getByRole('button', { name: 'Generate New PIN' }))

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
      expect(screen.getByText('Generate a new PIN?')).toBeInTheDocument()
    })

    it('closes the modal from the revealed step via Done', async () => {
      resetPinAction.mockResolvedValue({ success: true, pin: '7392' })
      render(<ProfileTabs sentSets={sentSets} receivedSets={receivedSets} />)
      await userEvent.click(screen.getByRole('button', { name: 'View PIN' }))
      await userEvent.click(screen.getByRole('button', { name: 'Generate New PIN' }))
      await screen.findByText('Here’s the new PIN')

      await userEvent.click(screen.getByRole('button', { name: 'Done' }))

      expect(screen.queryByText('Here’s the new PIN')).not.toBeInTheDocument()
    })
  })

  describe('sent status badge', () => {
    const baseSet = (overrides: Partial<CouponSetSummary>): CouponSetSummary => ({
      id: 'set-1',
      recipient_name: 'Mom',
      status: 'sent',
      created_at: '2026-08-20T00:00:00Z',
      templateName: null,
      coupons: [{ id: 'c1', status: 'sent' }],
      openedAt: null,
      ...overrides,
    })

    it('shows "Sent" when opened_at is null and nothing is redeemed', () => {
      render(<ProfileTabs sentSets={[baseSet({ openedAt: null })]} receivedSets={[]} />)

      expect(within(screen.getByRole('tabpanel')).getByText('Sent')).toBeInTheDocument()
    })

    it('shows "Seen" once opened_at is set but nothing is redeemed yet', () => {
      render(<ProfileTabs sentSets={[baseSet({ openedAt: '2026-08-21T00:00:00Z' })]} receivedSets={[]} />)

      const panel = within(screen.getByRole('tabpanel'))
      expect(panel.getByText('Seen')).toBeInTheDocument()
      expect(panel.queryByText('Sent')).not.toBeInTheDocument()
    })

    it('shows "Redeemed" as soon as the first coupon in the set is redeemed', () => {
      render(
        <ProfileTabs
          sentSets={[
            baseSet({
              openedAt: '2026-08-21T00:00:00Z',
              coupons: [
                { id: 'c1', status: 'redeemed' },
                { id: 'c2', status: 'sent' },
                { id: 'c3', status: 'sent' },
              ],
            }),
          ]}
          receivedSets={[]}
        />
      )

      expect(screen.getByText('Redeemed')).toBeInTheDocument()
    })

    it('shows "Redeemed" even if opened_at was somehow never recorded', () => {
      render(
        <ProfileTabs
          sentSets={[baseSet({ openedAt: null, coupons: [{ id: 'c1', status: 'redeemed' }] })]}
          receivedSets={[]}
        />
      )

      expect(screen.getByText('Redeemed')).toBeInTheDocument()
    })
  })
})
