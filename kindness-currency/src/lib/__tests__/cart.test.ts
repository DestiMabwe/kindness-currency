import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { addToCart, useCartLines, cartTotals, recordCompletedCheckout, useOrderHistory, linesForCart, setCartQty } from '../cart'
import { REGION_PAIRED_BUNDLE_PRICE } from '../geoPricing'

beforeEach(() => {
  window.localStorage.clear()
})

describe('cart quantities', () => {
  it('adds the given quantity on top of an existing line for the same slug', () => {
    const { result } = renderHook(() => useCartLines())

    act(() => addToCart('mothers_day', 2))
    act(() => addToCart('mothers_day', 3))

    expect(result.current).toEqual([{ slug: 'mothers_day', qty: 5 }])
  })
})

describe('recordCompletedCheckout', () => {
  it('appends an order to history and clears the cart', () => {
    const cartResult = renderHook(() => useCartLines())
    const orderResult = renderHook(() => useOrderHistory())
    act(() => addToCart('mothers_day', 2))

    act(() => recordCompletedCheckout([{ slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 2 }], 5.98))

    expect(cartResult.result.current).toEqual([])
    expect(orderResult.result.current).toHaveLength(1)
    expect(orderResult.result.current[0].total).toBe(5.98)
  })
})

describe('setCartQty', () => {
  it('sets the quantity for an existing line directly, and removes it when set to 0', () => {
    const { result } = renderHook(() => useCartLines())
    act(() => addToCart('mothers_day', 2))

    act(() => setCartQty('mothers_day', 5))
    expect(result.current).toEqual([{ slug: 'mothers_day', qty: 5 }])

    act(() => setCartQty('mothers_day', 0))
    expect(result.current).toEqual([])
  })
})

describe('linesForCart', () => {
  it('resolves price and name for a single-use gesture slug too, not just bundle templates', () => {
    const lines = linesForCart([{ slug: 'celebration', qty: 1 }], 'US')

    expect(lines).toEqual([{ slug: 'celebration', name: 'Night Out', price: 1.99, qty: 1 }])
  })
})

describe('cartTotals', () => {
  it('triggers the 3-for-2 discount once total units reach 3, even from a single line with qty 3', () => {
    const lines = [{ slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 3 }]

    const { discount, total } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE.US)

    expect(discount).toBe(2.99)
    expect(total).toBeCloseTo(5.98)
  })

  it('charges $9.99 for one of each paired-bundle template instead of $6.99 + $6.99', () => {
    const lines = [
      { slug: 'requested-by-him', name: "Requested By Him: Lover's Wishes", price: 6.99, qty: 1 },
      { slug: 'requested-by-her', name: "Requested By Her: Lover's Wishes", price: 6.99, qty: 1 },
    ]

    const { pairDiscount, total } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE.US)

    expect(pairDiscount).toBeCloseTo(3.99)
    expect(total).toBeCloseTo(9.99)
  })

  it('only discounts as many pairs as both sides actually have, charging the surplus at full price (plus the 3-for-2 discount, since this also totals 3 units)', () => {
    const lines = [
      { slug: 'requested-by-him', name: "Requested By Him: Lover's Wishes", price: 6.99, qty: 2 },
      { slug: 'requested-by-her', name: "Requested By Her: Lover's Wishes", price: 6.99, qty: 1 },
    ]

    const { pairDiscount, discount, total } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE.US)

    expect(pairDiscount).toBeCloseTo(3.99)
    expect(discount).toBe(6.99)
    expect(total).toBeCloseTo(6.99 * 3 - 3.99 - 6.99)
  })

  it('stacks the pairing discount with the 3-for-2 discount rather than one suppressing the other', () => {
    const lines = [
      { slug: 'requested-by-him', name: "Requested By Him: Lover's Wishes", price: 6.99, qty: 1 },
      { slug: 'requested-by-her', name: "Requested By Her: Lover's Wishes", price: 6.99, qty: 1 },
      { slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 1 },
    ]

    const { pairDiscount, discount, total } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE.US)

    expect(pairDiscount).toBeCloseTo(3.99)
    expect(discount).toBe(2.99)
    expect(total).toBeCloseTo(6.99 * 2 + 2.99 - 3.99 - 2.99)
  })
})
