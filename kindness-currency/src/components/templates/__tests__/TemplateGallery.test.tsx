import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateGallery } from '../TemplateGallery'
import type { TemplateWithCoupons } from '@/lib/templateRepository'
import type { ComingSoonTemplate } from '@/lib/comingSoonTemplateRepository'

const template = (overrides: Partial<TemplateWithCoupons> = {}): TemplateWithCoupons => ({
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  slug: 'mothers_day',
  name: "Mom's Promise Tokens",
  theme: 'Promise',
  color_mood: null,
  decorative_element: 'Flower',
  emotional_tone: 'Everyday acts of care for the person who raised you.',
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

const comingSoon = (overrides: Partial<ComingSoonTemplate> = {}): ComingSoonTemplate => ({
  id: 'cs-1',
  slug: 'dads',
  name: "Dad's Promise Tokens",
  blurb_points: ['Guy time and shared hobbies', 'Dad jokes and sports talk', 'For the dad who shows love by doing'],
  cover_image_path: '/images/coming-soon/dads.png',
  is_active: true,
  sort_order: 1,
  ...overrides,
})

describe('TemplateGallery', () => {
  describe('live templates', () => {
    it('renders each live template with its name', () => {
      render(<TemplateGallery templates={[template()]} comingSoonTemplates={[]} />)

      expect(screen.getByText("Mom's Promise Tokens")).toBeInTheDocument()
    })

    it('opens the sample preview when a non-restricted card is clicked', async () => {
      render(<TemplateGallery templates={[template()]} comingSoonTemplates={[]} />)

      await userEvent.click(screen.getByRole('button', { name: /Mom's Promise Tokens/ }))

      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('One Home-Cooked Meal')).toBeInTheDocument()
    })

    it('shows the age gate for a restricted template instead of the preview', async () => {
      render(<TemplateGallery templates={[restrictedTemplate]} comingSoonTemplates={[]} />)

      await userEvent.click(screen.getByRole('button', { name: /Lover's Intimate Promises/ }))

      expect(screen.getByText('A grown-up gift')).toBeInTheDocument()
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('opens the preview after confirming the age gate', async () => {
      render(<TemplateGallery templates={[restrictedTemplate]} comingSoonTemplates={[]} />)

      await userEvent.click(screen.getByRole('button', { name: /Lover's Intimate Promises/ }))
      await userEvent.click(screen.getByRole('button', { name: "I'm 18+, Continue →" }))

      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('does not open the preview if "Go Back" is clicked on the age gate', async () => {
      render(<TemplateGallery templates={[restrictedTemplate]} comingSoonTemplates={[]} />)

      await userEvent.click(screen.getByRole('button', { name: /Lover's Intimate Promises/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Go Back' }))

      expect(screen.queryByText('A grown-up gift')).not.toBeInTheDocument()
      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })
  })

  describe('coming soon section', () => {
    it('renders a "Coming Soon" heading below the live templates', () => {
      render(<TemplateGallery templates={[template()]} comingSoonTemplates={[comingSoon()]} />)

      expect(screen.getByText('Coming Soon')).toBeInTheDocument()
    })

    it('renders each coming-soon card with its name', () => {
      render(<TemplateGallery templates={[]} comingSoonTemplates={[comingSoon()]} />)

      expect(screen.getByText("Dad's Promise Tokens")).toBeInTheDocument()
    })

    it('opens a modal with the name and blurb when a coming-soon card is clicked', async () => {
      render(<TemplateGallery templates={[]} comingSoonTemplates={[comingSoon()]} />)

      await userEvent.click(screen.getByRole('button', { name: /Dad's Promise Tokens/ }))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Guy time and shared hobbies')).toBeInTheDocument()
    })

    it('closes the modal on the close button', async () => {
      render(<TemplateGallery templates={[]} comingSoonTemplates={[comingSoon()]} />)

      await userEvent.click(screen.getByRole('button', { name: /Dad's Promise Tokens/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Close' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('shows an on-card pairing badge linking Made By Him and Made By Her, without needing a click', () => {
      const madeByHim = comingSoon({
        id: 'cs-him',
        slug: 'made-by-him',
        name: 'Made By Him: Lover’s Promises',
        sort_order: 3,
      })
      const madeByHer = comingSoon({
        id: 'cs-her',
        slug: 'made-by-her',
        name: 'Made By Her: Lover’s Promises',
        sort_order: 4,
      })
      render(<TemplateGallery templates={[]} comingSoonTemplates={[madeByHim, madeByHer]} />)

      expect(screen.getByText(/Pairs with Made By Her/)).toBeInTheDocument()
      expect(screen.getByText(/Pairs with Made By Him/)).toBeInTheDocument()
    })
  })
})
