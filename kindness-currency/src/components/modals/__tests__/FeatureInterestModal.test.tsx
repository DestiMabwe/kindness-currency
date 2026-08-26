import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureInterestModal } from '../FeatureInterestModal'

const recordFeatureInterestAction = vi.fn()
vi.mock('@/app/feature-interest/actions', () => ({
  recordFeatureInterestAction: (input: unknown) => recordFeatureInterestAction(input),
}))

beforeEach(() => {
  recordFeatureInterestAction.mockReset()
})

describe('FeatureInterestModal', () => {
  describe('logged-out (no userEmail)', () => {
    it('shows an email input and records the correct feature tag on submit', async () => {
      recordFeatureInterestAction.mockResolvedValue({ success: true })
      render(<FeatureInterestModal feature="custom_coupons" userEmail={null} onClose={vi.fn()} />)

      await userEvent.type(screen.getByLabelText('Email address'), 'jamie@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Notify Me' }))

      expect(recordFeatureInterestAction).toHaveBeenCalledWith({ feature: 'custom_coupons', email: 'jamie@example.com' })
      expect(await screen.findByText("You're on the list ♥")).toBeInTheDocument()
    })

    it('shows an inline error and does not submit for an invalid email', async () => {
      render(<FeatureInterestModal feature="custom_coupons" userEmail={null} onClose={vi.fn()} />)

      await userEvent.type(screen.getByLabelText('Email address'), 'not-an-email')
      await userEvent.click(screen.getByRole('button', { name: 'Notify Me' }))

      expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i)
      expect(recordFeatureInterestAction).not.toHaveBeenCalled()
    })
  })

  describe('logged-in (userEmail provided)', () => {
    it('shows a one-click button using the account email, no input required', async () => {
      recordFeatureInterestAction.mockResolvedValue({ success: true })
      render(<FeatureInterestModal feature="custom_coupons" userEmail="alex@example.com" onClose={vi.fn()} />)

      expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /Notify Me/ }))

      expect(recordFeatureInterestAction).toHaveBeenCalledWith({ feature: 'custom_coupons', email: 'alex@example.com' })
      expect(await screen.findByText("You're on the list ♥")).toBeInTheDocument()
    })
  })

  describe('closing', () => {
    it('calls onClose when "Not now" is clicked', async () => {
      const onClose = vi.fn()
      render(<FeatureInterestModal feature="custom_coupons" userEmail={null} onClose={onClose} />)

      await userEvent.click(screen.getByRole('button', { name: 'Not now' }))

      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})
