import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GestureFlow } from '../GestureFlow'
import { ctaCopy } from '@/constants/ctaCopy'
import type { SingleUseGesture } from '@/lib/singleUseGestures'

const saveDraftAction = vi.fn()
const sendCouponSetAction = vi.fn()
const initiateSendCheckoutAction = vi.fn()
const verifyCheckoutAction = vi.fn()
vi.mock('@/app/create/actions', () => ({
  saveDraftAction: (input: unknown) => saveDraftAction(input),
  sendCouponSetAction: (input: unknown) => sendCouponSetAction(input),
  initiateSendCheckoutAction: (slug: string, product?: string) => initiateSendCheckoutAction(slug, product),
  verifyCheckoutAction: (reference: string) => verifyCheckoutAction(reference),
}))

const resumePaystackCheckout = vi.fn()
vi.mock('@/lib/paystack/inline', () => ({
  resumePaystackCheckout: (accessCode: string, handlers: unknown) => resumePaystackCheckout(accessCode, handlers),
}))

const freeGesture: SingleUseGesture = {
  slug: 'relief',
  serviceTitle: 'Rescue Mission',
  microCopy: 'Let me take over something for you — you choose what',
  finePrint: "Redeemable whenever it's heavy",
  motif: '☁',
  price: 0,
  messageStarter: "You've had a lot on your plate lately — let me take one thing off it.",
}

const paidGesture: SingleUseGesture = {
  slug: 'celebration',
  serviceTitle: 'Night Out',
  microCopy: 'Let me take you out to celebrate — just us',
  finePrint: 'For the win nobody else noticed',
  motif: '✧',
  price: 1.99,
  messageStarter: "I've been wanting to celebrate you properly — no better excuse than tonight.",
}

const unlockCtaName = ctaCopy.gestureUnlockCta('$1.99')
const unlockConfirmCtaName = ctaCopy.gestureUnlockConfirmCta('$1.99')

async function goToPersonalize(gesture: SingleUseGesture) {
  render(<GestureFlow gesture={gesture} templateId="template-1" isLoggedIn={false} region="US" onExit={vi.fn()} />)
  await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
  await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
  await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
}

async function unlockGesture(gesture: SingleUseGesture) {
  await goToPersonalize(gesture)
  await userEvent.click(screen.getByRole('button', { name: unlockCtaName }))
  await userEvent.click(screen.getByRole('button', { name: unlockConfirmCtaName }))
}

describe('GestureFlow', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resumePaystackCheckout.mockReset().mockResolvedValue(undefined)
  })

  describe('free gesture upsell', () => {
    it('shows a "Make This Gift Yours" upsell instead of editable text fields', async () => {
      await goToPersonalize(freeGesture)

      expect(screen.getByRole('button', { name: unlockCtaName })).toBeInTheDocument()
      expect(screen.getByLabelText('Service title')).toBeDisabled()
    })

    it('opens a confirm sheet with the unlock offer when the upsell is tapped', async () => {
      await goToPersonalize(freeGesture)

      await userEvent.click(screen.getByRole('button', { name: unlockCtaName }))

      expect(screen.getByText(ctaCopy.gestureUnlockConfirmHeading)).toBeInTheDocument()
      expect(screen.getByText(ctaCopy.gestureUnlockConfirmBody)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: unlockConfirmCtaName })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: ctaCopy.gestureUnlockDismiss })).toBeInTheDocument()
    })

    it('keeps the fields locked and closes the sheet when "Keep the original wording" is tapped', async () => {
      await goToPersonalize(freeGesture)
      await userEvent.click(screen.getByRole('button', { name: unlockCtaName }))

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.gestureUnlockDismiss }))

      expect(screen.queryByText(ctaCopy.gestureUnlockConfirmHeading)).not.toBeInTheDocument()
      expect(screen.getByLabelText('Service title')).toBeDisabled()
      expect(screen.getByRole('button', { name: unlockCtaName })).toBeInTheDocument()
    })

    it('unlocks the text fields for editing once "Make It Mine" is confirmed', async () => {
      await unlockGesture(freeGesture)

      expect(screen.queryByText(ctaCopy.gestureUnlockConfirmHeading)).not.toBeInTheDocument()
      expect(screen.getByLabelText('Service title')).toBeEnabled()
      expect(screen.queryByRole('button', { name: unlockCtaName })).not.toBeInTheDocument()

      await userEvent.clear(screen.getByLabelText('Service title'))
      await userEvent.type(screen.getByLabelText('Service title'), 'A Kinder Word')
      expect(screen.getByLabelText('Service title')).toHaveValue('A Kinder Word')
    })

    // Regression coverage: micro_copy and fine_print had no input cap at all here either — see
    // MICRO_COPY_MAX_LENGTH/FINE_PRINT_MAX_LENGTH in couponSchema.ts.
    it('caps the micro copy and fine print inputs to match the schema', async () => {
      await unlockGesture(freeGesture)

      expect(screen.getByLabelText('Micro copy')).toHaveAttribute('maxlength', '80')
      expect(screen.getByLabelText('Fine print')).toHaveAttribute('maxlength', '60')
    })

    it('shows the price as $1.99 in the header once unlocked, instead of Free', async () => {
      render(<GestureFlow gesture={freeGesture} templateId="template-1" isLoggedIn={false} region="US" onExit={vi.fn()} />)
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      expect(screen.getByText('Free')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: unlockCtaName }))
      await userEvent.click(screen.getByRole('button', { name: unlockConfirmCtaName }))

      expect(screen.queryByText('Free')).not.toBeInTheDocument()
      expect(screen.getByText('$1.99')).toBeInTheDocument()
    })

    it('offers the gesture-specific message starter once unlocked', async () => {
      await unlockGesture(freeGesture)

      const envelope = screen.getByRole('button', { name: ctaCopy.editMessageWriteLabel })
      await userEvent.click(envelope)

      expect(screen.getByText(new RegExp(freeGesture.messageStarter!))).toBeInTheDocument()
    })
  })

  describe('unlock persistence', () => {
    it('keeps the unlock after a remount, as happens when Save/Send\'s auth redirect reloads the page', async () => {
      const { unmount } = render(<GestureFlow gesture={freeGesture} templateId="template-1" isLoggedIn={false} region="US" onExit={vi.fn()} />)
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
      await userEvent.click(screen.getByRole('button', { name: unlockCtaName }))
      await userEvent.click(screen.getByRole('button', { name: unlockConfirmCtaName }))
      unmount()
      // A fresh render (not unlockGesture) — this test is specifically about surviving a remount
      // without re-doing the unlock steps.
      render(<GestureFlow gesture={freeGesture} templateId="template-1" isLoggedIn={false} region="US" onExit={vi.fn()} />)

      expect(await screen.findByLabelText('Service title')).toBeEnabled()
      expect(screen.getByText('$1.99')).toBeInTheDocument()
    })
  })

  describe('a gesture that is already paid', () => {
    it('never shows the unlock upsell — its fields are editable from the start', async () => {
      await goToPersonalize(paidGesture)

      expect(screen.queryByRole('button', { name: unlockCtaName })).not.toBeInTheDocument()
      expect(screen.getByLabelText('Service title')).toBeEnabled()
      expect(screen.getByText('$1.99')).toBeInTheDocument()
    })
  })

  describe('Save/Send without an account', () => {
    it('saves a draft while logged out, with no AuthGate interruption at all', async () => {
      saveDraftAction.mockReset().mockResolvedValue({ success: true, id: 'set-1', pin: '1234' })
      await goToPersonalize(freeGesture)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.saveMyCoupons }))

      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(screen.queryByText('Almost there — save your coupons')).not.toBeInTheDocument()
      expect(saveDraftAction).toHaveBeenCalledWith(expect.objectContaining({ gesture_unlocked: false }))
    })

    it('sends an unmodified free gesture while logged out, with no AuthGate interruption at all', async () => {
      sendCouponSetAction.mockReset().mockResolvedValue({ success: true, id: 'set-1', pin: '1234' })
      await goToPersonalize(freeGesture)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))

      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(screen.queryByText('Almost there — save your coupons')).not.toBeInTheDocument()
      expect(sendCouponSetAction).toHaveBeenCalledWith(expect.objectContaining({ gesture_unlocked: false }))
    })

    it('opens AuthGate — not checkout directly — when sending a paid unlock while logged out', async () => {
      sendCouponSetAction.mockReset().mockResolvedValue({ success: false, error: 'Payment required.', paymentRequired: true })
      await unlockGesture(freeGesture)
      await userEvent.type(screen.getByLabelText('Service title'), ' (mine)')

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))

      expect(await screen.findByText('Almost there — save your coupons')).toBeInTheDocument()
      expect(initiateSendCheckoutAction).not.toHaveBeenCalled()
      expect(sendCouponSetAction).toHaveBeenCalledWith(expect.objectContaining({ gesture_unlocked: true }))
    })
  })

  describe('Save/Send with an account, paid unlock', () => {
    async function goToPersonalizeLoggedIn(gesture: SingleUseGesture) {
      render(<GestureFlow gesture={gesture} templateId="template-1" isLoggedIn={true} region="US" onExit={vi.fn()} />)
      await userEvent.type(screen.getByPlaceholderText('e.g. Alex'), 'Alex')
      await userEvent.type(screen.getByPlaceholderText('e.g. Mom'), 'Mom')
      await userEvent.click(screen.getByRole('button', { name: 'Personalise the coupons →' }))
    }

    it('opens the Paystack popup with the server-issued access code instead of navigating away', async () => {
      sendCouponSetAction.mockReset().mockResolvedValue({ success: false, error: 'Payment required.', paymentRequired: true })
      initiateSendCheckoutAction.mockReset().mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      await goToPersonalizeLoggedIn(paidGesture)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))

      await waitFor(() => expect(resumePaystackCheckout).toHaveBeenCalled())
      expect(resumePaystackCheckout).toHaveBeenCalledWith('access-code-1', expect.objectContaining({ onSuccess: expect.any(Function) }))
    })

    it('verifies the payment then resends once the popup reports success', async () => {
      sendCouponSetAction
        .mockReset()
        .mockResolvedValueOnce({ success: false, error: 'Payment required.', paymentRequired: true })
        .mockResolvedValueOnce({ success: true, id: 'set-1', pin: '1234' })
      initiateSendCheckoutAction.mockReset().mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      verifyCheckoutAction.mockReset().mockResolvedValue({ paid: true, cartSnapshot: [], amountCents: 199 })
      await goToPersonalizeLoggedIn(paidGesture)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))
      await waitFor(() => expect(resumePaystackCheckout).toHaveBeenCalled())
      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onSuccess: (r: { reference: string }) => void }
      handlers.onSuccess({ reference: 'kc_ref_1' })

      expect(await screen.findByText('Your gift is ready')).toBeInTheDocument()
      expect(verifyCheckoutAction).toHaveBeenCalledWith('kc_ref_1')
      expect(sendCouponSetAction).toHaveBeenCalledTimes(2)
    })

    it('shows a payment-incomplete error instead of resending when the popup reports success but verification says unpaid', async () => {
      sendCouponSetAction.mockReset().mockResolvedValue({ success: false, error: 'Payment required.', paymentRequired: true })
      initiateSendCheckoutAction.mockReset().mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      verifyCheckoutAction.mockReset().mockResolvedValue({ paid: false })
      await goToPersonalizeLoggedIn(paidGesture)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))
      await waitFor(() => expect(resumePaystackCheckout).toHaveBeenCalled())
      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onSuccess: (r: { reference: string }) => void }
      handlers.onSuccess({ reference: 'kc_ref_1' })

      expect(await screen.findByText("Your payment wasn't completed, so this wasn't sent. Feel free to try again.")).toBeInTheDocument()
      expect(sendCouponSetAction).toHaveBeenCalledTimes(1)
    })

    it('stops without an error when the visitor closes the popup', async () => {
      sendCouponSetAction.mockReset().mockResolvedValue({ success: false, error: 'Payment required.', paymentRequired: true })
      initiateSendCheckoutAction.mockReset().mockResolvedValue({ success: true, accessCode: 'access-code-1' })
      await goToPersonalizeLoggedIn(paidGesture)

      await userEvent.click(screen.getByRole('button', { name: ctaCopy.sendWithLove }))
      await waitFor(() => expect(resumePaystackCheckout).toHaveBeenCalled())
      const handlers = resumePaystackCheckout.mock.calls[0][1] as { onCancel: () => void }
      handlers.onCancel()

      expect(await screen.findByRole('button', { name: ctaCopy.sendWithLove })).toBeInTheDocument()
      expect(sendCouponSetAction).toHaveBeenCalledTimes(1)
    })
  })
})
