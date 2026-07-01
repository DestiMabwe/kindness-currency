import type { SupabaseClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import { SaveCouponSetInputSchema } from '@/schemas/couponSchema'

export type SaveCouponSetResult = { success: true; id: string; pin: string } | { success: false; error: string }

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export function createCouponSetRepository(supabase: SupabaseClient) {
  return {
    /**
     * Creates a coupon set + its 8 coupons for an authenticated sender.
     * Generates the 4-digit PIN and returns it once, in plaintext, so the
     * caller can show it on GiftReadyScreen — only the bcrypt hash is stored.
     */
    async saveCouponSet(input: unknown, userId: string): Promise<SaveCouponSetResult> {
      const parsed = SaveCouponSetInputSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: GENERIC_ERROR }
      const { coupons, expiry_date, ...setFields } = parsed.data

      const pin = String(randomInt(1000, 10000))
      const pinHash = await bcrypt.hash(pin, 10)

      const { data: set, error: setError } = await supabase
        .from('coupon_sets')
        .insert({ ...setFields, expiry_date: expiry_date ?? null, user_id: userId, pin_code: pinHash, status: 'sent' })
        .select('id')
        .single<{ id: string }>()

      if (setError || !set) return { success: false, error: GENERIC_ERROR }

      const { error: couponsError } = await supabase.from('coupons').insert(
        coupons.map((c) => ({
          set_id: set.id,
          sort_order: c.sort_order,
          service_title: c.service_title,
          micro_copy: c.micro_copy ?? null,
          fine_print: c.fine_print ?? null,
          font_choice: c.font_choice,
          background_color: c.background_color ?? null,
          background_effect: c.background_effect,
          status: 'sent',
        }))
      )

      if (couponsError) return { success: false, error: GENERIC_ERROR }

      return { success: true, id: set.id, pin }
    },
  }
}
