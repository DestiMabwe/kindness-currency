import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CouponCardHero } from '../CouponCardHero'
import styles from '../CouponCardHero.module.css'

describe('CouponCardHero', () => {
  it('renders the coupon frame', () => {
    const { container } = render(<CouponCardHero />)
    const frame = container.firstElementChild as HTMLElement
    expect(frame).toHaveClass(styles.card)
  })

  it('places the barcode stub before the perforation and content, on the left', () => {
    const { container } = render(<CouponCardHero />)
    const inner = container.querySelector(`.${styles.inner}`) as HTMLElement
    const children = Array.from(inner.children)
    const stubIndex = children.findIndex((el) => el.className.includes(styles.stub))
    const perforationIndex = children.findIndex((el) => el.className.includes(styles.perforation))
    const contentIndex = children.findIndex((el) => el.className.includes(styles.content))

    expect(stubIndex).toBeGreaterThanOrEqual(0)
    expect(stubIndex).toBeLessThan(perforationIndex)
    expect(perforationIndex).toBeLessThan(contentIndex)
  })
})
