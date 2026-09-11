import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  addToCart,
  useCartLines,
  cartTotals,
  completePurchase,
  usePendingInstances,
  consumePendingInstance,
  linesForCart,
  setCartQty,
} from '../cart'

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

describe('completePurchase', () => {
  it('creates one pending instance per unit for bundle templates, and none for a gesture slug', () => {
    const { result } = renderHook(() => usePendingInstances())

    act(() => addToCart('mothers_day', 2))
    act(() => addToCart('celebration', 1)) // a single-use gesture slug, not a bundle template
    act(() => completePurchase())

    expect(result.current.filter((i) => i.slug === 'mothers_day')).toHaveLength(2)
    expect(result.current.filter((i) => i.slug === 'celebration')).toHaveLength(0)
  })
})

describe('consumePendingInstance', () => {
  it('removes exactly one pending instance for the slug, leaving the rest', () => {
    const { result } = renderHook(() => usePendingInstances())
    act(() => addToCart('mothers_day', 2))
    act(() => completePurchase())

    act(() => consumePendingInstance('mothers_day'))

    expect(result.current.filter((i) => i.slug === 'mothers_day')).toHaveLength(1)
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
    const lines = linesForCart([{ slug: 'celebration', qty: 1 }])

    expect(lines).toEqual([{ slug: 'celebration', name: 'Night Out', price: 1.99, qty: 1 }])
  })
})

describe('cartTotals', () => {
  it('triggers the 3-for-2 discount once total units reach 3, even from a single line with qty 3', () => {
    const lines = [{ slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 3 }]

    const { discount, total } = cartTotals(lines)

    expect(discount).toBe(2.99)
    expect(total).toBeCloseTo(5.98)
  })
})
