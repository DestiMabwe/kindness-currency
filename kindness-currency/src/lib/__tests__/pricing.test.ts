import { describe, it, expect } from 'vitest'
import { linesForCart, linesForSlugs, cartTotals, priceForSlug, resolveCheckoutPrice, GESTURE_UNLOCK_PRICE } from '../pricing'

describe('linesForSlugs', () => {
  it('resolves price and name for a single-use gesture slug too, not just bundle templates', () => {
    const lines = linesForSlugs(['celebration'])

    expect(lines).toEqual([{ slug: 'celebration', name: 'Night Out', price: 1.99, qty: 1 }])
  })
})

describe('linesForCart', () => {
  it('drops any line whose slug does not resolve to a real price', () => {
    const lines = linesForCart([{ slug: 'mothers_day', qty: 1 }, { slug: 'not-a-real-slug', qty: 1 }])

    expect(lines).toEqual([{ slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 1 }])
  })
})

describe('cartTotals', () => {
  it('triggers the 3-for-2 discount once total units reach 3, even from a single line with qty 3', () => {
    const lines = [{ slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 3 }]

    const { discount, total } = cartTotals(lines)

    expect(discount).toBe(2.99)
    expect(total).toBeCloseTo(5.98)
  })

  it('charges $9.99 for one of each paired-bundle template instead of $6.99 + $6.99', () => {
    const lines = [
      { slug: 'requested-by-him', name: "Requested By Him: Lover's Wishes", price: 6.99, qty: 1 },
      { slug: 'requested-by-her', name: "Requested By Her: Lover's Wishes", price: 6.99, qty: 1 },
    ]

    const { pairDiscount, total } = cartTotals(lines)

    expect(pairDiscount).toBeCloseTo(3.99)
    expect(total).toBeCloseTo(9.99)
  })

  it('stacks the pairing discount with the 3-for-2 discount rather than one suppressing the other', () => {
    const lines = [
      { slug: 'requested-by-him', name: "Requested By Him: Lover's Wishes", price: 6.99, qty: 1 },
      { slug: 'requested-by-her', name: "Requested By Her: Lover's Wishes", price: 6.99, qty: 1 },
      { slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 1 },
    ]

    const { pairDiscount, discount, total } = cartTotals(lines)

    expect(pairDiscount).toBeCloseTo(3.99)
    expect(discount).toBe(2.99)
    expect(total).toBeCloseTo(6.99 * 2 + 2.99 - 3.99 - 2.99)
  })
})

describe('priceForSlug', () => {
  it('returns null for a slug that is neither a bundle template nor a gesture', () => {
    expect(priceForSlug('not-a-real-slug')).toBeNull()
  })
})

describe('resolveCheckoutPrice', () => {
  it("returns the gesture's own base price for product 'base'", () => {
    expect(resolveCheckoutPrice('celebration', 'base')).toBe(1.99)
    expect(resolveCheckoutPrice('relief', 'base')).toBe(0)
  })

  it("charges GESTURE_UNLOCK_PRICE for 'gestureUnlock' on an otherwise-free gesture", () => {
    expect(resolveCheckoutPrice('relief', 'gestureUnlock')).toBe(GESTURE_UNLOCK_PRICE)
  })

  it("returns null for 'gestureUnlock' on a slug that isn't a free gesture — never a fallback price", () => {
    expect(resolveCheckoutPrice('celebration', 'gestureUnlock')).toBeNull()
    expect(resolveCheckoutPrice('mothers_day', 'gestureUnlock')).toBeNull()
    expect(resolveCheckoutPrice('not-a-real-slug', 'gestureUnlock')).toBeNull()
  })
})
