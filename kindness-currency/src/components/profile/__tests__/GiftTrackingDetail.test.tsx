import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GiftTrackingDetail } from '../GiftTrackingDetail'
import type { GiftTrackingDetail as GiftTrackingDetailData } from '@/lib/couponSetRepository'

const redeemCouponAction = vi.fn()
vi.mock('@/app/profile/actions', () => ({
  redeemCouponAction: (input: { couponId: string; pin: string }) => redeemCouponAction(input),
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
    redeemCouponAction.mockReset()
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

  it('no longer offers a way to view or reset a PIN — the sender never holds one', () => {
    render(<GiftTrackingDetail detail={baseDetail()} />)

    expect(screen.queryByRole('button', { name: 'View PIN' })).not.toBeInTheDocument()
  })

  it('offers "Enter their PIN" only on coupons that are not redeemed yet', () => {
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

    expect(screen.getAllByRole('button', { name: 'Enter their PIN' })).toHaveLength(1)
  })

  it('confirms a PIN for that specific coupon and marks it redeemed on success', async () => {
    redeemCouponAction.mockResolvedValue({
      success: true,
      coupon: { id: 'c2', status: 'redeemed', redeemedAt: '2026-08-23T00:00:00Z' },
    })
    render(<GiftTrackingDetail detail={baseDetail()} />)

    await userEvent.click(screen.getAllByRole('button', { name: 'Enter their PIN' })[1])
    await userEvent.type(screen.getByLabelText('4-digit PIN'), '4821')
    await userEvent.click(screen.getByRole('button', { name: 'Yes, redeem with love ♥' }))

    expect(redeemCouponAction).toHaveBeenCalledWith({ couponId: 'c2', pin: '4821' })
    expect(await screen.findByText('1 of 2 coupons redeemed so far.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Enter their PIN' })).toHaveLength(1)
  })

  it('keeps the coupon pending and shows the soft error on a wrong PIN', async () => {
    redeemCouponAction.mockResolvedValue({ success: false, error: 'nope' })
    render(<GiftTrackingDetail detail={baseDetail()} />)

    await userEvent.click(screen.getAllByRole('button', { name: 'Enter their PIN' })[0])
    await userEvent.type(screen.getByLabelText('4-digit PIN'), '0000')
    await userEvent.click(screen.getByRole('button', { name: 'Yes, redeem with love ♥' }))

    expect(await screen.findByText("That PIN doesn't match or has expired. Ask Mom to generate a new one.")).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Enter their PIN' })).toHaveLength(2)
  })
})
