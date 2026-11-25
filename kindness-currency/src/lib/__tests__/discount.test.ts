import { describe, it, expect } from 'vitest'
import { applyPercentDiscount, PAYSTACK_MIN_CHARGE_CENTS } from '../discount'

describe('applyPercentDiscount', () => {
  it('takes the percentage off, in cents', () => {
    expect(applyPercentDiscount(2000, 50)).toEqual({ discountCents: 1000, finalCents: 1000 })
    expect(applyPercentDiscount(1999, 10)).toEqual({ discountCents: 200, finalCents: 1799 })
  })

  it('rounds the discount to the nearest cent', () => {
    // 19.99 * 50% = 9.995 -> rounds to 10.00 off, leaving 9.99
    expect(applyPercentDiscount(1999, 50)).toEqual({ discountCents: 1000, finalCents: 999 })
  })

  it('makes a 100% code exactly free', () => {
    expect(applyPercentDiscount(1999, 100)).toEqual({ discountCents: 1999, finalCents: 0 })
  })

  it("caps a tiny remainder at Paystack's minimum charge instead of letting checkout fail", () => {
    // 99% off R19.99 would leave 20 cents, below the R1.00 minimum.
    const result = applyPercentDiscount(1999, 99)
    expect(result.finalCents).toBe(PAYSTACK_MIN_CHARGE_CENTS)
    expect(result.discountCents).toBe(1999 - PAYSTACK_MIN_CHARGE_CENTS)
  })

  it('never charges more than the original total, even when that total is already under the minimum', () => {
    expect(applyPercentDiscount(50, 10)).toEqual({ discountCents: 0, finalCents: 50 })
  })

  it('ignores a nonsensical percentage or an empty total', () => {
    expect(applyPercentDiscount(0, 50)).toEqual({ discountCents: 0, finalCents: 0 })
    expect(applyPercentDiscount(1000, 0)).toEqual({ discountCents: 0, finalCents: 1000 })
    expect(applyPercentDiscount(1000, 250)).toEqual({ discountCents: 1000, finalCents: 0 })
  })
})
