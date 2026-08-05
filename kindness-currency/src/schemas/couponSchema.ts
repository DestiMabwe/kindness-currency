import { z } from 'zod'

// Status enums
export const CouponSetStatusSchema = z.enum(['draft', 'sent', 'viewed'])
export const CouponStatusSchema = z.enum(['sent', 'viewed', 'redeemed'])

// Stable UI enums
export const FontChoiceSchema = z.enum(['playfair', 'dm-sans'])
export const BackgroundEffectSchema = z.enum(['none', 'confetti', 'sparkle', 'soft-glow'])

// Coupon set mutation schema — template_id replaces template_type enum
export const CouponSetMutationSchema = z.object({
  template_id: z.string().uuid(),
  sender_name: z.string().min(1),
  recipient_name: z.string().min(1),
  expiry_date: z.string().date().optional(),
})

// Longest seeded service_title is 31 chars ("One Birthday Meal, Your Choice"); this caps
// input at 40 so CouponCardHero's fixed-height layout never has to silently overflow.
export const SERVICE_TITLE_MAX_LENGTH = 40

// Individual coupon mutation schema
export const CouponMutationSchema = z.object({
  service_title: z.string().min(1).max(SERVICE_TITLE_MAX_LENGTH),
  micro_copy: z.string().optional(),
  fine_print: z.string().optional(),
  font_choice: FontChoiceSchema,
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_effect: BackgroundEffectSchema,
})

// Redemption input — RedemptionEngine parses every payload through this before touching the database
export const RedeemInputSchema = z.object({
  couponId: z.string().uuid(),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits'),
})

// Full save payload — the AuthGate save mutation parses this before writing coupon_sets + coupons
export const SaveCouponSetInputSchema = CouponSetMutationSchema.extend({
  coupons: z.array(CouponMutationSchema.extend({ sort_order: z.number().int().min(1) })).length(8),
})

// Derived types — never write parallel interfaces
export type CouponSetStatus = z.infer<typeof CouponSetStatusSchema>
export type CouponStatus = z.infer<typeof CouponStatusSchema>
export type FontChoice = z.infer<typeof FontChoiceSchema>
export type BackgroundEffect = z.infer<typeof BackgroundEffectSchema>
export type CouponSetMutation = z.infer<typeof CouponSetMutationSchema>
export type CouponMutation = z.infer<typeof CouponMutationSchema>
export type RedeemInput = z.infer<typeof RedeemInputSchema>
export type SaveCouponSetInput = z.infer<typeof SaveCouponSetInputSchema>
