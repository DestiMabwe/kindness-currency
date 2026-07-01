import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CouponCardMini } from '../CouponCardMini'
import { templateVisuals } from '@/constants/designTokens'

describe('CouponCardMini', () => {
  it('renders the title and "GOOD FOR" label', () => {
    render(<CouponCardMini title="One Long Bath Together" accent="#C2185B" motif="❦" />)
    expect(screen.getByText('One Long Bath Together')).toBeInTheDocument()
    expect(screen.getByText('GOOD FOR')).toBeInTheDocument()
  })

  it.each(Object.entries(templateVisuals))('renders %s with its own motif and border colour', (_slug, visuals) => {
    const { container } = render(<CouponCardMini title="A promise" accent={visuals.accent} motif={visuals.motif} />)

    expect(screen.getByText(visuals.motif)).toBeInTheDocument()
    const card = container.firstElementChild as HTMLElement
    expect(card.style.getPropertyValue('border-color')).toBeTruthy()
  })
})
