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

  it('shows a grouped count for multiple unconsumed instances of the same coupon book, never as separate rows', () => {
    render(<ProfileCartSection region="US" pendingPersonalizations={[{ slug: 'birthday', count: 3 }]} />)

    expect(screen.getByText('Birthday Joy Tokens')).toBeInTheDocument()
    expect(screen.getByText('× 3')).toBeInTheDocument()
  })

  it('does not show a count badge for a single unconsumed instance', () => {
    render(<ProfileCartSection region="US" pendingPersonalizations={[{ slug: 'mothers_day', count: 1 }]} />)

    expect(screen.getByText("Mom's Promise Tokens")).toBeInTheDocument()
    expect(screen.queryByText('× 1')).not.toBeInTheDocument()
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
    expect(screen.getByText('Birthday Joy Tokens')).toBeInTheDocument()
    expect(screen.getByText('× 2')).toBeInTheDocument()
  })

  it('puts "Ready to personalize" before the cart preview — it is the more actionable, time-sensitive item', () => {
    addToCart('birthday', 1)
    render(<ProfileCartSection region="US" pendingPersonalizations={[{ slug: 'mothers_day', count: 1 }]} />)

    const readyHeading = screen.getByText('Ready to personalize')
    const cartHeading = screen.getByText(/Your Cart/)
    expect(readyHeading.compareDocumentPosition(cartHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
