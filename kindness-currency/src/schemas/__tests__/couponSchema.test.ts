import { describe, it, expect } from 'vitest'
import { CouponMutationSchema, MICRO_COPY_MAX_LENGTH, FINE_PRINT_MAX_LENGTH } from '../couponSchema'

const baseCoupon = {
  service_title: 'A Kind Gesture',
  font_choice: 'playfair' as const,
  background_effect: 'none' as const,
}

describe('CouponMutationSchema', () => {
  // Regression coverage: micro_copy and fine_print had no length limit at all, so a long line
  // could stretch CouponCardHero's card much taller than intended, shrinking the decorative
  // image/motif in proportion — see MICRO_COPY_MAX_LENGTH/FINE_PRINT_MAX_LENGTH's own comment.
  it('accepts micro_copy up to MICRO_COPY_MAX_LENGTH', () => {
    const result = CouponMutationSchema.safeParse({ ...baseCoupon, micro_copy: 'x'.repeat(MICRO_COPY_MAX_LENGTH) })

    expect(result.success).toBe(true)
  })

  it('rejects micro_copy one character past MICRO_COPY_MAX_LENGTH', () => {
    const result = CouponMutationSchema.safeParse({ ...baseCoupon, micro_copy: 'x'.repeat(MICRO_COPY_MAX_LENGTH + 1) })

    expect(result.success).toBe(false)
  })

  it('accepts fine_print up to FINE_PRINT_MAX_LENGTH', () => {
    const result = CouponMutationSchema.safeParse({ ...baseCoupon, fine_print: 'x'.repeat(FINE_PRINT_MAX_LENGTH) })

    expect(result.success).toBe(true)
  })

  it('rejects fine_print one character past FINE_PRINT_MAX_LENGTH', () => {
    const result = CouponMutationSchema.safeParse({ ...baseCoupon, fine_print: 'x'.repeat(FINE_PRINT_MAX_LENGTH + 1) })

    expect(result.success).toBe(false)
  })

  it('still accepts a coupon with neither field set — both stay optional', () => {
    const result = CouponMutationSchema.safeParse(baseCoupon)

    expect(result.success).toBe(true)
  })
})
