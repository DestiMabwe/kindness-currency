import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CouponCardHero } from '../CouponCardHero'
import styles from '../CouponCardHero.module.css'

const baseProps = {
  serviceTitle: 'One Home-Cooked Meal',
  accent: '#C2185B',
  backgroundEffect: 'none' as const,
  motif: '❀',
  status: 'sent' as const,
}

describe('CouponCardHero', () => {
  it('renders the coupon frame', () => {
    const { container } = render(<CouponCardHero {...baseProps} />)
    const frame = container.firstElementChild as HTMLElement
    expect(frame).toHaveClass(styles.card)
  })

  it('places the barcode stub before the perforation and content, on the left', () => {
    const { container } = render(<CouponCardHero {...baseProps} />)
    const inner = container.querySelector(`.${styles.inner}`) as HTMLElement
    const children = Array.from(inner.children)
    const stubIndex = children.findIndex((el) => el.className.includes(styles.stub))
    const perforationIndex = children.findIndex((el) => el.className.includes(styles.perforation))
    const contentIndex = children.findIndex((el) => el.className.includes(styles.content))

    expect(stubIndex).toBeGreaterThanOrEqual(0)
    expect(stubIndex).toBeLessThan(perforationIndex)
    expect(perforationIndex).toBeLessThan(contentIndex)
  })

  it('renders the serviceTitle as the headline', () => {
    render(<CouponCardHero {...baseProps} serviceTitle="A Long Bath Together" />)
    expect(screen.getByText('A Long Bath Together')).toBeInTheDocument()
  })

  it('renders the headline in Playfair Display Bold', () => {
    render(<CouponCardHero {...baseProps} />)
    const headline = screen.getByText(baseProps.serviceTitle)
    expect(headline.style.fontFamily).toBe('var(--font-playfair)')
    expect(headline.style.fontWeight).toBe('700')
  })

  it('always renders the "GOOD FOR ONE" eyebrow label, regardless of props', () => {
    render(<CouponCardHero {...baseProps} serviceTitle="Anything at all" />)
    expect(screen.getByText('GOOD FOR ONE')).toBeInTheDocument()
  })

  it('renders microCopy when provided', () => {
    render(<CouponCardHero {...baseProps} microCopy="Just the way you like it" />)
    expect(screen.getByText('Just the way you like it')).toBeInTheDocument()
  })

  it('omits microCopy when not provided', () => {
    const { container } = render(<CouponCardHero {...baseProps} />)
    expect(container.querySelector(`.${styles.subline}`)).not.toBeInTheDocument()
  })

  it('renders finePrint when provided', () => {
    render(<CouponCardHero {...baseProps} finePrint="No expiry" />)
    expect(screen.getByText('No expiry')).toBeInTheDocument()
  })

  it('omits finePrint when not provided', () => {
    const { container } = render(<CouponCardHero {...baseProps} />)
    expect(container.querySelector(`.${styles.finePrint}`)).not.toBeInTheDocument()
  })

  it('drives the border and notch color from the accent prop, regardless of backgroundColor', () => {
    const { container } = render(<CouponCardHero {...baseProps} accent="#2E7D6B" backgroundColor="#00FF00" />)
    const frame = container.firstElementChild as HTMLElement
    expect(frame.style.getPropertyValue('--hero-accent')).toBe('#2E7D6B')
  })

  it('overrides the inner fill color with backgroundColor when provided', () => {
    const { container } = render(<CouponCardHero {...baseProps} backgroundColor="#00FF00" />)
    const inner = container.querySelector(`.${styles.inner}`) as HTMLElement
    expect(inner.style.backgroundColor).toBe('rgb(0, 255, 0)')
  })

  it('defaults the inner fill color to cream when backgroundColor is not provided', () => {
    const { container } = render(<CouponCardHero {...baseProps} />)
    const inner = container.querySelector(`.${styles.inner}`) as HTMLElement
    expect(inner.style.backgroundColor).toBe('rgb(255, 248, 240)')
  })

  it('renders no decoration layer when backgroundEffect is "none"', () => {
    const { container } = render(<CouponCardHero {...baseProps} backgroundEffect="none" />)
    expect(container.querySelector(`.${styles.glow}`)).not.toBeInTheDocument()
    expect(container.querySelector(`.${styles.confetti}`)).not.toBeInTheDocument()
    expect(container.querySelector(`.${styles.sparkle}`)).not.toBeInTheDocument()
  })

  it.each(['soft-glow', 'confetti', 'sparkle'] as const)(
    'renders the %s decoration layer when selected',
    (effect) => {
      const classForEffect = { 'soft-glow': styles.glow, confetti: styles.confetti, sparkle: styles.sparkle }
      const { container } = render(<CouponCardHero {...baseProps} backgroundEffect={effect} />)
      expect(container.querySelector(`.${classForEffect[effect]}`)).toBeInTheDocument()
    },
  )

  it('falls back to the motif watermark when imageSrc is not provided', () => {
    render(<CouponCardHero {...baseProps} motif="☾" />)
    expect(screen.getByText('☾')).toBeInTheDocument()
  })

  it('renders the decorative photo when imageSrc is provided', () => {
    const { container } = render(<CouponCardHero {...baseProps} imageSrc="/images/mothers_day.png" />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/images/mothers_day.png')
  })

  it('does not render the motif watermark when imageSrc is provided', () => {
    render(<CouponCardHero {...baseProps} motif="☾" imageSrc="/images/mothers_day.png" />)
    expect(screen.queryByText('☾')).not.toBeInTheDocument()
  })

  it('reserves space for the photo so it does not cover the text column', () => {
    const { container } = render(<CouponCardHero {...baseProps} imageSrc="/images/mothers_day.png" />)
    const content = container.querySelector(`.${styles.content}`) as HTMLElement
    expect(content).toHaveClass(styles.contentWithImage)
  })

  it('does not reserve photo space when there is no photo', () => {
    const { container } = render(<CouponCardHero {...baseProps} />)
    const content = container.querySelector(`.${styles.content}`) as HTMLElement
    expect(content.className).not.toContain(styles.contentWithImage)
  })

  it('renders "NO EXPIRY DATE" in the stub label when expiresAt is not set', () => {
    render(<CouponCardHero {...baseProps} />)
    expect(screen.getByText('NO EXPIRY DATE')).toBeInTheDocument()
  })

  it('renders the formatted real date in the stub label when expiresAt is set', () => {
    render(<CouponCardHero {...baseProps} expiresAt="2026-08-15" />)
    expect(screen.getByText('AUG 15, 2026')).toBeInTheDocument()
    expect(screen.queryByText('NO EXPIRY DATE')).not.toBeInTheDocument()
  })

  describe('redeemed state', () => {
    it('shows the "Redeemed ♥" stamp overlay when status is redeemed', () => {
      render(<CouponCardHero {...baseProps} status="redeemed" />)
      expect(screen.getByText('Redeemed ♥')).toBeInTheDocument()
    })

    it('does not show the stamp overlay when status is sent or viewed', () => {
      render(<CouponCardHero {...baseProps} status="sent" />)
      expect(screen.queryByText('Redeemed ♥')).not.toBeInTheDocument()
    })
  })

  describe('redeem action', () => {
    it('shows the redeem button when showRedeem is true and not yet redeemed', () => {
      render(<CouponCardHero {...baseProps} showRedeem status="sent" onRedeem={() => {}} />)
      expect(screen.getByRole('button', { name: 'Redeem This ♥' })).toBeInTheDocument()
    })

    it('hides the redeem button once redeemed even if showRedeem is true', () => {
      render(<CouponCardHero {...baseProps} showRedeem status="redeemed" onRedeem={() => {}} />)
      expect(screen.queryByRole('button', { name: 'Redeem This ♥' })).not.toBeInTheDocument()
    })

    it('calls onRedeem when the redeem button is clicked', async () => {
      const onRedeem = vi.fn()
      const { default: userEvent } = await import('@testing-library/user-event')
      render(<CouponCardHero {...baseProps} showRedeem status="sent" onRedeem={onRedeem} />)
      await userEvent.click(screen.getByRole('button', { name: 'Redeem This ♥' }))
      expect(onRedeem).toHaveBeenCalledOnce()
    })
  })
})
