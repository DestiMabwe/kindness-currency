import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileTabs } from '../ProfileTabs'
import type { CouponSetSummary, ReceivedCouponSetSummary } from '@/lib/couponSetRepository'

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
