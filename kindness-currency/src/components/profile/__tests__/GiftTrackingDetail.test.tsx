import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftTrackingDetail } from '../GiftTrackingDetail'
import type { GiftTrackingDetail as GiftTrackingDetailData } from '@/lib/couponSetRepository'

const resetPinAction = vi.fn()
vi.mock('@/app/profile/actions', () => ({
  resetPinAction: (setId: string) => resetPinAction(setId),
}))

const baseDetail = (overrides: Partial<GiftTrackingDetailData> = {}): GiftTrackingDetailData => ({
  id: 'set-1',
  recipient_name: 'Mom',
  status: 'sent',
  created_at: '2026-08-20T00:00:00Z',
  openedAt: null,
  templateName: "Mom's Promise Tokens",
  templateSlug: 'mothers_day',
  coupons: [
    { id: 'c1', service_title: 'Cook Dinner', status: 'sent', redeemed_at: null },
    { id: 'c2', service_title: 'Do The Dishes', status: 'sent', redeemed_at: null },
  ],
  ...overrides,
})

describe('GiftTrackingDetail', () => {
  beforeEach(() => {
    resetPinAction.mockReset()
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('shows the "on its way" headline when nothing has been opened yet', () => {
    render(<GiftTrackingDetail detail={baseDetail()} />)

    expect(screen.getByText('Your gift is on its way to Mom.')).toBeInTheDocument()
  })

  it('shows the "seen" headline once opened but nothing is redeemed', () => {
    render(<GiftTrackingDetail detail={baseDetail({ openedAt: '2026-08-21T00:00:00Z' })} />)

    expect(screen.getByText('Mom has seen your gift.')).toBeInTheDocument()
  })

  it('shows the "redeemed" headline and progress count once at least one coupon is used', () => {
    render(
      <GiftTrackingDetail
        detail={baseDetail({
          openedAt: '2026-08-21T00:00:00Z',
          coupons: [
            { id: 'c1', service_title: 'Cook Dinner', status: 'redeemed', redeemed_at: '2026-08-22T00:00:00Z' },
            { id: 'c2', service_title: 'Do The Dishes', status: 'sent', redeemed_at: null },
          ],
        })}
      />
    )

    expect(screen.getByText('Mom is putting your gift to good use.')).toBeInTheDocument()
    expect(screen.getByText('1 of 2 coupons redeemed so far.')).toBeInTheDocument()
  })

  it('lists every coupon by its title with its own redemption status', () => {
    render(
      <GiftTrackingDetail
        detail={baseDetail({
          coupons: [
            { id: 'c1', service_title: 'Cook Dinner', status: 'redeemed', redeemed_at: '2026-08-22T00:00:00Z' },
            { id: 'c2', service_title: 'Do The Dishes', status: 'sent', redeemed_at: null },
          ],
        })}
      />
    )

    expect(screen.getByText('Cook Dinner')).toBeInTheDocument()
    expect(screen.getByText('Do The Dishes')).toBeInTheDocument()
    expect(screen.getByText('Redeemed')).toBeInTheDocument()
    expect(screen.getByText('Not yet redeemed')).toBeInTheDocument()
  })

  it('copies the /give link for this set to the clipboard', async () => {
    render(<GiftTrackingDetail detail={baseDetail()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Copy Link' }))

    const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(copiedText).toContain('/give/set-1')
    expect(await screen.findByRole('button', { name: 'Link Copied ✓' })).toBeInTheDocument()
  })

  it('shows the gift-sent milestone as done with a date, and later milestones as pending', () => {
    render(<GiftTrackingDetail detail={baseDetail()} />)

    expect(screen.getByText('Gift sent')).toBeInTheDocument()
    expect(screen.getByText('Aug 20, 2026')).toBeInTheDocument()
    expect(screen.getByText('Not yet opened')).toBeInTheDocument()
  })

  it('marks the "seen" milestone done with a date once opened', () => {
    render(<GiftTrackingDetail detail={baseDetail({ openedAt: '2026-08-21T00:00:00Z' })} />)

    expect(screen.getByText('Seen by recipient')).toBeInTheDocument()
    expect(screen.getByText('Aug 21, 2026')).toBeInTheDocument()
  })

  it('links back to the gifts list', () => {
    render(<GiftTrackingDetail detail={baseDetail()} />)

    expect(screen.getByRole('link', { name: 'Back to Your Gifts' })).toHaveAttribute('href', '/profile')
  })

  it('opens the reset-PIN flow for this specific set from View PIN', async () => {
    resetPinAction.mockResolvedValue({ success: true, pin: '7392' })
    render(<GiftTrackingDetail detail={baseDetail()} />)

    await userEvent.click(screen.getByRole('button', { name: 'View PIN' }))
    expect(screen.getByText('Generate a new PIN?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Generate New PIN' }))

    expect(resetPinAction).toHaveBeenCalledWith('set-1')
  })
})
