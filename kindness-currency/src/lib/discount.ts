// Paystack rejects a ZAR charge under R1.00 (100 cents). A code that would leave a tiny remainder
// is capped so the buyer pays exactly the minimum instead of failing at the payment window; a
// code that takes the order to exactly 0 skips Paystack entirely, so it's not affected.
export const PAYSTACK_MIN_CHARGE_CENTS = 100

// User-facing reasons a code is refused — one wording per reason, shared by the preview in the
// cart, the checkout itself, and the free-order redemption, so a buyer sees the same sentence
// wherever they hit it.
export const DISCOUNT_ERRORS = {
  notFound: "That code isn't valid. Check the spelling and try again.",
  inactive: 'That code is no longer active.',
  expired: 'That code has expired.',
  exhausted: 'That code has been fully used.',
  alreadyUsed: "You've already used that code.",
  rateLimited: "You're trying codes a bit fast. Please wait a moment and try again.",
  generic: 'Something went wrong applying that code. Please try again.',
} as const

export type DiscountedAmount ={ discountCents: number; finalCents: number }

/**
 * Applies a percentage off an amount in cents, rounding the discount to the nearest cent. The
 * single place a discount is calculated — the server uses it for the real charge, and the cart
 * uses the same function for its preview, so the two can never disagree.
 */
export function applyPercentDiscount(totalCents: number, percentOff: number): DiscountedAmount {
  if (totalCents <= 0 || percentOff <= 0) return { discountCents: 0, finalCents: Math.max(totalCents, 0) }

  const rawDiscount = Math.round((totalCents * Math.min(percentOff, 100)) / 100)
  let finalCents = totalCents - rawDiscount
  if (finalCents > 0 && finalCents < PAYSTACK_MIN_CHARGE_CENTS) {
    finalCents = Math.min(PAYSTACK_MIN_CHARGE_CENTS, totalCents)
  }
  return { discountCents: totalCents - finalCents, finalCents }
}
