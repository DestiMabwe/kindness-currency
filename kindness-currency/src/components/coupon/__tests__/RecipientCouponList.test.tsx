import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecipientCouponList } from '../RecipientCouponList'
import type { GiveCoupon } from '@/lib/giveRepository'

vi.mock('@/app/give/[id]/actions', () => ({
  generatePinAction: vi.fn(),
  getCouponStatusAction: vi.fn(),
}))

// The real modal polls the server; here it only needs a way to say "the sender confirmed".
vi.mock('@/components/modals/RecipientPinModal', () => ({
  RecipientPinModal: ({ couponTitle, onRedeemed }: { couponTitle: string; onRedeemed: () => void }) => (
    <div role="dialog" aria-label={`PIN for ${couponTitle}`}>
      <button type="button" onClick={onRedeemed}>
        Sender confirmed
      </button>
    </div>
  ),
}))

function coupon(n: number, status: GiveCoupon['status'] = 'sent'): GiveCoupon {
  return {
    id: `c${n}`,
    sort_order: n,
    service_title: `Coupon title ${n}`,
    micro_copy: null,
    fine_print: null,
    font_choice: 'playfair',
    background_color: null,
    background_effect: 'none',
    status,
  }
}

function renderList(coupons: GiveCoupon[]) {
  render(
    <RecipientCouponList initialCoupons={coupons} senderName="Sam" accent="#C2185B" motif="♥" imageSrc={null} expiresAt={null} />
  )
}

describe('RecipientCouponList', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
  })

  it('presents the coupons as pages of a book rather than one long list', () => {
    renderList([coupon(1), coupon(2), coupon(3)])
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3'])
  })

  it('opens on the first coupon that has not been used, with used ones at the back', () => {
    renderList([coupon(1, 'redeemed'), coupon(2), coupon(3)])
    const pages = screen.getAllByRole('group')
    expect(within(pages[0]).getByText('Coupon title 2')).toBeInTheDocument()
    expect(within(pages[2]).getByText('Coupon title 1')).toBeInTheDocument()
  })

  it('starts the PIN flow for the coupon on the page that was tapped', async () => {
    renderList([coupon(1), coupon(2)])
    const second = screen.getAllByRole('group')[1]

    await userEvent.click(within(second).getByRole('button', { name: /redeem/i }))

    expect(screen.getByRole('dialog')).toHaveAccessibleName('PIN for Coupon title 2')
  })

  it('keeps a coupon on its own page after it is redeemed, so the book does not jump', async () => {
    renderList([coupon(1), coupon(2), coupon(3)])
    const pageTwo = () => screen.getAllByRole('group')[1]
    await userEvent.click(within(pageTwo()).getByRole('button', { name: /redeem/i }))

    await userEvent.click(screen.getByRole('button', { name: 'Sender confirmed' }))

    expect(within(pageTwo()).getByText('Coupon title 2')).toBeInTheDocument()
    expect(within(pageTwo()).queryByRole('button', { name: /redeem/i })).not.toBeInTheDocument()
  })
})
