import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CouponSetBuilder } from '../CouponSetBuilder'
import { ctaCopy } from '@/constants/ctaCopy'
import type { TemplateWithCoupons } from '@/lib/templateRepository'

const saveDraftAction = vi.fn()
const sendCouponSetAction = vi.fn()
const initiateSendCheckoutAction = vi.fn()
const verifyCheckoutAction = vi.fn()
const linkSenderAction = vi.fn()
const checkTemplateEntitlementAction = vi.fn()
vi.mock('@/app/create/actions', () => ({
  saveDraftAction: (input: unknown) => saveDraftAction(input),
  sendCouponSetAction: (input: unknown) => sendCouponSetAction(input),
  initiateSendCheckoutAction: (slug: string, product?: string) => initiateSendCheckoutAction(slug, product),
  verifyCheckoutAction: (reference: string) => verifyCheckoutAction(reference),
  linkSenderAction: (setId: string) => linkSenderAction(setId),
  checkTemplateEntitlementAction: (slug: string) => checkTemplateEntitlementAction(slug),
}))

const resumePaystackCheckout = vi.fn()
vi.mock('@/lib/paystack/inline', () => ({
  resumePaystackCheckout: (accessCode: string, handlers: unknown) => resumePaystackCheckout(accessCode, handlers),
}))

vi.mock('@/app/early-access/actions', () => ({
  signUpForEarlyAccessAction: vi.fn(),
}))

const recordFeatureInterestAction = vi.fn()
vi.mock('@/app/feature-interest/actions', () => ({
  recordFeatureInterestAction: (input: unknown) => recordFeatureInterestAction(input),
}))

const template = (overrides: Partial<TemplateWithCoupons> = {}): TemplateWithCoupons => ({
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  slug: 'mothers_day',
  name: "Mom's Promise Tokens",
  theme: 'Promise',
  color_mood: null,
  decorative_element: 'Flower',
  emotional_tone: null,
  is_age_restricted: false,
  is_active: true,
  is_single_use: false,
  sort_order: 1,
  template_coupons: [
    { id: 'c1', template_id: 'aaaaaaaa-0000-0000-0000-000000000001', sort_order: 1, service_title: 'One Home-Cooked Meal', micro_copy: '', fine_print: '' },
  ],
  ...overrides,
})

const restrictedTemplate = template({
  id: 'bbbbbbbb-0000-0000-0000-000000000001',
  slug: 'lovers',
  name: "Lover's Intimate Promises",
  is_age_restricted: true,
  sort_order: 2,
})

const otherTemplate = template({
  id: 'cccccccc-0000-0000-0000-000000000001',
  slug: 'valentines',
  name: "Valentine's Love Passes",
  sort_order: 3,
})

function manyCoupons(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `m${i + 1}`,
    template_id: 'aaaaaaaa-0000-0000-0000-000000000001',
    sort_order: i + 1,
    service_title: `Coupon ${i + 1}`,
    micro_copy: '',
    fine_print: '',
  }))
}

const templateWithFourCoupons = template({ template_coupons: manyCoupons(4) })

const comingSoon = () => ({
  id: 'cs-1',
  slug: 'dads',
  name: "Dad's Promise Tokens",
  blurb_points: ['Guy time and shared hobbies', 'Dad jokes and sports talk', 'For the dad who shows love by doing'],
  cover_image_path: '/images/coming-soon/dads.png',
  is_active: true,
  sort_order: 1,
})

describe('CouponSetBuilder', () => {
  beforeEach(() => {
    window.localStorage.clear()
    saveDraftAction.mockReset()
    sendCouponSetAction.mockReset()
    initiateSendCheckoutAction.mockReset()
    verifyCheckoutAction.mockReset()
    linkSenderAction.mockReset()
    recordFeatureInterestAction.mockReset()
    checkTemplateEntitlementAction.mockReset()
    resumePaystackCheckout.mockReset().mockResolvedValue(undefined)
    // Every bundle template is paid, so continuing past the details screen always checks
    // entitlement first (see CouponSetBuilder's unlockEditorIfEntitled) — default to "already
    // entitled" so tests unrelated to the paywall gate can reach the editor without each one
    // wiring this up; tests that exercise the gate itself override this per-test.
    checkTemplateEntitlementAction.mockResolvedValue({ entitled: true })
  })

  describe('home logo link', () => {
    it('shows a clickable logo link to home on the template-select screen', () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(screen.getByRole('link', { name: 'Kindness Currency home' })).toHaveAttribute('href', '/')
    })

    it('does not show the logo link on the details screen', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      expect(screen.queryByRole('link', { name: 'Kindness Currency home' })).not.toBeInTheDocument()
    })
  })

  describe('template selection', () => {
    it('advances straight to the details screen for a non-restricted template', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      expect(screen.getByText("Who's it for?")).toBeInTheDocument()
      expect(screen.queryByText('A grown-up gift')).not.toBeInTheDocument()
    })

    it("shows the template's emotional_tone as a description", () => {
      render(<CouponSetBuilder templates={[template({ emotional_tone: 'Everyday acts of care for the person who raised you.' })]} region="US" />)

      expect(screen.getByText('Everyday acts of care for the person who raised you.')).toBeInTheDocument()
    })
  })

  describe('"How You Create Your Perfect Gift" walkthrough', () => {
    it('opens on the Personalize step, showing a static snapshot of the real form and editor with the template\'s own first default coupon', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))

      expect(screen.getByText(ctaCopy.howYouCreateStepPersonalize)).toBeInTheDocument()
      expect(screen.getByText(ctaCopy.howYouCreateDetailsStepLabel)).toBeInTheDocument()
      expect(screen.getByText(ctaCopy.howYouCreateEditStepLabel)).toBeInTheDocument()
      expect(screen.getByText('One Home-Cooked Meal')).toBeInTheDocument()
      expect(screen.getByText(ctaCopy.howYouCreatePersonalizeBody)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: ctaCopy.howYouCreateBack })).not.toBeInTheDocument()
    })

    it('advances to the Preview step, showing only the first 3 default coupons when the template has more than 3', async () => {
      render(<CouponSetBuilder templates={[templateWithFourCoupons]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext }))

      expect(screen.getByText('Coupon 1')).toBeInTheDocument()
      expect(screen.getByText('Coupon 2')).toBeInTheDocument()
      expect(screen.getByText('Coupon 3')).toBeInTheDocument()
      expect(screen.queryByText('Coupon 4')).not.toBeInTheDocument()
    })

    it('goes back to Personalize from Preview', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateBack }))

      expect(screen.getByText(ctaCopy.howYouCreatePersonalizeBody)).toBeInTheDocument()
    })

    it('advances from Preview into the Send step, previewing the recipient message, instructions, and coupon list — never the real builder', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext })) // -> preview
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext })) // -> send (message)

      expect(screen.getByText(ctaCopy.howYouCreateRecipientBanner)).toBeInTheDocument()
      expect(screen.getByText('A gift from Your Name')).toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.giftMessageContinue }))

      expect(screen.getByText(ctaCopy.giftInstructionsHeading)).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.giftOpenCoupons }))

      expect(screen.getByRole('button', { name: ctaCopy.recipientRedeemButton })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateDone }))

      expect(screen.queryByText(ctaCopy.giftInstructionsHeading)).not.toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
    })

    it('shows the age gate, not the walkthrough, until confirmed for a restricted template', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))

      expect(screen.getByText('A grown-up gift')).toBeInTheDocument()
      expect(screen.queryByText(ctaCopy.howYouCreateStepPersonalize)).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))

      expect(screen.getByText(ctaCopy.howYouCreateStepPersonalize)).toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
    })

    it('closes via the close button without selecting the template', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))
      await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))

      expect(screen.queryByText(ctaCopy.howYouCreateStepPersonalize)).not.toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
    })
  })

  describe('add to cart quantity stepper', () => {
  beforeEach(() => {
    window.localStorage.removeItem('kindness-currency:cart-v2')
  })

  it('adds the chosen quantity to the cart when Design My Gift is tapped', async () => {
    render(<CouponSetBuilder templates={[template()]} region="US" />)

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.qtyIncreaseLabel("Mom's Promise Tokens") }))
    await userEvent.click(screen.getByRole('button', { name: ctaCopy.designMyGiftCta('$5.98') }))

    expect(screen.getByRole('link', { name: ctaCopy.cartLinkLabel(2) })).toBeInTheDocument()
  })

  it('confirms the add with "Added" and disables the button briefly, so a hesitant re-tap can\'t silently add a second set', async () => {
    render(<CouponSetBuilder templates={[template()]} region="US" />)

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.designMyGiftCta('$2.99') }))

    const confirmedButton = screen.getByRole('button', { name: ctaCopy.designMyGiftAddedCta })
    expect(confirmedButton).toBeDisabled()
    expect(screen.getByRole('link', { name: ctaCopy.cartLinkLabel(1) })).toBeInTheDocument()

    await waitFor(
      () => expect(screen.getByRole('button', { name: ctaCopy.designMyGiftCta('$2.99') })).toBeInTheDocument(),
      { timeout: 2000 }
    )
  })

  it('shows no separate price label — only the price inside the Design My Gift button, scaling with quantity', async () => {
    render(<CouponSetBuilder templates={[template()]} region="US" />)

    expect(screen.getByRole('button', { name: ctaCopy.designMyGiftCta('$2.99') })).toBeInTheDocument()
    expect(screen.queryByText('$2.99')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.qtyIncreaseLabel("Mom's Promise Tokens") }))

    expect(screen.getByRole('button', { name: ctaCopy.designMyGiftCta('$5.98') })).toBeInTheDocument()
  })

  it('shows a pending-to-personalize badge that decrements after completing a send for that template', async () => {
    // Consuming a purchased instance only happens on an actual Send (paid), never a free draft
    // save — see couponSetRepository's requiresPaymentForSend / CouponSetBuilder's performSave.
    sendCouponSetAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
    window.localStorage.setItem(
      'kindness-currency:purchased',
      JSON.stringify([
        { id: 'p1', slug: 'mothers_day' },
        { id: 'p2', slug: 'mothers_day' },
      ])
    )
    render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)

    expect(screen.getByText('2 to personalize')).toBeInTheDocument()

    await userEvent.click(screen.getByText("Mom's Promise Tokens"))
    await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
    await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
    await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
    await userEvent.click(await screen.findByRole('button', { name: ctaCopy.sendWithLove }))
    await screen.findByText('Your gift is ready')
    await userEvent.click(screen.getByRole('button', { name: ctaCopy.giftReadyStartOver }))

    expect(screen.getByText('1 to personalize')).toBeInTheDocument()
  })
})

describe('single-use gesture pricing', () => {
  it('shows a quantity stepper and priced Design My Gift button on a paid gesture, but not on a free one', () => {
    render(<CouponSetBuilder templates={[template()]} region="US" />)

    expect(screen.getByRole('button', { name: ctaCopy.qtyIncreaseLabel('Night Out') })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: ctaCopy.designMyGiftCta('$1.99') })).toHaveLength(4) // 4 paid gestures, all $1.99
    expect(screen.queryByRole('button', { name: ctaCopy.qtyIncreaseLabel('Rescue Mission') })).not.toBeInTheDocument()
  })

  it('shows the free CTA on a free gesture and no quantity stepper or priced button', () => {
    render(<CouponSetBuilder templates={[template()]} region="US" />)

    expect(screen.getAllByRole('button', { name: ctaCopy.singleUseFreeCta }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: ctaCopy.designMyGiftCta('$0.00') })).not.toBeInTheDocument()
  })

  it('includes the paid "Undivided Attention" gesture in the gallery, priced like the other paid gestures', () => {
    render(<CouponSetBuilder templates={[template()]} region="US" />)

    expect(screen.getByText('Undivided Attention')).toBeInTheDocument()
    expect(screen.getByText('One full hour, just us — phones off, world on pause')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: ctaCopy.qtyIncreaseLabel('Undivided Attention') })).toBeInTheDocument()
  })
})

describe('coming soon section', () => {
    it('renders a "Coming Soon" heading and card below the live templates', () => {
      render(<CouponSetBuilder templates={[template()]} comingSoonTemplates={[comingSoon()]} region="US" />)

      expect(screen.getByText('Coming Soon')).toBeInTheDocument()
      expect(screen.getByText("Dad's Promise Tokens")).toBeInTheDocument()
    })

    it('does not render the section when there are no coming-soon templates', () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument()
    })

    it('opens a modal with the blurb and early-access form when a coming-soon card is clicked', async () => {
      render(<CouponSetBuilder templates={[template()]} comingSoonTemplates={[comingSoon()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: /Dad's Promise Tokens/ }))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Guy time and shared hobbies')).toBeInTheDocument()
      expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    })

    it('closes the modal on the close button', async () => {
      render(<CouponSetBuilder templates={[template()]} comingSoonTemplates={[comingSoon()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: /Dad's Promise Tokens/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Close' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('feature-interest button', () => {
    it('shows the Custom Coupon Books early-access button on the template-select screen', () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(screen.getByRole('button', { name: ctaCopy.customCouponBookButton })).toBeInTheDocument()
      expect(screen.queryByText('Create Multiple Coupon Sets')).not.toBeInTheDocument()
    })

    it('opens the interest modal tagged custom_coupons on click', async () => {
      recordFeatureInterestAction.mockResolvedValue({ success: true })
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.customCouponBookButton }))
      await userEvent.type(await screen.findByLabelText('Email address'), 'jamie@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Notify Me' }))

      expect(recordFeatureInterestAction).toHaveBeenCalledWith({ feature: 'custom_coupons', email: 'jamie@example.com' })
    })

    it('uses the one-click path with the account email for a giver with a known email', async () => {
      recordFeatureInterestAction.mockResolvedValue({ success: true })
      render(<CouponSetBuilder templates={[template()]} userEmail="alex@example.com" region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.customCouponBookButton }))
      const notifyButton = await screen.findByRole('button', { name: /Notify Me/ })
      expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument()

      await userEvent.click(notifyButton)

      expect(recordFeatureInterestAction).toHaveBeenCalledWith({ feature: 'custom_coupons', email: 'alex@example.com' })
    })
  })

  describe('age gate', () => {
    it('shows the age gate for a restricted template instead of advancing immediately', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} region="US" />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))

      expect(screen.getByText('A grown-up gift')).toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
    })

    it('does not advance to details if the user clicks "Go Back"', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} region="US" />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))
      await userEvent.click(screen.getByRole('button', { name: 'Go Back' }))

      expect(screen.queryByText('A grown-up gift')).not.toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
      expect(screen.getByText("Lover's Intimate Promises")).toBeInTheDocument()
    })

    it('advances to details after confirming 18+', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} region="US" />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))
      await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))

      expect(screen.getByText("Who's it for?")).toBeInTheDocument()
    })
  })

  describe('details form', () => {
    it('blocks continuing to the editor without a recipient name or a sender name', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(screen.getByText('Add your name first ♥')).toBeInTheDocument()
      expect(screen.getByText('Add their name first ♥')).toBeInTheDocument()
      expect(screen.queryByText(/coupons ready to personalise/)).not.toBeInTheDocument()
    })

    it('blocks continuing with a recipient name but no sender name', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(screen.getByText('Add your name first ♥')).toBeInTheDocument()
      expect(screen.queryByText('Save My Coupons')).not.toBeInTheDocument()
    })

    it('advances to the editor once both names are entered, already logged in and entitled', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(await screen.findByText('Save My Coupons')).toBeInTheDocument()
      expect(checkTemplateEntitlementAction).toHaveBeenCalledWith('mothers_day')
    })

    it('opens the auth prompt instead of the editor when continuing while logged out — every bundle template is paid', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(await screen.findByText('Almost there — save your coupons')).toBeInTheDocument()
      expect(screen.queryByText('Save My Coupons')).not.toBeInTheDocument()
      expect(checkTemplateEntitlementAction).not.toHaveBeenCalled()
    })

    it('opens the Paystack popup instead of the editor when logged in but not yet entitled', async () => {
      checkTemplateEntitlementAction.mockResolvedValue({ entitled: false })
      initiateSendCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      await waitFor(() => expect(initiateSendCheckoutAction).toHaveBeenCalledWith('mothers_day', undefined))
      expect(resumePaystackCheckout).toHaveBeenCalledWith('access-code-1', expect.objectContaining({ onSuccess: expect.any(Function) }))
      expect(screen.queryByText('Save My Coupons')).not.toBeInTheDocument()
    })

    it('unlocks the editor once the popup reports success and payment verifies', async () => {
      checkTemplateEntitlementAction.mockResolvedValue({ entitled: false })
      initiateSendCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      verifyCheckoutAction.mockResolvedValue({ paid: true, cartSnapshot: [], amountCents: 299 })
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await waitFor(() => expect(resumePaystackCheckout).toHaveBeenCalled())

      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onSuccess: (r: { reference: string }) => void }
      handlers.onSuccess({ reference: 'kc_ref_1' })

      expect(await screen.findByText('Save My Coupons')).toBeInTheDocument()
      expect(verifyCheckoutAction).toHaveBeenCalledWith('kc_ref_1')
    })

    it('shows a payment-incomplete error instead of unlocking when the popup succeeds but verification says unpaid', async () => {
      checkTemplateEntitlementAction.mockResolvedValue({ entitled: false })
      initiateSendCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      verifyCheckoutAction.mockResolvedValue({ paid: false })
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await waitFor(() => expect(resumePaystackCheckout).toHaveBeenCalled())

      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onSuccess: (r: { reference: string }) => void }
      handlers.onSuccess({ reference: 'kc_ref_1' })

      expect(await screen.findByText("Your payment wasn't completed, so the coupon editor isn't unlocked yet. Feel free to try again.")).toBeInTheDocument()
      expect(screen.queryByText('Save My Coupons')).not.toBeInTheDocument()
    })

    it('shows the checkout error and stays on the details screen if starting checkout fails', async () => {
      checkTemplateEntitlementAction.mockResolvedValue({ entitled: false })
      initiateSendCheckoutAction.mockResolvedValue({ success: false, error: 'Something went wrong starting checkout. Please try again.' })
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(await screen.findByText('Something went wrong starting checkout. Please try again.')).toBeInTheDocument()
      expect(screen.queryByText('Save My Coupons')).not.toBeInTheDocument()
    })

    it('leaves the message field empty by default, offering the template\'s smart default as a tappable suggestion instead', async () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      const textarea = screen.getByPlaceholderText('Something to say before they open it…')
      expect(textarea).toHaveValue('')

      await userEvent.click(screen.getByText(/For everything you do without ever being asked/))

      expect(textarea).toHaveValue(
        'For everything you do without ever being asked — a few ways I want to take care of you now.'
      )
    })

    it('includes a sender message field, and a custom message flows through to the save payload', async () => {
      saveDraftAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.clear(screen.getByPlaceholderText('Something to say before they open it…'))
      await userEvent.type(screen.getByPlaceholderText('Something to say before they open it…'), 'Thinking of you every day.')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      await userEvent.click(await screen.findByRole('button', { name: ctaCopy.saveMyCoupons }))

      expect(saveDraftAction).toHaveBeenCalledWith(expect.objectContaining({ sender_message: 'Thinking of you every day.' }))
    })

    it('omits sender_message from the save payload when left blank', async () => {
      saveDraftAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      await userEvent.click(await screen.findByRole('button', { name: ctaCopy.saveMyCoupons }))

      const payload = saveDraftAction.mock.calls[0][0]
      expect(payload).not.toHaveProperty('sender_message')
    })
  })

  // Defaults to logged in — every bundle template is paid, so reaching the editor at all
  // requires it (see CouponSetBuilder's entitlement gate); pass false explicitly for the tests
  // that specifically exercise the logged-out path.
  async function goToEditor(isLoggedIn = true) {
    render(<CouponSetBuilder templates={[template()]} isLoggedIn={isLoggedIn} region="US" />)
    await userEvent.click(screen.getByText("Mom's Promise Tokens"))
    await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
    await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
    await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
    if (isLoggedIn) await screen.findByText('Save My Coupons')
  }

  async function expandCoupon(title: string | RegExp) {
    await userEvent.click(screen.getByRole('button', { name: title }))
  }

  describe('coupon editor', () => {
    it('defaults every coupon card to collapsed, hiding the field inputs', async () => {
      await goToEditor()

      expect(screen.getByRole('button', { name: /One Home-Cooked Meal/ })).toBeInTheDocument()
      expect(screen.queryByLabelText('Service title')).not.toBeInTheDocument()
    })

    it('shows a customized-vs-default progress count in the sticky header', async () => {
      await goToEditor()
      expect(screen.getByText(/0 of 1 customized/)).toBeInTheDocument()

      await expandCoupon(/One Home-Cooked Meal/)
      await userEvent.clear(screen.getByLabelText('Service title'))
      await userEvent.type(screen.getByLabelText('Service title'), 'One Homemade Feast')

      expect(screen.getByText(/1 of 1 customized/)).toBeInTheDocument()
    })

    it('expands a card to reveal its fields, and collapses it again on second click', async () => {
      await goToEditor()

      await expandCoupon(/One Home-Cooked Meal/)
      expect(screen.getByLabelText('Service title')).toBeInTheDocument()

      await expandCoupon(/One Home-Cooked Meal/)
      expect(screen.queryByLabelText('Service title')).not.toBeInTheDocument()
    })

    it('updates the live coupon preview as the title is edited', async () => {
      await goToEditor()
      await expandCoupon(/One Home-Cooked Meal/)

      const titleInput = screen.getByLabelText('Service title')
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'One Homemade Feast')

      expect(titleInput).toHaveValue('One Homemade Feast')
      // live CouponCardHero title; the collapsed-row summary also echoes the name, so scope to the heading
      expect(screen.getByRole('heading', { level: 2, name: 'One Homemade Feast' })).toBeInTheDocument()
    })

    it('does not show a font choice toggle, since CouponCardHero has no font-choice toggle', async () => {
      await goToEditor()
      await expandCoupon(/One Home-Cooked Meal/)

      expect(screen.queryByRole('button', { name: 'Playfair' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'DM Sans' })).not.toBeInTheDocument()
    })

    it('applies a background effect selection', async () => {
      await goToEditor()
      await expandCoupon(/One Home-Cooked Meal/)

      await userEvent.click(screen.getByRole('button', { name: 'Confetti' }))

      expect(screen.getByRole('button', { name: 'Confetti' })).toHaveStyle({ color: '#fff' })
    })

    it("renders the template's real photo in the edit tile", async () => {
      await goToEditor()
      await expandCoupon(/One Home-Cooked Meal/)

      // Decorative photo has alt="" (role="presentation"), so query by tag rather than getByRole('img').
      expect(document.querySelector('img')).toHaveAttribute('src', '/images/mothers_day.png')
    })

    it('shows the real expiry date in the edit tile once set on the details step', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '2026-12-25' } })

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await screen.findByText('Save My Coupons')
      await expandCoupon(/One Home-Cooked Meal/)

      expect(screen.getByText('DEC 25, 2026')).toBeInTheDocument()
    })

    it('caps the service title input at 40 characters', async () => {
      await goToEditor()
      await expandCoupon(/One Home-Cooked Meal/)

      expect(screen.getByLabelText('Service title')).toHaveAttribute('maxlength', '40')
    })

    it('does not allow typing a title longer than 40 characters', async () => {
      await goToEditor()
      await expandCoupon(/One Home-Cooked Meal/)

      const titleInput = screen.getByLabelText('Service title')
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'A'.repeat(50))

      expect((titleInput as HTMLInputElement).value).toHaveLength(40)
    })

    it('applying a color to all coupons from the bulk picker updates the collapsed card swatch', async () => {
      await goToEditor()
      const swatchDot = screen.getByRole('button', { name: /One Home-Cooked Meal/ }).querySelector('span')

      await userEvent.click(screen.getByRole('button', { name: "Set all coupons' background colour #DCEEE8" }))

      expect(swatchDot).toHaveStyle({ backgroundColor: 'rgb(220, 238, 232)' })
    })
  })

  describe('preview overlay', () => {
    it('opens on "Preview All Coupons" showing the same intro a real recipient sees, then the coupon list, and closes on the close button', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      // The message field starts empty by default (mirroring GiftUnwrapGate's own
      // senderMessage ? 'message' : 'instructions'), so this exercises the no-message path.
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await screen.findByText('Save My Coupons')

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewAllCoupons }))
      expect(screen.getByText('How Kindness Currency Works')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Open Your Coupons' }))
      expect(screen.getByText('Preview')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('shows the sender-message step first when the smart-default suggestion is tapped to fill the message', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByText(/For everything you do without ever being asked/))
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await screen.findByText('Save My Coupons')

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewAllCoupons }))

      expect(
        screen.getByText(/For everything you do without ever being asked/)
      ).toBeInTheDocument()
      expect(screen.queryByText('How Kindness Currency Works')).not.toBeInTheDocument()
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('shows the sender-message step first when a custom message was written, before the instructions and coupon list', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.clear(screen.getByPlaceholderText('Something to say before they open it…'))
      await userEvent.type(screen.getByPlaceholderText('Something to say before they open it…'), 'Thinking of you every day.')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await screen.findByText('Save My Coupons')

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewAllCoupons }))

      expect(screen.getByText(/Thinking of you every day\./)).toBeInTheDocument()
      expect(screen.queryByText('How Kindness Currency Works')).not.toBeInTheDocument()
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('shows every one of the sender\'s own coupons, uncapped, even with more than 3', async () => {
      render(<CouponSetBuilder templates={[templateWithFourCoupons]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.clear(screen.getByPlaceholderText('Something to say before they open it…'))
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await screen.findByText('Save My Coupons')

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewAllCoupons }))
      await userEvent.click(screen.getByRole('button', { name: 'Open Your Coupons' }))

      expect(screen.getByRole('heading', { level: 2, name: 'Coupon 1' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Coupon 4' })).toBeInTheDocument()
    })
  })

  describe('editing the message from the coupon editor', () => {
    it('shows a floating button to write a message, since the field starts empty by default', async () => {
      await goToEditor()

      expect(screen.getByRole('button', { name: ctaCopy.editMessageWriteLabel })).toBeInTheDocument()
    })

    it('shows a floating button to edit a custom message the sender wrote themselves', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.clear(screen.getByPlaceholderText('Something to say before they open it…'))
      await userEvent.type(screen.getByPlaceholderText('Something to say before they open it…'), 'Thinking of you every day.')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(await screen.findByRole('button', { name: ctaCopy.editMessageEditLabel })).toBeInTheDocument()
    })

    it('opens a modal that saves the new message into the builder state', async () => {
      saveDraftAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      await goToEditor(true)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.editMessageWriteLabel }))
      await userEvent.type(screen.getByLabelText('Your message'), 'Written after the fact.')
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.editMessageSave }))

      expect(screen.getByRole('button', { name: ctaCopy.editMessageEditLabel })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))
      expect(saveDraftAction).toHaveBeenCalledWith(expect.objectContaining({ sender_message: 'Written after the fact.' }))
    })

    it('discards the draft and keeps the original message when Cancel is tapped', async () => {
      saveDraftAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.type(screen.getByPlaceholderText('Something to say before they open it…'), 'The original message.')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.editMessageEditLabel }))
      await userEvent.clear(screen.getByLabelText('Your message'))
      await userEvent.type(screen.getByLabelText('Your message'), 'A message I changed my mind about.')
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.getByRole('button', { name: ctaCopy.editMessageEditLabel })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))
      expect(saveDraftAction).toHaveBeenCalledWith(
        expect.objectContaining({
          sender_message: 'The original message.',
        })
      )
    })
  })

  describe('save and send', () => {
    it('saves a free draft when already logged in and "Save My Coupons" is clicked', async () => {
      saveDraftAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      await goToEditor(true)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))

      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(saveDraftAction).toHaveBeenCalledOnce()
      expect(sendCouponSetAction).not.toHaveBeenCalled()
    })

    it('sends directly and shows GiftReadyScreen when already logged in, paid, and "Send with Love" is clicked', async () => {
      sendCouponSetAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      await goToEditor(true)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))

      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(sendCouponSetAction).toHaveBeenCalledOnce()
      expect(initiateSendCheckoutAction).not.toHaveBeenCalled()
    })

    it('closing the auth prompt returns to the details screen with nothing unlocked', async () => {
      await goToEditor(false)
      await screen.findByText('Almost there — save your coupons')

      await userEvent.click(screen.getByRole('button', { name: 'Not yet' }))

      expect(screen.queryByText('Almost there — save your coupons')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Personalise the coupons →' })).toBeInTheDocument()
      expect(screen.queryByText('Save My Coupons')).not.toBeInTheDocument()
      expect(saveDraftAction).not.toHaveBeenCalled()
      expect(checkTemplateEntitlementAction).not.toHaveBeenCalled()
    })

    it('shows the WhatsApp share option on the ready screen once logged in', async () => {
      saveDraftAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      await goToEditor(true)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))

      expect(await screen.findByRole('button', { name: /Share via WhatsApp/ })).toBeInTheDocument()
    })

    it('shows the save error and stays on the editor if saving fails', async () => {
      saveDraftAction.mockResolvedValue({ success: false, error: 'Something went wrong. Please try again.' })
      await goToEditor(true)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
      expect(screen.queryByText('Your gift is ready')).not.toBeInTheDocument()
    })

    it('does not show the save-to-account banner, since the sender is always logged in at save time now', async () => {
      saveDraftAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      await goToEditor(true)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))
      await screen.findByText('Your gift is ready')

      expect(screen.queryByText('Save this to your account')).not.toBeInTheDocument()
      expect(screen.queryByText('Add this to your account')).not.toBeInTheDocument()
    })

    it('resumes straight into the unlocked editor after the auth redirect brings the sender back logged in', async () => {
      // The entitlement gate now sits on the details screen (see CouponSetBuilder's
      // handleContinueToEdit), so an auth interruption from there resumes into the editor
      // itself, not straight into a save — the sender still taps Save/Send themselves.
      const first = render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} region="US" />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await screen.findByText('Almost there — save your coupons')
      first.unmount()

      // Simulate the full-page reload that follows the auth provider's redirect: a fresh
      // mount, now logged in, with only localStorage (draft + pending-save-intent flag,
      // no React state) carrying the sender's original intent forward.
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)

      expect(await screen.findByText('Save My Coupons')).toBeInTheDocument()
      expect(checkTemplateEntitlementAction).toHaveBeenCalledWith('mothers_day')
    })

    it('does not auto-save on a plain later visit to /create that never involved the auth prompt', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={true} region="US" />)

      expect(await screen.findByText("Mom's Promise Tokens")).toBeInTheDocument()
      expect(screen.queryByText('Your gift is ready')).not.toBeInTheDocument()
      expect(saveDraftAction).not.toHaveBeenCalled()
      expect(sendCouponSetAction).not.toHaveBeenCalled()
    })
  })

  describe('auth link failed banner', () => {
    afterEach(() => {
      window.history.pushState({}, '', '/')
    })

    it('shows a retry banner when the URL carries the auth-callback failure flag', () => {
      window.history.pushState({}, '', '/?authError=1')
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(screen.getByText(ctaCopy.authLinkFailedBannerText)).toBeInTheDocument()
    })

    it('strips the authError param from the URL after reading it', () => {
      window.history.pushState({}, '', '/?authError=1')
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(window.location.search).toBe('')
    })

    it('does not show the banner on a plain visit with no failure flag', () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(screen.queryByText(ctaCopy.authLinkFailedBannerText)).not.toBeInTheDocument()
    })

    it('opens the auth modal when "Try signing in again" is tapped', async () => {
      window.history.pushState({}, '', '/?authError=1')
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.authLinkFailedRetryButton }))

      expect(screen.getByText('Almost there — save your coupons')).toBeInTheDocument()
      expect(screen.queryByText(ctaCopy.authLinkFailedBannerText)).not.toBeInTheDocument()
    })

    it('dismisses without opening the auth modal', async () => {
      window.history.pushState({}, '', '/?authError=1')
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

      expect(screen.queryByText(ctaCopy.authLinkFailedBannerText)).not.toBeInTheDocument()
      expect(screen.queryByText('Almost there — save your coupons')).not.toBeInTheDocument()
    })
  })

  describe('resumed draft', () => {
    const DRAFT_KEY = 'kindness-currency:coupon-set-draft'

    function seedDraft(overrides: Record<string, unknown> = {}) {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          screen: 'edit',
          selectedTemplateId: template().id,
          selectedTemplateSlug: 'mothers_day',
          senderName: 'Alex',
          recipientName: 'Mom',
          expiryDate: '',
          coupons: [],
          savedResult: null,
          ...overrides,
        })
      )
    }

    it('shows a start-fresh affordance when a mid-progress draft is resumed', () => {
      seedDraft()
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(screen.getByRole('button', { name: ctaCopy.resumedDraftStartFreshButton })).toBeInTheDocument()
    })

    it('does not show the affordance for a fresh session with no stored draft', () => {
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(screen.queryByRole('button', { name: ctaCopy.resumedDraftStartFreshButton })).not.toBeInTheDocument()
    })

    it('does not show the affordance for a draft still on the template-select screen', () => {
      seedDraft({ screen: 'select' })
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      expect(screen.queryByRole('button', { name: ctaCopy.resumedDraftStartFreshButton })).not.toBeInTheDocument()
    })

    it('discards the draft and returns to template-select when "Start fresh" is clicked', async () => {
      seedDraft()
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.resumedDraftStartFreshButton }))

      expect(screen.getByText("Mom's Promise Tokens")).toBeInTheDocument()
      expect(screen.queryByText('Save My Coupons')).not.toBeInTheDocument()
    })

    it('hides the affordance on dismiss without discarding the draft', async () => {
      seedDraft()
      render(<CouponSetBuilder templates={[template()]} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

      expect(screen.queryByRole('button', { name: ctaCopy.resumedDraftStartFreshButton })).not.toBeInTheDocument()
      expect(screen.getByText('Save My Coupons')).toBeInTheDocument()
    })
  })

  describe('template switch warning', () => {
    const DRAFT_KEY = 'kindness-currency:coupon-set-draft'

    function seedInProgressDraft() {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          screen: 'select',
          selectedTemplateId: template().id,
          selectedTemplateSlug: 'mothers_day',
          senderName: 'Alex',
          recipientName: 'Mom',
          expiryDate: '',
          coupons: [
            {
              id: 'c1',
              sortOrder: 1,
              serviceTitle: 'A Custom Title',
              microCopy: '',
              finePrint: '',
              fontChoice: 'playfair',
              backgroundColor: '#FFF8F0',
              backgroundEffect: 'none',
            },
          ],
          savedResult: null,
          // Already customizing means this draft already cleared CouponSetBuilder's entitlement
          // gate once — without this, re-selecting the in-progress template would now land back
          // on the details screen instead of straight into the editor (see loadTemplate).
          editorUnlockedTemplateId: template().id,
        })
      )
    }

    it('warns before switching to a different template than the one in progress', async () => {
      seedInProgressDraft()
      render(<CouponSetBuilder templates={[template(), otherTemplate]} region="US" />)

      await userEvent.click(screen.getByText("Valentine's Love Passes"))

      expect(screen.getByText(ctaCopy.templateSwitchWarningHeading)).toBeInTheDocument()
      expect(screen.getByText(ctaCopy.templateSwitchWarningBody("Mom's Promise Tokens"))).toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
    })

    it('does not warn when re-selecting the template already in progress', async () => {
      seedInProgressDraft()
      render(<CouponSetBuilder templates={[template(), otherTemplate]} region="US" />)

      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      expect(screen.queryByText(ctaCopy.templateSwitchWarningHeading)).not.toBeInTheDocument()
      expect(screen.getByText('Save My Coupons')).toBeInTheDocument()
    })

    it('"Go back to my coupons" cancels the switch and resumes straight into the customizer', async () => {
      seedInProgressDraft()
      render(<CouponSetBuilder templates={[template(), otherTemplate]} region="US" />)
      await userEvent.click(screen.getByText("Valentine's Love Passes"))

      await userEvent.click(
        screen.getByRole('button', { name: ctaCopy.templateSwitchWarningResumeButton("Mom's Promise Tokens") })
      )

      expect(screen.getByText('Save My Coupons')).toBeInTheDocument()
      expect(screen.getByText('A Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Customized ✓')).toBeInTheDocument()
    })

    it('dismissing proceeds with the new template, discarding the in-progress customization', async () => {
      seedInProgressDraft()
      render(<CouponSetBuilder templates={[template(), otherTemplate]} region="US" />)
      await userEvent.click(screen.getByText("Valentine's Love Passes"))

      await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

      expect(screen.getByText(/Valentine's Love Passes/)).toBeInTheDocument()
      expect(screen.getByText("Who's it for?")).toBeInTheDocument()
    })
  })
})
