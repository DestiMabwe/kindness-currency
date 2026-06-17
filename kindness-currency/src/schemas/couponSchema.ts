import { z } from 'zod'

// Status enums
export const CouponSetStatusSchema = z.enum(['draft', 'sent', 'viewed'])
export const CouponStatusSchema = z.enum(['sent', 'viewed', 'redeemed'])

// Stable UI enums
export const FontChoiceSchema = z.enum(['playfair', 'dm-sans'])
export const BackgroundEffectSchema = z.enum(['none', 'confetti', 'sparkle', 'soft-glow'])

// Derived types — never write parallel interfaces
export type CouponSetStatus = z.infer<typeof CouponSetStatusSchema>
export type CouponStatus = z.infer<typeof CouponStatusSchema>
export type FontChoice = z.infer<typeof FontChoiceSchema>
export type BackgroundEffect = z.infer<typeof BackgroundEffectSchema>
