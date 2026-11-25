import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfileCartSection } from '../ProfileCartSection'
import { addToCart } from '@/lib/cart'

describe('ProfileCartSection', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders nothing when there is no cart, no pending personalization, and no order history', () => {
    const { container } = render(<ProfileCartSection region="US" pendingPersonalizations={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('lists several unconsumed instances of the same coupon book as separate numbered rows, each deep-linking to its own gift', () => {
    render(<ProfileCartSection region="US" pendingPersonalizations={[{ slug: 'birthday', count: 3 }]} />)

    expect(screen.getByRole('link', { name: /Birthday Joy Tokens \(Gift 1 of 3\)/ })).toHaveAttribute('href', '/create?template=birthday&gift=1')
    expect(screen.getByRole('link', { name: /Birthday Joy Tokens \(Gift 2 of 3\)/ })).toHaveAttribute('href', '/create?template=birthday&gift=2')
    expect(screen.getByRole('link', { name: /Birthday Joy Tokens \(Gift 3 of 3\)/ })).toHaveAttribute('href', '/create?template=birthday&gift=3')
    expect(screen.queryByText('× 3')).not.toBeInTheDocument()
  })

  it('shows no gift number for a single unconsumed instance', () => {
    render(<ProfileCartSection region="US" pendingPersonalizations={[{ slug: 'mothers_day', count: 1 }]} />)

    expect(screen.getByText("Mom's Promise Tokens")).toBeInTheDocument()
    expect(screen.queryByText(/Gift 1 of/)).not.toBeInTheDocument()
  })

  it('deep-links "Personalize" straight into the specific purchased coupon book', () => {
    render(<ProfileCartSection region="US" pendingPersonalizations={[{ slug: 'mothers_day', count: 1 }]} />)

    expect(screen.getByRole('link', { name: /Mom's Promise Tokens/ })).toHaveAttribute('href', '/create?template=mothers_day')
  })

  it('lists every distinct purchased coupon book that still needs personalizing', () => {
    render(
      <ProfileCartSection
        region="US"
        pendingPersonalizations={[
          { slug: 'mothers_day', count: 1 },
          { slug: 'birthday', count: 2 },
        ]}
      />
    )

    expect(screen.getByText("Mom's Promise Tokens")).toBeInTheDocument()
    expect(screen.getByText('Birthday Joy Tokens (Gift 1 of 2)')).toBeInTheDocument()
    expect(screen.getByText('Birthday Joy Tokens (Gift 2 of 2)')).toBeInTheDocument()
  })

  it('puts "Ready to personalize" before the cart preview — it is the more actionable, time-sensitive item', () => {
    addToCart('birthday', 1)
    render(<ProfileCartSection region="US" pendingPersonalizations={[{ slug: 'mothers_day', count: 1 }]} />)

    const readyHeading = screen.getByText('Ready to personalize')
    const cartHeading = screen.getByText(/Your Cart/)
    expect(readyHeading.compareDocumentPosition(cartHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
