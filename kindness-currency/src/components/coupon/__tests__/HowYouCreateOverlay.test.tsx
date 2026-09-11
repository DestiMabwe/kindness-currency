import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HowYouCreateOverlay } from '../HowYouCreateOverlay'
import { ctaCopy } from '@/constants/ctaCopy'
import type { TemplateWithCoupons } from '@/lib/templateRepository'

const template = (overrides: Partial<TemplateWithCoupons> = {}): TemplateWithCoupons => ({
  id: 't1',
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
    { id: 'c1', template_id: 't1', sort_order: 1, service_title: 'One Home-Cooked Meal', micro_copy: '', fine_print: '' },
    { id: 'c2', template_id: 't1', sort_order: 2, service_title: 'One Free Pass', micro_copy: '', fine_print: '' },
  ],
  ...overrides,
})

describe('HowYouCreateOverlay', () => {
  it('opens on Personalize, showing static snapshots of the real "Who\'s it for?" form and coupon editor', () => {
    render(<HowYouCreateOverlay template={template()} onClose={vi.fn()} />)

    expect(screen.getByText(ctaCopy.howYouCreateStepPersonalize)).toBeInTheDocument()
    expect(screen.getByText(ctaCopy.howYouCreateDetailsStepLabel)).toBeInTheDocument()
    expect(screen.getByText(ctaCopy.howYouCreateEditStepLabel)).toBeInTheDocument()
    expect(screen.getByText('e.g. Alex')).toBeInTheDocument()
    expect(screen.getByText('e.g. Mom')).toBeInTheDocument()
    expect(screen.getByText('One Home-Cooked Meal')).toBeInTheDocument()
    expect(screen.queryByText('One Free Pass')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: ctaCopy.howYouCreateBack })).not.toBeInTheDocument()
  })

  it('advances to Preview, showing the template\'s sample coupons', async () => {
    render(<HowYouCreateOverlay template={template()} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext }))

    expect(screen.getByText(ctaCopy.howYouCreateStepPreview)).toBeInTheDocument()
    expect(screen.getByText('One Home-Cooked Meal')).toBeInTheDocument()
    expect(screen.getByText('One Free Pass')).toBeInTheDocument()
  })

  it('advances from Preview into Send, labeled as the recipient\'s own view, using a placeholder name and the template\'s own preview message', async () => {
    render(<HowYouCreateOverlay template={template()} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext })) // -> preview
    await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext })) // -> send (message)

    expect(screen.getByText(ctaCopy.howYouCreateRecipientBanner)).toBeInTheDocument()
    expect(screen.getByText('A gift from Your Name')).toBeInTheDocument()
    expect(
      screen.getByText('For everything you do without ever being asked — a few ways I want to take care of you now.', { exact: false })
    ).toBeInTheDocument()
  })

  it('walks message -> instructions -> a recipient-view coupon list with the redeem button -> closes on Done, never exposing a route into the real builder', async () => {
    const onClose = vi.fn()
    render(<HowYouCreateOverlay template={template()} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext })) // -> preview
    await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateNext })) // -> message
    await userEvent.click(screen.getByRole('button', { name: ctaCopy.giftMessageContinue })) // -> instructions

    expect(screen.getByText(ctaCopy.giftInstructionsHeading)).toBeInTheDocument()
    expect(screen.getByText(ctaCopy.howYouCreateRecipientBanner)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.giftOpenCoupons })) // -> recipient coupon list

    expect(screen.getByText(ctaCopy.howYouCreateRecipientBanner)).toBeInTheDocument()
    expect(screen.getByText('One Home-Cooked Meal')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: ctaCopy.recipientRedeemButton }).length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.howYouCreateDone }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes immediately from the close button on Personalize or Preview', async () => {
    const onClose = vi.fn()
    render(<HowYouCreateOverlay template={template()} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
