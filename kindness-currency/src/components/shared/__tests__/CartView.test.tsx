import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartView } from '../CartView'
import { addToCart, readPendingDiscountCode, savePendingDiscountCode } from '@/lib/cart'
import { ctaCopy } from '@/constants/ctaCopy'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const initiateCartCheckoutAction = vi.fn()
const previewDiscountCodeAction = vi.fn()
vi.mock('@/app/cart/actions', () => ({
  // Forward the code only when there is one, so existing assertions on a plain checkout stay exact.
  initiateCartCheckoutAction: (items: unknown, code?: string) =>
    code === undefined ? initiateCartCheckoutAction(items) : initiateCartCheckoutAction(items, code),
  previewDiscountCodeAction: (code: string) => previewDiscountCodeAction(code),
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
    previewDiscountCodeAction.mockReset()
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

  it('discloses the ZAR charge, with the exact amount, to a visitor who sees dollars', () => {
    addToCart('mothers_day', 1) // $2.99 displayed, R54.99 charged
    render(<CartView isLoggedIn={true} region="US" />)

    expect(screen.getAllByText(ctaCopy.chargeCurrencyNote('R54.99')).length).toBeGreaterThan(0)
  })

  it('shows the ZAR amount on the pay button for a non-South-African visitor, since that is what is charged', async () => {
    addToCart('mothers_day', 1)
    render(<CartView isLoggedIn={true} region="UK" />)

    await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))

    expect(screen.getByRole('button', { name: ctaCopy.cartPayCta('R54.99') })).toBeInTheDocument()
  })

  it('shows no currency note to a South African visitor, who is already shown the rand charge', () => {
    addToCart('mothers_day', 1)
    render(<CartView isLoggedIn={true} region="ZA" />)

    expect(screen.queryByText(/charged .* in South African rand/)).not.toBeInTheDocument()
  })

  it('tells the buyer one-time gestures do not count toward 3-for-2 only when the cart holds gestures', () => {
    addToCart('mothers_day', 1)
    const { unmount } = render(<CartView isLoggedIn={true} region="US" />)
    expect(screen.queryByText(ctaCopy.cartGesturesExcludedNote)).not.toBeInTheDocument()
    unmount()

    addToCart('celebration', 1) // a $1.99 one-time gesture
    render(<CartView isLoggedIn={true} region="US" />)
    expect(screen.getByText(ctaCopy.cartGesturesExcludedNote)).toBeInTheDocument()
  })

  describe('checkout', () => {
    beforeEach(() => {
      addToCart('mothers_day', 1)
    })

    it('warns a logged-out buyer about the sign-in step before they reach Pay, but not a logged-in one', async () => {
      const { unmount } = render(<CartView isLoggedIn={false} region="US" />)
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
      expect(screen.getByText(ctaCopy.cartCheckoutSignInNote)).toBeInTheDocument()
      unmount()

      render(<CartView isLoggedIn={true} region="US" />)
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
      expect(screen.queryByText(ctaCopy.cartCheckoutSignInNote)).not.toBeInTheDocument()
    })

    it('opens the Paystack popup with the server-issued access code instead of navigating away', async () => {
      initiateCartCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      render(<CartView isLoggedIn={true} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartPayCta('R54.99') }))

      expect(resumePaystackCheckout).toHaveBeenCalledWith('access-code-1', expect.objectContaining({ onSuccess: expect.any(Function) }))
    })

    it('navigates to /cart/complete with the reference once the popup reports success', async () => {
      initiateCartCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      render(<CartView isLoggedIn={true} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartPayCta('R54.99') }))

      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onSuccess: (r: { reference: string }) => void }
      handlers.onSuccess({ reference: 'kc_ref_1' })

      expect(push).toHaveBeenCalledWith('/cart/complete?reference=kc_ref_1')
    })

    it('stops paying without an error when the visitor closes the popup', async () => {
      initiateCartCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      render(<CartView isLoggedIn={true} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartPayCta('R54.99') }))

      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onCancel: () => void }
      handlers.onCancel()

      expect(push).not.toHaveBeenCalled()
      await waitFor(() => expect(screen.getByRole('button', { name: ctaCopy.cartPayCta('R54.99') })).not.toBeDisabled())
    })
  })
  describe('after a sign-in link failed', () => {
    afterEach(() => {
      window.history.pushState({}, '', '/')
    })

    it('tells a visitor the link failed, even with an empty cart, and strips the flag from the URL', () => {
      window.history.pushState({}, '', '/cart?authError=1')
      render(<CartView isLoggedIn={false} region="US" />)

      expect(screen.getByText(ctaCopy.authLinkFailedBannerText)).toBeInTheDocument()
      expect(window.location.search).toBe('')
    })

    it('reopens sign-in from the banner, explaining what happened when this browser never started it', async () => {
      window.history.pushState({}, '', '/cart?authError=1')
      render(<CartView isLoggedIn={false} region="US" />)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.authLinkFailedRetryButton }))

      expect(await screen.findByRole('status', {}, { timeout: 5000 })).toHaveTextContent(ctaCopy.authModalResumeNoticeNoEmail)
      expect(screen.queryByText(ctaCopy.authLinkFailedBannerText)).not.toBeInTheDocument()
    })

    it('shows nothing extra on a plain visit', () => {
      render(<CartView isLoggedIn={false} region="US" />)

      expect(screen.queryByText(ctaCopy.authLinkFailedBannerText)).not.toBeInTheDocument()
    })
  })

  describe('discount codes', () => {
    async function openCheckout() {
      addToCart('mothers_day', 1) // R19.99 for a South African visitor
      render(<CartView isLoggedIn={true} region="ZA" />)
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
    }

    it('shows the discount line and the reduced total once a valid code is applied', async () => {
      previewDiscountCodeAction.mockResolvedValue({ success: true, code: 'HALF', percentOff: 50 })
      await openCheckout()

      await userEvent.type(screen.getByLabelText(ctaCopy.cartCodeLabel), 'half')
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeApply }))

      expect(await screen.findByText(ctaCopy.cartCodeAppliedLine('HALF', 50))).toBeInTheDocument()
      expect(previewDiscountCodeAction).toHaveBeenCalledWith('half')
      expect(screen.getByRole('button', { name: ctaCopy.cartPayCta('R9.99') })).toBeInTheDocument()
    })

    describe('surviving login', () => {
      it('remembers a code typed while logged out, and opens sign-in instead of applying it', async () => {
        addToCart('mothers_day', 1)
        render(<CartView isLoggedIn={false} region="ZA" />)
        await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))

        await userEvent.type(screen.getByLabelText(ctaCopy.cartCodeLabel), 'WELCOME10')
        await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeApply }))

        expect(await screen.findByRole('dialog', {}, { timeout: 5000 })).toBeInTheDocument()
        expect(readPendingDiscountCode()).toBe('WELCOME10')
        expect(previewDiscountCodeAction).not.toHaveBeenCalled()
      })

      it('lands a logged-in buyer back on checkout with their remembered code already applied', async () => {
        previewDiscountCodeAction.mockResolvedValue({ success: true, code: 'WELCOME10', percentOff: 10 })
        addToCart('mothers_day', 1)
        savePendingDiscountCode('WELCOME10')

        render(<CartView isLoggedIn={true} region="ZA" />)

        expect(await screen.findByText(ctaCopy.cartCodeAppliedLine('WELCOME10', 10))).toBeInTheDocument()
        expect(previewDiscountCodeAction).toHaveBeenCalledWith('WELCOME10')
        expect(readPendingDiscountCode()).toBeNull()
        expect(initiateCartCheckoutAction).not.toHaveBeenCalled()
        expect(resumePaystackCheckout).not.toHaveBeenCalled()
      })

      it('keeps a remembered code that turns out to be invalid in the field with the reason, so it can be fixed', async () => {
        previewDiscountCodeAction.mockResolvedValue({ success: false, error: 'That code has expired.' })
        addToCart('mothers_day', 1)
        savePendingDiscountCode('OLDCODE')

        render(<CartView isLoggedIn={true} region="ZA" />)

        expect(await screen.findByRole('alert')).toHaveTextContent('That code has expired.')
        expect(screen.getByLabelText(ctaCopy.cartCodeLabel)).toHaveValue('OLDCODE')
        expect(readPendingDiscountCode()).toBeNull()
      })

      it('applies the remembered code in the same tab when the buyer becomes logged in without a reload', async () => {
        previewDiscountCodeAction.mockResolvedValue({ success: true, code: 'WELCOME10', percentOff: 10 })
        addToCart('mothers_day', 1)
        const { rerender } = render(<CartView isLoggedIn={false} region="ZA" />)
        await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta }))
        await userEvent.type(screen.getByLabelText(ctaCopy.cartCodeLabel), 'WELCOME10')
        await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeApply }))

        rerender(<CartView isLoggedIn={true} region="ZA" />)

        expect(await screen.findByText(ctaCopy.cartCodeAppliedLine('WELCOME10', 10))).toBeInTheDocument()
      })

      it('does nothing special for a logged-in buyer with no remembered code', async () => {
        addToCart('mothers_day', 1)

        render(<CartView isLoggedIn={true} region="ZA" />)

        expect(screen.getByRole('button', { name: ctaCopy.cartCheckoutCta })).toBeInTheDocument()
        expect(previewDiscountCodeAction).not.toHaveBeenCalled()
      })
    })

    it('shows the refusal reason and keeps the full price when a code is rejected', async () => {
      previewDiscountCodeAction.mockResolvedValue({ success: false, error: 'That code has expired.' })
      await openCheckout()

      await userEvent.type(screen.getByLabelText(ctaCopy.cartCodeLabel), 'old')
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeApply }))

      expect(await screen.findByRole('alert')).toHaveTextContent('That code has expired.')
      expect(screen.getByRole('button', { name: ctaCopy.cartPayCta('R19.99') })).toBeInTheDocument()
    })

    it('lets the buyer remove an applied code and go back to the full price', async () => {
      previewDiscountCodeAction.mockResolvedValue({ success: true, code: 'HALF', percentOff: 50 })
      await openCheckout()
      await userEvent.type(screen.getByLabelText(ctaCopy.cartCodeLabel), 'half')
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeApply }))
      await screen.findByText(ctaCopy.cartCodeAppliedLine('HALF', 50))

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeRemove }))

      expect(screen.getByRole('button', { name: ctaCopy.cartPayCta('R19.99') })).toBeInTheDocument()
    })

    it('sends the applied code with checkout and opens the payment window for a partial discount', async () => {
      previewDiscountCodeAction.mockResolvedValue({ success: true, code: 'HALF', percentOff: 50 })
      initiateCartCheckoutAction.mockResolvedValue({ success: true, accessCode: 'access-1' })
      await openCheckout()
      await userEvent.type(screen.getByLabelText(ctaCopy.cartCodeLabel), 'half')
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeApply }))
      await screen.findByText(ctaCopy.cartCodeAppliedLine('HALF', 50))

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartPayCta('R9.99') }))

      await waitFor(() => expect(resumePaystackCheckout).toHaveBeenCalledWith('access-1', expect.anything()))
      expect(initiateCartCheckoutAction).toHaveBeenCalledWith([{ slug: 'mothers_day', qty: 1 }], 'HALF')
    })

    it('offers a free claim for a 100% code and goes straight to the confirmation, skipping Paystack', async () => {
      previewDiscountCodeAction.mockResolvedValue({ success: true, code: 'TESTER', percentOff: 100 })
      initiateCartCheckoutAction.mockResolvedValue({ success: true, free: true, reference: 'kc_free_1' })
      await openCheckout()
      await userEvent.type(screen.getByLabelText(ctaCopy.cartCodeLabel), 'tester')
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeApply }))

      await userEvent.click(await screen.findByRole('button', { name: ctaCopy.cartFreeCta }))

      await waitFor(() => expect(push).toHaveBeenCalledWith('/cart/complete?reference=kc_free_1'))
      expect(resumePaystackCheckout).not.toHaveBeenCalled()
    })

    it('shows the checkout error when the code stops working between preview and pay', async () => {
      previewDiscountCodeAction.mockResolvedValue({ success: true, code: 'TESTER', percentOff: 100 })
      initiateCartCheckoutAction.mockResolvedValue({ success: false, error: 'That code has been fully used.' })
      await openCheckout()
      await userEvent.type(screen.getByLabelText(ctaCopy.cartCodeLabel), 'tester')
      await userEvent.click(screen.getByRole('button', { name: ctaCopy.cartCodeApply }))

      await userEvent.click(await screen.findByRole('button', { name: ctaCopy.cartFreeCta }))

      expect(await screen.findByText('That code has been fully used.')).toBeInTheDocument()
      expect(push).not.toHaveBeenCalled()
    })
  })
})
