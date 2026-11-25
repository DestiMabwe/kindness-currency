import type { SupabaseClient } from '@supabase/supabase-js'
import { DiscountCodeInputSchema, DiscountCodeRowSchema } from '@/schemas/discountCodeSchema'
import { DISCOUNT_ERRORS } from '@/lib/discount'

export type ValidDiscountCode = { id: string; code: string; percentOff: number; label: string }

export type ValidateDiscountCodeResult = { success: true; code: ValidDiscountCode } | { success: false; error: string }

/**
 * Read-only lookup. A code is only ever *redeemed* (a discount_redemptions row written) when an
 * order is fulfilled — see redeem_discount_for_order in the discount codes migration — so this
 * only answers "could this person use this code right now?". Called both for the cart's preview
 * and again, authoritatively, by checkout itself.
 */
export function createDiscountCodeRepository(supabase: SupabaseClient) {
  return {
    async validateForUser(rawCode: string, userId: string): Promise<ValidateDiscountCodeResult> {
      const parsedInput = DiscountCodeInputSchema.safeParse(rawCode)
      if (!parsedInput.success) return { success: false, error: DISCOUNT_ERRORS.notFound }

      const { data, error } = await supabase
        .from('discount_codes')
        .select('id, code, percent_off, label, max_redemptions, expires_at, is_active')
        .eq('code', parsedInput.data)
        .maybeSingle()

      if (error) return { success: false, error: DISCOUNT_ERRORS.generic }
      const parsedRow = DiscountCodeRowSchema.safeParse(data)
      if (!parsedRow.success) return { success: false, error: DISCOUNT_ERRORS.notFound }
      const row = parsedRow.data

      if (!row.is_active) return { success: false, error: DISCOUNT_ERRORS.inactive }
      if (row.expires_at !== null && new Date(row.expires_at).getTime() <= Date.now()) {
        return { success: false, error: DISCOUNT_ERRORS.expired }
      }

      const { data: mine, error: mineError } = await supabase
        .from('discount_redemptions')
        .select('id')
        .eq('code_id', row.id)
        .eq('user_id', userId)
        .maybeSingle()
      if (mineError) return { success: false, error: DISCOUNT_ERRORS.generic }
      if (mine) return { success: false, error: DISCOUNT_ERRORS.alreadyUsed }

      if (row.max_redemptions !== null) {
        const { count, error: countError } = await supabase
          .from('discount_redemptions')
          .select('id', { count: 'exact', head: true })
          .eq('code_id', row.id)
        if (countError || count === null) return { success: false, error: DISCOUNT_ERRORS.generic }
        if (count >= row.max_redemptions) return { success: false, error: DISCOUNT_ERRORS.exhausted }
      }

      return { success: true, code: { id: row.id, code: row.code, percentOff: row.percent_off, label: row.label } }
    },
  }
}
