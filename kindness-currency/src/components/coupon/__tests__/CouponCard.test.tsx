import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CouponCard } from '../CouponCard'
import { templateVisuals } from '@/constants/designTokens'

const baseProps = {
  serviceTitle: 'One Home-Cooked Meal',
  microCopy: 'Made with extra love',
  finePrint: 'No expiry',
  fontChoice: 'playfair' as const,
  backgroundColor: '#FFF8F0',
  backgroundEffect: 'none' as const,
  status: 'sent' as const,
  accent: '#C2185B',
  motif: '❀',
}

describe('CouponCard', () => {
  describe('locked visual elements', () => {
    it('renders the barcode graphic regardless of props', () => {
      const { container } = render(<CouponCard {...baseProps} backgroundColor="#00FF00" />)
      expect(container.querySelectorAll('.bg-\\[\\#1A1A2E\\].opacity-\\[0\\.78\\]')).toHaveLength(8)
    })

    it('renders the Kindness Red border colour regardless of the background colour prop', () => {
      const { container } = render(<CouponCard {...baseProps} backgroundColor="#00FF00" accent="#C2185B" />)
      const card = container.firstElementChild as HTMLElement
      expect(card.style.borderColor).toBe('rgb(194, 24, 91)')
    })

    it('renders the "GOOD FOR" framing label regardless of props', () => {
      render(<CouponCard {...baseProps} serviceTitle="Anything at all" />)
      expect(screen.getByText('GOOD FOR')).toBeInTheDocument()
    })

    it('renders the template decorative motif regardless of props', () => {
      render(<CouponCard {...baseProps} motif="☾" />)
      expect(screen.getByText('☾')).toBeInTheDocument()
    })
  })

  describe('redeemed state', () => {
    it('shows the "Redeemed ♥" stamp overlay when status is redeemed', () => {
      render(<CouponCard {...baseProps} status="redeemed" />)
      expect(screen.getByText('Redeemed ♥')).toBeInTheDocument()
    })

    it('does not show the stamp overlay when status is sent or viewed', () => {
      render(<CouponCard {...baseProps} status="sent" />)
      expect(screen.queryByText('Redeemed ♥')).not.toBeInTheDocument()
    })
  })

  describe('redeem action', () => {
    it('shows the redeem button when showRedeem is true and not yet redeemed', () => {
      render(<CouponCard {...baseProps} showRedeem status="sent" onRedeem={() => {}} />)
      expect(screen.getByRole('button', { name: 'Redeem This ♥' })).toBeInTheDocument()
    })

    it('hides the redeem button once redeemed even if showRedeem is true', () => {
      render(<CouponCard {...baseProps} showRedeem status="redeemed" onRedeem={() => {}} />)
      expect(screen.queryByRole('button', { name: 'Redeem This ♥' })).not.toBeInTheDocument()
    })

    it('calls onRedeem when the redeem button is clicked', async () => {
      const onRedeem = vi.fn()
      const { default: userEvent } = await import('@testing-library/user-event')
      render(<CouponCard {...baseProps} showRedeem status="sent" onRedeem={onRedeem} />)
      await userEvent.click(screen.getByRole('button', { name: 'Redeem This ♥' }))
      expect(onRedeem).toHaveBeenCalledOnce()
    })
  })

  describe('per-template motif and accent', () => {
    it.each(Object.entries(templateVisuals))('renders %s with its own motif and border colour', (_slug, visuals) => {
      const { container } = render(<CouponCard {...baseProps} accent={visuals.accent} motif={visuals.motif} />)

      expect(screen.getByText(visuals.motif)).toBeInTheDocument()
      const card = container.firstElementChild as HTMLElement
      expect(card.style.borderColor).not.toBe('')
      expect(card.style.getPropertyValue('border-color')).toBeTruthy()
    })

    it('gives every template a visually distinct accent colour', () => {
      const accents = Object.values(templateVisuals).map((v) => v.accent)
      expect(new Set(accents).size).toBe(accents.length)
    })

    it('gives every template a visually distinct motif', () => {
      const motifs = Object.values(templateVisuals).map((v) => v.motif)
      expect(new Set(motifs).size).toBe(motifs.length)
    })
  })
})
