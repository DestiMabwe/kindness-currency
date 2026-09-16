import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartView } from '../CartView'
import { addToCart } from '@/lib/cart'
import { ctaCopy } from '@/constants/ctaCopy'

describe('CartView', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("decrements a line's quantity via its stepper, and removes the line entirely once it reaches 0", async () => {
    addToCart('mothers_day', 1)
    render(<CartView isLoggedIn={true} region="US" />)

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.qtyDecreaseLabel("Mom's Promise Tokens") }))

    expect(screen.queryByText("Mom's Promise Tokens")).not.toBeInTheDocument()
    expect(screen.getByText(ctaCopy.cartEmptyMessage)).toBeInTheDocument()
  })

  it('splits a discounted line with qty > 1 into "qty × price" plus a separate FREE sub-line', () => {
    addToCart('mothers_day', 2) // $2.99 each — the cheapest unit once a 3rd is added
    addToCart('lovers', 1) // $6.99 — brings total units to 3, triggering the discount
    render(<CartView isLoggedIn={true} region="US" />)

    expect(screen.getByText("Mom's Promise Tokens × 2")).toBeInTheDocument()
    expect(screen.getByText('$5.98')).toBeInTheDocument()
    expect(screen.getByText('1 unit FREE (3-for-2) −$2.99')).toBeInTheDocument()
  })

  it('renders the same cart in Rand for a South African visitor instead of dollars', () => {
    addToCart('mothers_day', 1)
    render(<CartView isLoggedIn={true} region="ZA" />)

    expect(screen.getAllByText('R19.99').length).toBeGreaterThan(0)
    expect(screen.queryByText('$2.99')).not.toBeInTheDocument()
  })
})
