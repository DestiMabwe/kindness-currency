import { describe, it, expect } from 'vitest'
import {
  linesForCart,
  linesForSlugs,
  cartTotals,
  priceForSlug,
  resolveCheckoutPrice,
  settlementPriceForSlug,
  resolveSettlementPrice,
  settlementLinesForCart,
} from '../pricing'
import { REGION_PAIRED_BUNDLE_PRICE, REGION_GESTURE_UNLOCK_PRICE, SETTLEMENT_PAIRED_BUNDLE_PRICE_ZAR } from '../geoPricing'

describe('linesForSlugs', () => {
  it('resolves price and name for a single-use gesture slug too, not just bundle templates', () => {
    const lines = linesForSlugs(['celebration'], 'US')

    expect(lines).toEqual([{ slug: 'celebration', name: 'Night Out', price: 1.99, qty: 1 }])
  })

  it('resolves a different display price for the same slug in another region', () => {
    const lines = linesForSlugs(['celebration'], 'ZA')

    expect(lines).toEqual([{ slug: 'celebration', name: 'Night Out', price: 14.99, qty: 1 }])
  })
})

describe('linesForCart', () => {
  it('drops any line whose slug does not resolve to a real price', () => {
    const lines = linesForCart([{ slug: 'mothers_day', qty: 1 }, { slug: 'not-a-real-slug', qty: 1 }], 'US')

    expect(lines).toEqual([{ slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 1 }])
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

  it('does not count one-time gestures toward the 3-for-2 unit threshold', () => {
    const lines = [
      { slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 1 },
      { slug: 'birthday', name: 'Birthday Joy Tokens', price: 2.99, qty: 1 },
      { slug: 'celebration', name: 'Night Out', price: 1.99, qty: 1 },
    ]

    const { discount, freeSlug, total } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE.US)

    expect(discount).toBe(0)
    expect(freeSlug).toBeNull()
    expect(total).toBeCloseTo(2.99 + 2.99 + 1.99)
  })

  it('never makes a gesture the free line, even when 3+ coupon books also qualify and the gesture is cheapest', () => {
    const lines = [
      { slug: 'mothers_day', name: "Mom's Promise Tokens", price: 2.99, qty: 1 },
      { slug: 'birthday', name: 'Birthday Joy Tokens', price: 2.99, qty: 1 },
      { slug: 'besties', name: "Bestie's Surprise Passes", price: 2.99, qty: 1 },
      { slug: 'celebration', name: 'Night Out', price: 1.99, qty: 1 },
    ]

    const { discount, freeSlug, total } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE.US)

    expect(discount).toBe(2.99)
    expect(freeSlug).not.toBe('celebration')
    expect(total).toBeCloseTo(2.99 + 2.99 + 2.99 + 1.99 - 2.99)
  })

  it('takes the paired price as an explicit argument, so the same math works for a different currency scale', () => {
    const lines = [
      { slug: 'requested-by-him', name: "Requested By Him: Lover's Wishes", price: 49.99, qty: 1 },
      { slug: 'requested-by-her', name: "Requested By Her: Lover's Wishes", price: 49.99, qty: 1 },
    ]

    const { total } = cartTotals(lines, REGION_PAIRED_BUNDLE_PRICE.ZA)

    expect(total).toBeCloseTo(69.99)
  })
})

describe('priceForSlug', () => {
  it('returns null for a slug that is neither a bundle template nor a gesture', () => {
    expect(priceForSlug('not-a-real-slug', 'US')).toBeNull()
  })

  it('resolves the region-specific tier price for a bundle template', () => {
    expect(priceForSlug('mothers_day', 'US')).toBe(2.99)
    expect(priceForSlug('mothers_day', 'UK')).toBe(2.49)
    expect(priceForSlug('mothers_day', 'ZA')).toBe(19.99)
  })
})

describe('resolveCheckoutPrice', () => {
  it("returns the gesture's own base price for product 'base'", () => {
    expect(resolveCheckoutPrice('celebration', 'base', 'US')).toBe(1.99)
    expect(resolveCheckoutPrice('relief', 'base', 'US')).toBe(0)
  })

  it("charges the region's gesture-unlock price for 'gestureUnlock' on an otherwise-free gesture", () => {
    expect(resolveCheckoutPrice('relief', 'gestureUnlock', 'US')).toBe(REGION_GESTURE_UNLOCK_PRICE.US)
    expect(resolveCheckoutPrice('relief', 'gestureUnlock', 'ZA')).toBe(REGION_GESTURE_UNLOCK_PRICE.ZA)
  })

  it("returns null for 'gestureUnlock' on a slug that isn't a free gesture — never a fallback price", () => {
    expect(resolveCheckoutPrice('celebration', 'gestureUnlock', 'US')).toBeNull()
    expect(resolveCheckoutPrice('mothers_day', 'gestureUnlock', 'US')).toBeNull()
    expect(resolveCheckoutPrice('not-a-real-slug', 'gestureUnlock', 'US')).toBeNull()
  })
})

// --- Settlement (what Paystack actually charges — always ZAR) ---------------------------------
// The exact bug this session found: display price and settlement price must never be conflated.

describe('settlementPriceForSlug', () => {
  it('charges the SA bucket the same amount a South African visitor sees displayed', () => {
    expect(settlementPriceForSlug('mothers_day', 'ZA')).toBe(19.99)
  })

  it('charges every non-SA visitor the same international ZAR amount, regardless of their display currency', () => {
    expect(settlementPriceForSlug('mothers_day', 'INTL')).toBe(54.99)
  })
})

describe('resolveSettlementPrice', () => {
  it("charges the region's real ZAR gesture-unlock amount for 'gestureUnlock' on a free gesture", () => {
    expect(resolveSettlementPrice('relief', 'gestureUnlock', 'ZA')).toBe(14.99)
    expect(resolveSettlementPrice('relief', 'gestureUnlock', 'INTL')).toBe(34.99)
  })

  it("returns null for 'gestureUnlock' on a slug that isn't a free gesture", () => {
    expect(resolveSettlementPrice('celebration', 'gestureUnlock', 'INTL')).toBeNull()
  })
})

describe('settlementLinesForCart', () => {
  it('resolves ZAR settlement lines and totals identically to the display math, just a different table', () => {
    const lines = settlementLinesForCart(
      [
        { slug: 'requested-by-him', qty: 1 },
        { slug: 'requested-by-her', qty: 1 },
      ],
      'INTL'
    )

    const { total } = cartTotals(lines, SETTLEMENT_PAIRED_BUNDLE_PRICE_ZAR.INTL)

    expect(total).toBeCloseTo(179.99)
  })
})
