import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewOverlay } from '../PreviewOverlay'
import type { BuilderCoupon } from '@/hooks/useCouponSetBuilder'

const coupon = (overrides: Partial<BuilderCoupon> = {}): BuilderCoupon => ({
  id: 'c1',
  sortOrder: 1,
  serviceTitle: 'One Massage',
  microCopy: 'Full focus',
  finePrint: '',
  fontChoice: 'playfair',
  backgroundColor: '#FFF8F0',
  backgroundEffect: 'none',
  ...overrides,
})

describe('PreviewOverlay', () => {
  describe('without recipientPreview (generic template-sample preview)', () => {
    it('goes straight to the coupon list, with no message popup', () => {
      render(
        <PreviewOverlay coupons={[coupon()]} accent="#C2185B" motif="♥" imageSrc={null} expiresAt={null} onClose={vi.fn()} />
      )

      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('One Massage')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('with recipientPreview (the sender previewing their own set)', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    const renderWithMessage = (senderMessage: string | null, onClose = vi.fn()) =>
      render(
        <PreviewOverlay
          coupons={[coupon()]}
          accent="#C2185B"
          motif="♥"
          imageSrc={null}
          expiresAt={null}
          onClose={onClose}
          recipientPreview={{ senderName: 'Alex', senderMessage }}
        />
      )

    it('opens on the coupon list, then unseals the message over it shortly after, matching the real recipient flow', () => {
      vi.useFakeTimers()
      renderWithMessage('Thinking of you every day.')

      expect(screen.getByText('One Massage')).toBeInTheDocument()
      expect(screen.queryByText('A gift from Alex')).not.toBeInTheDocument()

      act(() => vi.advanceTimersByTime(1500))

      expect(screen.getByRole('dialog', { name: 'A gift from Alex' })).toBeInTheDocument()
      expect(screen.getByText('One Massage')).toBeInTheDocument()
    })

    it('never shows a message popup when no message was written', () => {
      vi.useFakeTimers()
      renderWithMessage(null)

      act(() => vi.advanceTimersByTime(5000))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText('One Massage')).toBeInTheDocument()
    })

    it('lets the sender close out of the preview', async () => {
      const onClose = vi.fn()
      renderWithMessage('Thinking of you every day.', onClose)

      await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))

      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})
