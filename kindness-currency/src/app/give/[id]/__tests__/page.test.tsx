import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GivePage from '../page'
import { antiqueGold } from '@/lib/singleUseGestures'
import { templateVisuals } from '@/constants/designTokens'

vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ auth: { getUser: () => Promise.resolve({ data: { user: null } }) } }),
}))

const { getCouponSetForRecipient, markOpened } = vi.hoisted(() => ({
  getCouponSetForRecipient: vi.fn(),
  markOpened: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/giveRepository', async () => {
  const actual = await vi.importActual<typeof import('@/lib/giveRepository')>('@/lib/giveRepository')
  return {
    ...actual,
    createGiveRepository: vi.fn().mockReturnValue({ getCouponSetForRecipient, markOpened }),
  }
})

vi.mock('@/components/give/GiftUnwrapGate', () => ({
  GiftUnwrapGate: ({ children, accent }: { children: React.ReactNode; accent: string }) => (
    <div data-testid="unwrap-gate" data-accent={accent}>
      {children}
    </div>
  ),
}))
vi.mock('@/components/shared/SiteHeader', () => ({ SiteHeader: () => <div /> }))
vi.mock('@/components/shared/SaveToAccountBanner', () => ({ SaveToAccountBanner: () => <div /> }))
vi.mock('@/components/coupon/RecipientCouponList', () => ({
  RecipientCouponList: ({ accent, motif, imageSrc }: { accent: string; motif: string; imageSrc: string | null }) => (
    <div data-testid="coupon-list" data-accent={accent} data-motif={motif} data-image-src={imageSrc ?? 'null'} />
  ),
}))

const couponSet = (overrides: Partial<Awaited<ReturnType<typeof getCouponSetForRecipient>>> = {}) => ({
  id: 'set-1',
  sender_name: 'Alex',
  recipient_name: 'Mom',
  template_slug: 'mothers_day',
  expiry_date: null,
  recipient_user_id: null,
  sender_message: null,
  opened_at: null,
  reminder_frequency: null,
  coupons: [],
  ...overrides,
})

describe('GivePage', () => {
  // Regression test: this page used to look templateVisuals[template_slug] up directly, which is
  // undefined for a single-use gesture slug — the page crashed with a TypeError the moment it read
  // .accent off undefined, for every gesture coupon ever sent (see resolveGiftVisual's own test for
  // the underlying fix). This proves the actual integration point that broke now works end to end.
  it('renders a single-use gesture coupon without crashing, using the shared gesture accent/motif', async () => {
    getCouponSetForRecipient.mockResolvedValue(couponSet({ template_slug: 'relief' }))

    const jsx = await GivePage({ params: Promise.resolve({ id: 'set-1' }) })
    render(jsx)

    const list = screen.getByTestId('coupon-list')
    expect(list).toHaveAttribute('data-accent', antiqueGold)
    expect(list).toHaveAttribute('data-motif', '☁')
    expect(list).toHaveAttribute('data-image-src', 'null')
    expect(screen.getByTestId('unwrap-gate')).toHaveAttribute('data-accent', antiqueGold)
  })

  it('still renders a bundle template coupon with its real accent, motif, and cover image', async () => {
    getCouponSetForRecipient.mockResolvedValue(couponSet({ template_slug: 'mothers_day' }))

    const jsx = await GivePage({ params: Promise.resolve({ id: 'set-1' }) })
    render(jsx)

    const list = screen.getByTestId('coupon-list')
    expect(list).toHaveAttribute('data-accent', templateVisuals.mothers_day.accent)
    expect(list).toHaveAttribute('data-motif', templateVisuals.mothers_day.motif)
    expect(list).toHaveAttribute('data-image-src', templateVisuals.mothers_day.imageSrc)
  })
})
