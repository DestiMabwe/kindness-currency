import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartView } from '../CartView'
import { addToCart } from '@/lib/cart'
import { ctaCopy } from '@/constants/ctaCopy'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const initiateCartCheckoutAction = vi.fn()
vi.mock('@/app/cart/actions', () => ({
  initiateCartCheckoutAction: (items: unknown) => initiateCartCheckoutAction(items),
}))

const resumePaystackCheckout = vi.fn()
vi.mock('@/lib/paystack/inline', () => ({
  resumePaystackCheckout: (accessCode: string, handlers: unknown) => resumePaystackCheckout(accessCode, handlers),
}))

describe('CartView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    push.mockReset()
    initiateCartCheckoutAction.mockReset()
    resumePaystackCheckout.mockReset().mockResolvedValue(undefined)
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

  it('does not count a one-time gesture toward 3-for-2, even though it brings total units to 3', () => {
    addToCart('mothers_day', 1) // $2.99
    addToCart('birthday', 1) // $2.99 — only 2 coupon-book units so far
    addToCart('celebration', 1) // $1.99 gesture — would be "cheapest" and hit 3 total units under the old bug
    render(<CartView isLoggedIn={true} region="US" />)

    expect(screen.getByText(ctaCopy.cartAlmostThreeForTwo(1))).toBeInTheDocument()
    expect(screen.queryByText('3-for-2 discount')).not.toBeInTheDocument()
    expect(screen.getAllByText('$1.99').length).toBeGreaterThan(0)
  })

  it('renders the same cart in Rand for a South African visitor instead of dollars', () => {
    addToCart('mothers_day', 1)
    render(<CartView isLoggedIn={true} region="ZA" />)

    expect(screen.getAllByText('R19.99').length).toBeGreaterThan(0)
    expect(screen.queryByText('$2.99')).not.toBeInTheDocument()
  })

  describe('checkout', () => {
    beforeEach(() => {
      addToCart('mothers_day', 1)
    })

    it('opens the Paystack popup with the server-issued access code instead of navigating away', async () => {
      initiateCartCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      render(<CartView isLoggedIn={true} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartPayCta('$2.99') }))

      expect(resumePaystackCheckout).toHaveBeenCalledWith('access-code-1', expect.objectContaining({ onSuccess: expect.any(Function) }))
    })

    it('navigates to /cart/complete with the reference once the popup reports success', async () => {
      initiateCartCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      render(<CartView isLoggedIn={true} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartPayCta('$2.99') }))

      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onSuccess: (r: { reference: string }) => void }
      handlers.onSuccess({ reference: 'kc_ref_1' })

      expect(push).toHaveBeenCalledWith('/cart/complete?reference=kc_ref_1')
    })

    it('stops paying without an error when the visitor closes the popup', async () => {
      initiateCartCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      render(<CartView isLoggedIn={true} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartPayCta('$2.99') }))

      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onCancel: () => void }
      handlers.onCancel()

      expect(push).not.toHaveBeenCalled()
      await waitFor(() => expect(screen.getByRole('button', { name: ctaCopy.cartPayCta('$2.99') })).not.toBeDisabled())
    })
  })
})
