import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CartCompleteView } from '../CartCompleteView'
import { ctaCopy } from '@/constants/ctaCopy'

describe('CartCompleteView', () => {
  it('sends a successful payer on to Your Gifts, not back into /create, to see everything they own', () => {
    render(
      <CartCompleteView
        result={{ paid: true, cartSnapshot: [{ slug: 'mothers_day', qty: 1 }], amountCents: 1999 }}
        instances={[{ id: 'p1', slug: 'mothers_day' }]}
        region="US"
      />
    )

    const link = screen.getByRole('link', { name: ctaCopy.cartSeeMyGiftsCta })
    expect(link).toHaveAttribute('href', '/profile')
  })

  it('sends a failed payment back to the cart instead', () => {
    render(<CartCompleteView result={{ paid: false }} instances={[]} region="US" />)

    expect(screen.getByRole('link', { name: ctaCopy.cartPaymentFailedCta })).toHaveAttribute('href', '/cart')
  })
})
