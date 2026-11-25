import type { SupabaseClient } from '@supabase/supabase-js'
import type { CartLineItem } from '@/lib/pricing'
import { DISCOUNT_ERRORS } from '@/lib/discount'

export type CreatePendingOrderInput = {
  userId: string
  email: string
  amountCents: number
  currency: string
  reference: string
  cartSnapshot: CartLineItem[]
  /** Set when a discount code was applied; amountCents is then the already-discounted charge. */
  discountCodeId?: string
  discountCents?: number
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

export type PendingPersonalization = { slug: string; count: number }

/** Groups unconsumed instances by template — a sender who bought 3 of the same coupon book sees
 * one row with a count, not 3 identical-looking rows, since consuming one is always just "the
 * oldest remaining one" (see create_coupon_set()'s FIFO pick) with no meaningful distinction
 * between copies until personalized. Order follows first appearance in the input (already
 * newest-first from getUnconsumedInstancesForUser). */
export function groupUnconsumedInstances(instances: { id: string; slug: string }[]): PendingPersonalization[] {
  const order: string[] = []
  const counts = new Map<string, number>()
  for (const { slug } of instances) {
    if (!counts.has(slug)) order.push(slug)
    counts.set(slug, (counts.get(slug) ?? 0) + 1)
  }
  return order.map((slug) => ({ slug, count: counts.get(slug)! }))
}

export function createOrderRepository(supabase: SupabaseClient) {
  return {
    async createPendingOrder(input: CreatePendingOrderInput): Promise<{ success: true; orderId: string } | { success: false; error: string }> {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: input.userId,
          email: input.email,
          amount_cents: input.amountCents,
          currency: input.currency,
          paystack_reference: input.reference,
          cart_snapshot: input.cartSnapshot,
          status: 'pending',
          // Only sent when a code was used, so an ordinary checkout never depends on these columns.
          ...(input.discountCodeId ? { discount_code_id: input.discountCodeId, discount_cents: input.discountCents ?? 0 } : {}),
        })
        .select('id')
        .single<{ id: string }>()

      if (error || !data) return { success: false, error: GENERIC_ERROR }
      return { success: true, orderId: data.id }
    },

    async getOrderByReference(reference: string) {
      const { data, error } = await supabase
        .from('orders')
        .select('id, user_id, status, cart_snapshot, amount_cents')
        .eq('paystack_reference', reference)
        .single<{ id: string; user_id: string; status: string; cart_snapshot: CartLineItem[]; amount_cents: number }>()

      if (error || !data) return null
      return data
    },

    /**
     * Marks a pending order paid via a single conditional update (status='pending' -> 'paid'), so
     * two concurrent callers (the webhook and the callback-page fallback both landing at once)
     * can't both think they "won" — only one update actually affects a row. Returns whether THIS
     * call was the one that transitioned it, which the caller uses to decide whether to grant
     * instances (only the winner should).
     */
    async markOrderPaid(orderId: string): Promise<boolean> {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle<{ id: string }>()

      if (error) return false
      return !!data
    },

    /** Marks a still-pending order failed — used when a free order's discount code is refused at
     * redemption (already used / exhausted), so no paid-looking row is left behind. */
    async markOrderFailed(orderId: string): Promise<void> {
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId).eq('status', 'pending')
    },

    /**
     * Records that an order used its discount code (no-op if it has none, or already recorded).
     * strict=true is for free orders: refuses an already-used or exhausted code. strict=false is for
     * Paystack orders, where the buyer has already paid: it records the use and never refuses. See
     * redeem_discount_for_order in the discount codes migration.
     */
    async redeemDiscountForOrder(orderId: string, strict: boolean): Promise<{ success: true } | { success: false; error: string }> {
      const { error } = await supabase.rpc('redeem_discount_for_order', { p_order_id: orderId, p_strict: strict })
      if (!error) return { success: true }
      if (error.message?.includes('CODE_ALREADY_USED')) return { success: false, error: DISCOUNT_ERRORS.alreadyUsed }
      if (error.message?.includes('CODE_EXHAUSTED')) return { success: false, error: DISCOUNT_ERRORS.exhausted }
      return { success: false, error: DISCOUNT_ERRORS.generic }
    },

    /**
     * Grants one purchased_instances row per unit in the order's cart_snapshot. Only ever called
     * right after markOrderPaid returns true for this order, so it can't run twice for the same
     * order. Resolves each line's slug to a template_id at grant time (not stashed at checkout
     * time) so this always reflects the current templates table.
     */
    async grantPurchasedInstances(orderId: string, userId: string, cartSnapshot: CartLineItem[]): Promise<{ success: boolean }> {
      const slugs = [...new Set(cartSnapshot.map((l) => l.slug))]
      const { data: templates, error: templatesError } = await supabase.from('templates').select('id, slug').in('slug', slugs)
      if (templatesError || !templates) return { success: false }

      const templateIdBySlug = Object.fromEntries(templates.map((t) => [t.slug, t.id]))
      const rows = cartSnapshot.flatMap((line) => {
        const templateId = templateIdBySlug[line.slug]
        if (!templateId) return []
        return Array.from({ length: line.qty }, () => ({
          user_id: userId,
          template_id: templateId,
          order_id: orderId,
        }))
      })
      if (rows.length === 0) return { success: false }

      const { error } = await supabase.from('purchased_instances').insert(rows)
      return { success: !error }
    },

    /** The sender's currently unconsumed, paid-for-later instances, newest first — the real
     * source of truth for /profile's "Ready to personalize" list and /create's gallery badges
     * (see groupUnconsumedInstances above). Enforcement of who actually gets to create a coupon
     * set happens in the create_coupon_set() Postgres function, not here. */
    async getUnconsumedInstancesForUser(userId: string): Promise<{ id: string; slug: string }[]> {
      const { data, error } = await supabase
        .from('purchased_instances')
        .select('id, templates(slug)')
        .eq('user_id', userId)
        .is('consumed_at', null)
        .order('created_at', { ascending: false })
        .returns<{ id: string; templates: { slug: string } | { slug: string }[] | null }[]>()

      if (error || !data) return []
      return data
        .map((row) => {
          const template = Array.isArray(row.templates) ? row.templates[0] : row.templates
          return template ? { id: row.id, slug: template.slug } : null
        })
        .filter((row): row is { id: string; slug: string } => row !== null)
    },
  }
}
