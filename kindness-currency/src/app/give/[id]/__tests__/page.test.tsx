import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GivePage from '../page'
import { antiqueGold } from '@/lib/singleUseGestures'
import { templateVisuals } from '@/constants/designTokens'

vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn().mockReturnValue({}) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ auth: { getUser: () => Promise.resolve({ data: { user: null } }) } }),
}))

const { hasCookie } = vi.hoisted(() => ({ hasCookie: vi.fn().mockReturnValue(false) }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ has: hasCookie }) }))
vi.mock('@/components/give/RecipientAgeGate', () => ({
  RecipientAgeGate: ({ setId }: { setId: string }) => <div data-testid="age-gate" data-set-id={setId} />,
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
  is_age_restricted: false,
  expiry_date: null,
  recipient_user_id: null,
  sender_message: null,
  opened_at: null,
  reminder_frequency: null,
  coupons: [],
  ...overrides,
})

describe('GivePage age gate (18+ sets)', () => {
  const restricted = () => couponSet({ template_slug: 'lovers', is_age_restricted: true, sender_message: 'Secret note', coupons: [{ id: 'c1', status: 'sent' as const, sort_order: 1 }] })

  it('renders only the age gate — no gift content, no markOpened — when the cookie is missing', async () => {
    hasCookie.mockReturnValue(false)
    markOpened.mockClear()
    getCouponSetForRecipient.mockResolvedValue(restricted())

    const { container } = render(await GivePage({ params: Promise.resolve({ id: 'set-1' }) }))

    expect(screen.getByTestId('age-gate')).toHaveAttribute('data-set-id', 'set-1')
    expect(screen.queryByTestId('coupon-list')).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Alex|Mom|Secret note/)
    expect(markOpened).not.toHaveBeenCalled()
  })

  it('renders the gift once the age cookie is present', async () => {
    hasCookie.mockReturnValue(true)
    getCouponSetForRecipient.mockResolvedValue(restricted())

    render(await GivePage({ params: Promise.resolve({ id: 'set-1' }) }))

    expect(screen.queryByTestId('age-gate')).not.toBeInTheDocument()
    expect(screen.getByTestId('coupon-list')).toBeInTheDocument()
  })

  it('never gates a non-restricted gift', async () => {
    hasCookie.mockReturnValue(false)
    getCouponSetForRecipient.mockResolvedValue(couponSet())

    render(await GivePage({ params: Promise.resolve({ id: 'set-1' }) }))

    expect(screen.queryByTestId('age-gate')).not.toBeInTheDocument()
    expect(screen.getByTestId('coupon-list')).toBeInTheDocument()
  })
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

  const coupon = (sort_order: number) => ({ id: `c${sort_order}`, status: 'sent' as const, sort_order })

  it('speaks of a single promise when the gift is one single-use coupon', async () => {
    getCouponSetForRecipient.mockResolvedValue(couponSet({ template_slug: 'relief', coupons: [coupon(1)] }))

    render(await GivePage({ params: Promise.resolve({ id: 'set-1' }) }))

    expect(screen.getByText("One promise, saved for whenever you're ready. Tap it when it's time to call it in.")).toBeInTheDocument()
    expect(screen.queryByText(/1 promises/)).not.toBeInTheDocument()
  })

  it('counts the promises when the gift is a bundle', async () => {
    getCouponSetForRecipient.mockResolvedValue(couponSet({ coupons: [coupon(1), coupon(2), coupon(3)] }))

    render(await GivePage({ params: Promise.resolve({ id: 'set-1' }) }))

    expect(screen.getByText("3 promises, each redeemable whenever you're ready. Tap one to call it in.")).toBeInTheDocument()
  })

  it("tucks the sender's note into the page and offers reminders inline", async () => {
    getCouponSetForRecipient.mockResolvedValue(couponSet({ sender_message: 'Thinking of you.', coupons: [coupon(1), coupon(2)] }))

    render(await GivePage({ params: Promise.resolve({ id: 'set-1' }) }))

    expect(screen.getByRole('button', { name: /A note from Alex/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Want a nudge to use these\?/ })).toBeInTheDocument()
  })
})
