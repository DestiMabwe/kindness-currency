import type { SupabaseClient } from '@supabase/supabase-js'
import type { CouponStatus, FontChoice, BackgroundEffect, ReminderFrequency } from '@/schemas/couponSchema'
import type { TemplateSlug } from '@/constants/designTokens'

export type GiveCoupon = {
  id: string
  sort_order: number
  service_title: string
  micro_copy: string | null
  fine_print: string | null
  font_choice: FontChoice
  background_color: string | null
  background_effect: BackgroundEffect
  status: CouponStatus
}

export type GiveCouponSet = {
  id: string
  sender_name: string
  recipient_name: string
  template_slug: TemplateSlug
  expiry_date: string | null
  recipient_user_id: string | null
  sender_message: string | null
  opened_at: string | null
  reminder_frequency: ReminderFrequency | null
  coupons: GiveCoupon[]
}

type CouponSetRow = {
  id: string
  sender_name: string
  recipient_name: string
  expiry_date: string | null
  recipient_user_id: string | null
  sender_message: string | null
  opened_at: string | null
  reminder_frequency: ReminderFrequency | null
  templates: { slug: string } | { slug: string }[] | null
  coupons: GiveCoupon[]
}

/** Redeemed coupons sink to the bottom so the recipient's remaining coupons stay prominent. */
export function sortCouponsForDisplay<T extends { status: CouponStatus; sort_order: number }>(coupons: T[]): T[] {
  return [...coupons].sort((a, b) => {
    if (a.status === 'redeemed' && b.status !== 'redeemed') return 1
    if (a.status !== 'redeemed' && b.status === 'redeemed') return -1
    return a.sort_order - b.sort_order
  })
}

export function createGiveRepository(supabase: SupabaseClient) {
  return {
    /**
     * Reads everything the recipient page needs for /give/[id]. Deliberately
     * never selects pin_code — this is the only read path for anonymous
     * recipients, so the query itself enforces that the PIN hash never
     * leaves the database.
     */
    async getCouponSetForRecipient(id: string): Promise<GiveCouponSet | null> {
      const { data, error } = await supabase
        .from('coupon_sets')
        .select(
          'id, sender_name, recipient_name, expiry_date, recipient_user_id, sender_message, opened_at, reminder_frequency, templates(slug), coupons(id, sort_order, service_title, micro_copy, fine_print, font_choice, background_color, background_effect, status)'
        )
        .eq('id', id)
        .single<CouponSetRow>()

      if (error || !data) return null

      const template = Array.isArray(data.templates) ? data.templates[0] : data.templates
      if (!template) return null

      return {
        id: data.id,
        sender_name: data.sender_name,
        recipient_name: data.recipient_name,
        expiry_date: data.expiry_date,
        recipient_user_id: data.recipient_user_id,
        sender_message: data.sender_message,
        opened_at: data.opened_at,
        reminder_frequency: data.reminder_frequency,
        template_slug: template.slug as TemplateSlug,
        coupons: [...data.coupons].sort((a, b) => a.sort_order - b.sort_order),
      }
    },

    /**
     * Records the moment the recipient first loaded this link — closes the
     * loop for the sender even without a redemption. Conditioned on
     * opened_at still being null so repeat visits never overwrite the
     * original timestamp; safe to call on every page load.
     */
    async markOpened(id: string): Promise<void> {
      await supabase.from('coupon_sets').update({ opened_at: new Date().toISOString() }).eq('id', id).is('opened_at', null)
    },

    /**
     * Stores the recipient's chosen reminder cadence, or clears it (null) if
     * they turn reminders off. Capture only — nothing reads this to actually
     * send a reminder yet; that needs real scheduling/email infra first.
     */
    async setReminderFrequency(id: string, frequency: ReminderFrequency | null): Promise<{ success: true } | { success: false }> {
      const { error } = await supabase.from('coupon_sets').update({ reminder_frequency: frequency }).eq('id', id)
      return error ? { success: false } : { success: true }
    },
  }
}
