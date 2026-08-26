import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    it('goes straight to the coupon list, with no message or instructions step', () => {
      render(
        <PreviewOverlay coupons={[coupon()]} accent="#C2185B" motif="♥" imageSrc={null} expiresAt={null} onClose={vi.fn()} />
      )

      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('One Massage')).toBeInTheDocument()
      expect(screen.queryByText('How Kindness Currency Works')).not.toBeInTheDocument()
    })
  })

  describe('with recipientPreview (the sender previewing their own set)', () => {
    it('shows the message screen first when a message was written', () => {
      render(
        <PreviewOverlay
          coupons={[coupon()]}
          accent="#C2185B"
          motif="♥"
          imageSrc={null}
          expiresAt={null}
          onClose={vi.fn()}
          recipientPreview={{ senderName: 'Alex', senderMessage: 'Thinking of you every day.' }}
        />
      )

      expect(screen.getByText('A gift from Alex')).toBeInTheDocument()
      expect(screen.queryByText('One Massage')).not.toBeInTheDocument()
    })

    it('skips straight to the instructions screen when no message was written', () => {
      render(
        <PreviewOverlay
          coupons={[coupon()]}
          accent="#C2185B"
          motif="♥"
          imageSrc={null}
          expiresAt={null}
          onClose={vi.fn()}
          recipientPreview={{ senderName: 'Alex', senderMessage: null }}
        />
      )

      expect(screen.getByText('How Kindness Currency Works')).toBeInTheDocument()
    })

    it('walks message → instructions → coupon list, matching the real recipient flow', async () => {
      render(
        <PreviewOverlay
          coupons={[coupon()]}
          accent="#C2185B"
          motif="♥"
          imageSrc={null}
          expiresAt={null}
          onClose={vi.fn()}
          recipientPreview={{ senderName: 'Alex', senderMessage: 'Thinking of you every day.' }}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      expect(screen.getByText('How Kindness Currency Works')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Open Your Coupons' }))
      expect(screen.getByText('One Massage')).toBeInTheDocument()
    })

    it('lets the sender close out of the preview from the message step', async () => {
      const onClose = vi.fn()
      render(
        <PreviewOverlay
          coupons={[coupon()]}
          accent="#C2185B"
          motif="♥"
          imageSrc={null}
          expiresAt={null}
          onClose={onClose}
          recipientPreview={{ senderName: 'Alex', senderMessage: 'Thinking of you every day.' }}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: 'Close preview' }))

      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('capped sample preview (existing behavior, unaffected)', () => {
    it('caps visible coupons and offers a "view all" CTA', () => {
      const onViewAll = vi.fn()
      render(
        <PreviewOverlay
          coupons={[coupon({ id: 'c1', serviceTitle: 'Coupon 1' }), coupon({ id: 'c2', serviceTitle: 'Coupon 2' })]}
          accent="#C2185B"
          motif="♥"
          imageSrc={null}
          expiresAt={null}
          maxVisible={1}
          onViewAll={onViewAll}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText('Coupon 1')).toBeInTheDocument()
      expect(screen.queryByText('Coupon 2')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Click to View All Coupons' })).toBeInTheDocument()
    })
  })
})
