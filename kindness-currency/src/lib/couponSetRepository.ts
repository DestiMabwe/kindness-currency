import type { SupabaseClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import { SaveCouponSetInputSchema, type CouponSetStatus } from '@/schemas/couponSchema'
import { singleUseGestures } from '@/lib/singleUseGestures'

const gestureBySlug = Object.fromEntries(singleUseGestures.map((g) => [g.slug, g]))

export type SaveCouponSetResult =
  | { success: true; id: string; pin: string }
  | { success: false; error: string; paymentRequired?: boolean }

export type CouponSetSummary = {
  id: string
  recipient_name: string
  status: string
  created_at: string
  templateName: string | null
  coupons: { id: string; status: string }[]
  openedAt: string | null
}

export type ReceivedCouponSetSummary = {
  id: string
  sender_name: string
  status: string
  created_at: string
  templateName: string | null
  coupons: { id: string; status: string }[]
}

export type GiftTrackingCoupon = {
  id: string
  service_title: string
  status: string
  redeemed_at: string | null
}

export type GiftTrackingDetail = {
  id: string
  recipient_name: string
  status: string
  created_at: string
  openedAt: string | null
  templateName: string | null
  templateSlug: string | null
  coupons: GiftTrackingCoupon[]
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

/**
 * Whether sending this coupon set needs a consumed purchased_instances row. Every bundle template
 * is always paid. A single-use gesture only needs one when its base price is nonzero, or when the
 * sender went through the "Make This Gift Yours" paid unlock (gestureUnlocked) — the unlock is
 * what's paid for, not the gesture itself, so sending a free gesture unmodified must stay free.
 *
 * This used to infer "was it unlocked" by diffing the submitted text against the gesture's default
 * wording — broken, because a sender who unlocked but kept the original wording (or only changed
 * the background color/effect, always editable regardless of paid status) submitted content
 * identical to the default, so the diff reported "not customized" and skipped payment entirely.
 * gestureUnlocked is set explicitly by GestureFlow instead, straight from the same confirm action
 * that triggers checkout — see create_coupon_set()'s PAYMENT_REQUIRED path, which is the actual,
 * unspoofable gate (an unconsumed purchased_instances row must exist); this function only decides
 * whether that gate applies, same as it always has for bundle templates.
 */
function requiresPaymentForSend(template: { slug: string; is_single_use: boolean }, gestureUnlocked: boolean | undefined): boolean {
  if (!template.is_single_use) return true
  const gesture = gestureBySlug[template.slug]
  if (!gesture) return true
  return gesture.price > 0 || gestureUnlocked === true
}

export function createCouponSetRepository(supabase: SupabaseClient) {
  return {
    /**
     * Creates a coupon set + its coupons via the create_coupon_set() Postgres function — one
     * atomic transaction, so a crash mid-save can never burn a paid entitlement with nothing
     * created, or let a paid send through without consuming one (see the migration for the
     * function body). userId is null for an anonymous sender — mirrors the recipient side, which
     * already supports an anonymous /give/[id] visitor linking their account later. Generates the
     * 4-digit PIN and returns it once, in plaintext, so the caller can show it on GiftReadyScreen
     * — only the bcrypt hash is stored.
     *
     * status is decided by the caller's own server action (saveDraftAction vs
     * sendCouponSetAction), never taken from the client's payload — a 'draft' save is always free;
     * a 'sent' save requires payment for every bundle template, and for a single-use gesture only
     * once its price is nonzero or the sender went through the paid "Make This Gift Yours" unlock
     * (see requiresPaymentForSend below). When payment is required and no unconsumed
     * purchased_instances row exists for (userId, template_id), the function raises
     * 'PAYMENT_REQUIRED' and nothing is written — surfaced here as `paymentRequired: true` so the
     * caller can redirect to checkout instead of showing a generic error.
     */
    async saveCouponSet(input: unknown, userId: string | null, status: CouponSetStatus): Promise<SaveCouponSetResult> {
      const parsed = SaveCouponSetInputSchema.safeParse(input)
      if (!parsed.success) return { success: false, error: GENERIC_ERROR }
      const { coupons, expiry_date, sender_message, gesture_unlocked, ...setFields } = parsed.data

      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('slug, is_single_use')
        .eq('id', setFields.template_id)
        .single<{ slug: string; is_single_use: boolean }>()
      if (templateError || !template) return { success: false, error: GENERIC_ERROR }

      const requiresPayment = status === 'sent' && requiresPaymentForSend(template, gesture_unlocked)

      const pin = String(randomInt(1000, 10000))
      const pinHash = await bcrypt.hash(pin, 10)

      const { data: setId, error } = await supabase.rpc('create_coupon_set', {
        p_user_id: userId,
        p_status: status,
        p_requires_payment: requiresPayment,
        p_set: {
          ...setFields,
          expiry_date: expiry_date ?? null,
          sender_message: sender_message ?? null,
          pin_code: pinHash,
        },
        p_coupons: coupons,
      })

      if (error) {
        if (error.message?.includes('PAYMENT_REQUIRED')) {
          return { success: false, error: 'Payment required.', paymentRequired: true }
        }
        return { success: false, error: GENERIC_ERROR }
      }
      if (!setId) return { success: false, error: GENERIC_ERROR }

      return { success: true, id: setId as string, pin }
    },

    /**
     * Coupon sets a given user has sent, newest first, with each coupon's
     * redemption status so Profile can show progress per gift.
     */
    async getCouponSetsForUser(userId: string): Promise<CouponSetSummary[]> {
      const { data, error } = await supabase
        .from('coupon_sets')
        .select('id, recipient_name, status, created_at, opened_at, templates(name), coupons(id, status)')
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
          openedAt: row.opened_at,
        }
      })
    },

    /**
     * Coupon sets a given user has received (linked to their account via
     * linkRecipient), newest first — the Received counterpart of getCouponSetsForUser.
     */
    async getCouponSetsForRecipient(userId: string): Promise<ReceivedCouponSetSummary[]> {
      const { data, error } = await supabase
        .from('coupon_sets')
        .select('id, sender_name, status, created_at, templates(name), coupons(id, status)')
        .eq('recipient_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => {
        const template = Array.isArray(row.templates) ? row.templates[0] : row.templates
        return {
          id: row.id,
          sender_name: row.sender_name,
          status: row.status,
          created_at: row.created_at,
          templateName: template?.name ?? null,
          coupons: row.coupons,
        }
      })
    },

    /**
     * Full tracking detail for a single sent gift — everything Profile's
     * per-gift detail page needs (status timeline, per-coupon breakdown).
     * Scoped to the owning sender via user_id so a sender can never view
     * someone else's gift by guessing an id.
     */
    async getCouponSetDetailForSender(setId: string, userId: string): Promise<GiftTrackingDetail | null> {
      const { data, error } = await supabase
        .from('coupon_sets')
        .select(
          'id, recipient_name, status, created_at, opened_at, templates(name, slug), coupons(id, service_title, status, redeemed_at, sort_order)'
        )
        .eq('id', setId)
        .eq('user_id', userId)
        .single<{
          id: string
          recipient_name: string
          status: string
          created_at: string
          opened_at: string | null
          templates: { name: string; slug: string } | { name: string; slug: string }[] | null
          coupons: { id: string; service_title: string; status: string; redeemed_at: string | null; sort_order: number }[]
        }>()

      if (error || !data) return null

      const template = Array.isArray(data.templates) ? data.templates[0] : data.templates

      return {
        id: data.id,
        recipient_name: data.recipient_name,
        status: data.status,
        created_at: data.created_at,
        openedAt: data.opened_at,
        templateName: template?.name ?? null,
        templateSlug: template?.slug ?? null,
        coupons: [...data.coupons]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(({ id, service_title, status, redeemed_at }) => ({ id, service_title, status, redeemed_at })),
      }
    },

    /**
     * Generates a fresh 4-digit PIN for a set the given user owns, overwriting
     * pin_code so the old PIN stops verifying immediately. There is no way to
     * recover the original PIN instead — it's a bcrypt hash — so "view my PIN"
     * on Profile is really always a reset, never a reveal.
     */
    async resetPin(setId: string, userId: string): Promise<{ success: true; pin: string } | { success: false; error: string }> {
      const pin = String(randomInt(1000, 10000))
      const pinHash = await bcrypt.hash(pin, 10)

      const { data, error } = await supabase
        .from('coupon_sets')
        .update({ pin_code: pinHash })
        .eq('id', setId)
        .eq('user_id', userId)
        .select('id')
        .single<{ id: string }>()

      if (error || !data) return { success: false, error: GENERIC_ERROR }
      return { success: true, pin }
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

    /**
     * Claims an anonymously-created coupon set for the account of the person
     * who just signed up/logged in from the "Save this to your account"
     * prompt on GiftReadyScreen. Conditioned on user_id still being null so a
     * set already claimed by someone else can never be overwritten.
     */
    async linkSender(setId: string, userId: string): Promise<{ success: true } | { success: false; error: string }> {
      const { error } = await supabase.from('coupon_sets').update({ user_id: userId }).eq('id', setId).is('user_id', null)

      if (error) return { success: false, error: GENERIC_ERROR }
      return { success: true }
    },
  }
}
