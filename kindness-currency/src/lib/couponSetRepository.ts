import type { SupabaseClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import { SaveCouponSetInputSchema } from '@/schemas/couponSchema'

export type SaveCouponSetResult = { success: true; id: string; pin: string } | { success: false; error: string }

export type CouponSetSummary = {
  id: string
  recipient_name: string
  status: string
  created_at: string
  templateName: string | null
  coupons: { id: string; status: string }[]
}

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

    /**
     * Coupon sets a given user has sent, newest first, with each coupon's
     * redemption status so Profile can show progress per gift.
     */
    async getCouponSetsForUser(userId: string): Promise<CouponSetSummary[]> {
      const { data, error } = await supabase
        .from('coupon_sets')
        .select('id, recipient_name, status, created_at, templates(name), coupons(id, status)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => {
        const template = Array.isArray(row.templates) ? row.templates[0] : row.templates
        return {
          id: row.id,
          recipient_name: row.recipient_name,
          status: row.status,
          created_at: row.created_at,
          templateName: template?.name ?? null,
          coupons: row.coupons,
        }
      })
    },

    /**
     * Links a coupon set to the account of the person who redeemed it, so it
     * can later surface under their Profile. A plain update, safely callable
     * more than once for the same user.
     */
    async linkRecipient(setId: string, userId: string): Promise<{ success: true } | { success: false; error: string }> {
      const { error } = await supabase.from('coupon_sets').update({ recipient_user_id: userId }).eq('id', setId)

      if (error) return { success: false, error: GENERIC_ERROR }
      return { success: true }
    },
  }
}
