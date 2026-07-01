import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('CouponSetBuilder', () => {
  beforeEach(() => {
    window.localStorage.clear()
    getSession.mockReset().mockResolvedValue({ data: { session: null } })
    saveCouponSetAction.mockReset()
  })

  describe('template selection', () => {
    it('advances straight to the details screen for a non-restricted template', async () => {
      render(<CouponSetBuilder templates={[template()]} />)

      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      expect(screen.getByText("Who's it for?")).toBeInTheDocument()
      expect(screen.queryByText('A grown-up gift')).not.toBeInTheDocument()
    })
  })

  describe('age gate', () => {
    it('shows the age gate for a restricted template instead of advancing immediately', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))

      expect(screen.getByText('A grown-up gift')).toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
    })

    it('does not advance to details if the user clicks "Go Back"', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))
      await userEvent.click(screen.getByRole('button', { name: 'Go Back' }))

      expect(screen.queryByText('A grown-up gift')).not.toBeInTheDocument()
      expect(screen.queryByText("Who's it for?")).not.toBeInTheDocument()
      expect(screen.getByText("Lover's Intimate Promises")).toBeInTheDocument()
    })

    it('advances to details after confirming 18+', async () => {
      render(<CouponSetBuilder templates={[restrictedTemplate]} />)

      await userEvent.click(screen.getByText("Lover's Intimate Promises"))
      await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))

      expect(screen.getByText("Who's it for?")).toBeInTheDocument()
    })
  })

  describe('details form', () => {
    it('blocks continuing to the editor without a recipient name', async () => {
      render(<CouponSetBuilder templates={[template()]} />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(screen.getByText('Add their name first ♥')).toBeInTheDocument()
      expect(screen.queryByText(/coupons ready to personalise/)).not.toBeInTheDocument()
    })

    it('advances to the editor once a recipient name is entered', async () => {
      render(<CouponSetBuilder templates={[template()]} />)
      await userEvent.click(screen.getByText("Mom's Promise Tokens"))
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')

      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))

      expect(screen.getByText('Save My Coupons')).toBeInTheDocument()
    })
  })

  async function goToEditor() {
    render(<CouponSetBuilder templates={[template()]} />)
    await userEvent.click(screen.getByText("Mom's Promise Tokens"))
    await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
    await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
  }

  describe('coupon editor', () => {
    it('updates the live CouponCard preview as the title is edited', async () => {
      await goToEditor()

      const titleInput = screen.getByLabelText('Service title')
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'One Homemade Feast')

      expect(titleInput).toHaveValue('One Homemade Feast')
      expect(screen.getByText('One Homemade Feast')).toBeInTheDocument() // live CouponCard title
    })

    it('switches the title font when DM Sans is selected', async () => {
      await goToEditor()

      await userEvent.click(screen.getByRole('button', { name: 'DM Sans' }))

      const cardTitle = screen.getByText('One Home-Cooked Meal')
      expect(cardTitle).toHaveStyle({ fontStyle: 'normal' })
    })

    it('applies a background effect selection', async () => {
      await goToEditor()

      await userEvent.click(screen.getByRole('button', { name: 'Confetti' }))

      expect(screen.getByRole('button', { name: 'Confetti' })).toHaveStyle({ color: '#fff' })
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

      render(<CouponSetBuilder templates={[template()]} />)

      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(saveCouponSetAction).toHaveBeenCalledOnce()
    })

    it('does not attempt to save when there is no authenticated session', async () => {
      seedUnsavedDraft()
      getSession.mockResolvedValue({ data: { session: null } })

      render(<CouponSetBuilder templates={[template()]} />)

      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(saveCouponSetAction).not.toHaveBeenCalled()
    })
  })
})
