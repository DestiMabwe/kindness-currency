import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CouponCardHero } from '../CouponCardHero'
import styles from '../CouponCardHero.module.css'

const baseProps = {
  serviceTitle: 'One Home-Cooked Meal',
  accent: '#C2185B',
  backgroundEffect: 'none' as const,
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
})
