import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CouponSetBuilder } from '../CouponSetBuilder'
import { ctaCopy } from '@/constants/ctaCopy'
import type { TemplateWithCoupons } from '@/lib/templateRepository'

const getSession = vi.fn().mockResolvedValue({ data: { session: null } })
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { getSession } }),
}))

const saveCouponSetAction = vi.fn()
vi.mock('@/app/create/actions', () => ({
  saveCouponSetAction: (input: unknown) => saveCouponSetAction(input),
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

describe('CouponSetBuilder', () => {
  beforeEach(() => {
    window.localStorage.clear()
    getSession.mockReset().mockResolvedValue({ data: { session: null } })
    saveCouponSetAction.mockReset()
  })

  describe('template selection', () => {
    it('advances straight to the details screen for a non-restricted template', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)

      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      expect(screen.getByText("Who's it for?")).toBeInTheDocument()
      expect(screen.queryByText('A grown-up gift')).not.toBeInTheDocument()
    })

    it("shows the template's emotional_tone as a description", () => {
      render(
        <CouponSetBuilder
          templates={[template({ emotional_tone: 'Everyday acts of care for the person who raised you.' })]}
          isLoggedIn={false}
        />
      )

      expect(screen.getByText('Everyday acts of care for the person who raised you.')).toBeInTheDocument()
    })
  })

  describe('sample preview', () => {
    it('shows only the first 3 default coupons when the template has more than 3', async () => {
      render(<CouponSetBuilder templates={[templateWithFourCoupons]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))

      expect(screen.getByText('Coupon 1')).toBeInTheDocument()
      expect(screen.getByText('Coupon 2')).toBeInTheDocument()
      expect(screen.getByText('Coupon 3')).toBeInTheDocument()
      expect(screen.queryByText('Coupon 4')).not.toBeInTheDocument()
    })

    it('shows a "click to view all coupons" CTA once capped', async () => {
      render(<CouponSetBuilder templates={[templateWithFourCoupons]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))

      expect(screen.getByRole('button', { name: ctaCopy.previewViewAllCoupons })).toBeInTheDocument()
    })

    it('closes the preview and selects the template when the CTA is clicked, for a non-restricted template', async () => {
      render(<CouponSetBuilder templates={[templateWithFourCoupons]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewViewAllCoupons }))

      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
      expect(screen.getByText("Who's it for?")).toBeInTheDocument()
    })

    it('shows the age gate, not the details screen, when the CTA is clicked for a restricted template', async () => {
      render(<CouponSetBuilder templates={[template({ ...restrictedTemplate, template_coupons: manyCoupons(4) })]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))
      await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewViewAllCoupons }))

      expect(screen.getByText('A grown-up gift')).toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('shows the template\'s own default coupons when "See a Coupon Sample" is clicked', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))

      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('One Home-Cooked Meal')).toBeInTheDocument()
    })

    it('closes via the existing close button', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))
      await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))

      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('shows the age gate instead of the preview for a restricted template', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))

      expect(screen.getByText('A grown-up gift')).toBeInTheDocument()
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('opens the preview, not the details screen, after confirming the age gate from the sample-preview path', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))
      await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))

      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
    })

    it('shows no "click to view all coupons" CTA when the template has 3 or fewer default coupons', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewSampleCoupons }))

      expect(screen.queryByRole('button', { name: ctaCopy.previewViewAllCoupons })).not.toBeInTheDocument()
    })
  })

  describe('age gate', () => {
    it('shows the age gate for a restricted template instead of advancing immediately', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} isLoggedIn={false} />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))

      expect(screen.getByText('A grown-up gift')).toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
    })

    it('does not advance to details if the user clicks "Go Back"', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} isLoggedIn={false} />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))
      await userEvent.click(screen.getByRole('button', { name: 'Go Back' }))

      expect(screen.queryByText('A grown-up gift')).not.toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
      expect(screen.getByText("Lover's Intimate Promises")).toBeInTheDocument()
    })

    it('advances to details after confirming 18+', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} isLoggedIn={false} />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))
      await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))

      expect(screen.getByText("Who's it for?")).toBeInTheDocument()
    })
  })

  describe('details form', () => {
    it('blocks continuing to the editor without a recipient name', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(screen.getByText('Add their name first ♥')).toBeInTheDocument()
      expect(screen.queryByText(/coupons ready to personalise/)).not.toBeInTheDocument()
    })

    it('advances to the editor once a recipient name is entered', async () => {
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(screen.getByText('Save My Coupons')).toBeInTheDocument()
    })
  })

  async function goToEditor(isLoggedIn = false) {
    render(<CouponSetBuilder templates={[template()]} isLoggedIn={isLoggedIn} />)
    await userEvent.click(screen.getByText("Mom's Promise Tokens"))
    await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
    await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
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
      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: '2026-12-25' } })

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
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
    it('opens on "Preview All Coupons" and closes on the close button', async () => {
      await goToEditor()

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewAllCoupons }))
      expect(screen.getByText('Preview')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('shows every one of the sender\'s own coupons, uncapped, even with more than 3', async () => {
      render(<CouponSetBuilder templates={[templateWithFourCoupons]} isLoggedIn={false} />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.previewAllCoupons }))

      expect(screen.getByRole('heading', { level: 2, name: 'Coupon 1' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Coupon 4' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: ctaCopy.previewViewAllCoupons })).not.toBeInTheDocument()
    })
  })

  describe('save and send', () => {
    it('opens AuthGate when "Save My Coupons" is clicked', async () => {
      await goToEditor()

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))

      expect(screen.getByText(ctaCopy.authModalHeading)).toBeInTheDocument()
    })

    it('opens AuthGate when "Send with Love" is clicked', async () => {
      await goToEditor()

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))

      expect(screen.getByText(ctaCopy.authModalHeading)).toBeInTheDocument()
    })

    it('skips AuthGate and saves directly when "Save My Coupons" is clicked by an already-logged-in giver', async () => {
      saveCouponSetAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      await goToEditor(true)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))

      expect(screen.queryByText(ctaCopy.authModalHeading)).not.toBeInTheDocument()
      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(saveCouponSetAction).toHaveBeenCalledOnce()
    })

    it('skips AuthGate and saves directly when "Send with Love" is clicked by an already-logged-in giver', async () => {
      saveCouponSetAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })
      await goToEditor(true)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))

      expect(screen.queryByText(ctaCopy.authModalHeading)).not.toBeInTheDocument()
      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(saveCouponSetAction).toHaveBeenCalledOnce()
    })
  })

  describe('resume after auth', () => {
    const draftKey = 'kindness-currency:coupon-set-draft'

    function seedUnsavedDraft() {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({
          screen: 'edit',
          selectedTemplateId: template().id,
          selectedTemplateSlug: 'mothers_day',
          senderName: 'Alex',
          recipientName: 'Mom',
          expiryDate: '',
          coupons: Array.from({ length: 8 }, (_, i) => ({
            id: `c${i + 1}`,
            sortOrder: i + 1,
            serviceTitle: `Coupon ${i + 1}`,
            microCopy: '',
            finePrint: '',
            fontChoice: 'playfair',
            backgroundColor: '#FFF8F0',
            backgroundEffect: 'none',
          })),
          savedResult: null,
        })
      )
    }

    it('auto-saves and shows GiftReadyScreen when the user returns already authenticated with an unsaved draft', async () => {
      seedUnsavedDraft()
      getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
      saveCouponSetAction.mockResolvedValue({ success: true, id: 'set-1', pin: '4821' })

      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)

      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(saveCouponSetAction).toHaveBeenCalledOnce()
    })

    it('does not attempt to save when there is no authenticated session', async () => {
      seedUnsavedDraft()
      getSession.mockResolvedValue({ data: { session: null } })

      render(<CouponSetBuilder templates={[template()]} isLoggedIn={false} />)

      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(saveCouponSetAction).not.toHaveBeenCalled()
    })
  })
})
