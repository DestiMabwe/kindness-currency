import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CouponSetBuilder } from '../CouponSetBuilder'
import type { TemplateWithCoupons } from '@/lib/templateRepository'

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

      expect(screen.getByText(/coupons ready to personalise/)).toBeInTheDocument()
    })
  })
})
