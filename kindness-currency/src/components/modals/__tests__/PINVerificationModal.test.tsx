import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PINVerificationModal } from '../PINVerificationModal'

describe('PINVerificationModal', () => {
  describe('rendering', () => {
    it('renders the warm confirmation prompt referencing the coupon title', () => {
      render(<PINVerificationModal couponTitle="One Massage" recipientName="Maya" onVerify={vi.fn()} onClose={vi.fn()} />)
      expect(screen.getByText('Redeem this right now?')).toBeInTheDocument()
      expect(screen.getByText(/One Massage/)).toBeInTheDocument()
    })

    it('asks the sender for the PIN the recipient gave them', () => {
      render(<PINVerificationModal couponTitle="One Massage" recipientName="Maya" onVerify={vi.fn()} onClose={vi.fn()} />)
      expect(screen.getByText('Enter the 4-digit PIN Maya gave you')).toBeInTheDocument()
    })
  })

  describe('wrong PIN', () => {
    it('shows the soft error message referencing the recipient on wrong PIN', async () => {
      const onVerify = vi.fn().mockResolvedValue(false)
      render(<PINVerificationModal couponTitle="One Massage" recipientName="Maya" onVerify={onVerify} onClose={vi.fn()} />)

      await userEvent.type(screen.getByLabelText('4-digit PIN'), '9999')
      await userEvent.click(screen.getByRole('button', { name: 'Yes, redeem with love ♥' }))

      expect(await screen.findByText("That PIN doesn't match or has expired. Ask Maya to generate a new one.")).toBeInTheDocument()
    })

    it('does not fire onClose on wrong PIN', async () => {
      const onVerify = vi.fn().mockResolvedValue(false)
      const onClose = vi.fn()
      render(<PINVerificationModal couponTitle="One Massage" recipientName="Maya" onVerify={onVerify} onClose={onClose} />)

      await userEvent.type(screen.getByLabelText('4-digit PIN'), '9999')
      await userEvent.click(screen.getByRole('button', { name: 'Yes, redeem with love ♥' }))
      await screen.findByText(/doesn't match/)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('correct PIN', () => {
    it('fires the onVerify callback with the entered PIN', async () => {
      const onVerify = vi.fn().mockResolvedValue(true)
      render(<PINVerificationModal couponTitle="One Massage" recipientName="Maya" onVerify={onVerify} onClose={vi.fn()} />)

      await userEvent.type(screen.getByLabelText('4-digit PIN'), '1234')
      await userEvent.click(screen.getByRole('button', { name: 'Yes, redeem with love ♥' }))

      expect(onVerify).toHaveBeenCalledWith('1234')
    })

    it('does not show an error message on correct PIN', async () => {
      const onVerify = vi.fn().mockResolvedValue(true)
      render(<PINVerificationModal couponTitle="One Massage" recipientName="Maya" onVerify={onVerify} onClose={vi.fn()} />)

      await userEvent.type(screen.getByLabelText('4-digit PIN'), '1234')
      await userEvent.click(screen.getByRole('button', { name: 'Yes, redeem with love ♥' }))

      expect(screen.queryByText(/doesn't match/)).not.toBeInTheDocument()
    })
  })
})
