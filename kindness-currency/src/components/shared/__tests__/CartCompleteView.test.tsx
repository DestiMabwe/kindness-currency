import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CartCompleteView } from '../CartCompleteView'
import { ctaCopy } from '@/constants/ctaCopy'

describe('CartCompleteView', () => {
  it('sends a successful payer on to Your Gifts, not back into /create, to see everything they own', () => {
    render(
      <CartCompleteView
        result={{ paid: true, cartSnapshot: [{ slug: 'mothers_day', qty: 1 }], amountCents: 1999 }}
        region="US"
      />
    )

    const link = screen.getByRole('link', { name: ctaCopy.cartSeeMyGiftsCta })
    expect(link).toHaveAttribute('href', '/profile')
  })

  it('sends a failed payment back to the cart instead', () => {
    render(<CartCompleteView result={{ paid: false }} region="US" />)

    expect(screen.getByRole('link', { name: ctaCopy.cartPaymentFailedCta })).toHaveAttribute('href', '/cart')
  })

  // Regression coverage: this used to show the sender's entire backlog of unconsumed instances
  // (everything ever bought and not yet personalized), not just what this specific order paid
  // for — misrepresenting an old purchase as part of today's confirmation.
  it("shows exactly what this order's own cart_snapshot paid for, not any other pending purchase", () => {
    render(
      <CartCompleteView
        result={{
          paid: true,
          cartSnapshot: [
            { slug: 'mothers_day', qty: 1 },
            { slug: 'birthday', qty: 2 },
          ],
          amountCents: 8997,
        }}
        region="US"
      />
    )

    expect(screen.getByText("Mom's Promise Tokens")).toBeInTheDocument()
    expect(screen.getByText('Birthday Joy Tokens')).toBeInTheDocument()
    expect(screen.getByText('× 2')).toBeInTheDocument()
    expect(screen.queryByText("Requested By Him: Lover's Wishes")).not.toBeInTheDocument()
  })

  it('shows the real amount actually charged, in ZAR, regardless of the display region', () => {
    render(
      <CartCompleteView
        result={{ paid: true, cartSnapshot: [{ slug: 'mothers_day', qty: 1 }], amountCents: 1999 }}
        region="US"
      />
    )

    expect(screen.getByText(ctaCopy.cartDoneTotalLabel)).toBeInTheDocument()
    expect(screen.getByText('R19.99')).toBeInTheDocument()
  })

  it('offers a direct shortcut into personalizing the first purchased coupon book', () => {
    render(
      <CartCompleteView
        result={{
          paid: true,
          cartSnapshot: [
            { slug: 'mothers_day', qty: 1 },
            { slug: 'birthday', qty: 1 },
          ],
          amountCents: 3998,
        }}
        region="US"
      />
    )

    const link = screen.getByRole('link', { name: ctaCopy.cartDonePersonalizeFirstCta("Mom's Promise Tokens") })
    expect(link).toHaveAttribute('href', '/create?template=mothers_day')
  })
})
