import type { SupabaseClient } from '@supabase/supabase-js'
import type { CartLineItem } from '@/lib/pricing'

export type CreatePendingOrderInput = {
  userId: string
  email: string
  amountCents: number
  currency: string
  reference: string
  cartSnapshot: CartLineItem[]
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

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

    /** The sender's currently unconsumed, paid-for-later instances, newest first — purely a
     * display cache source (see cart.ts's syncPurchasedInstancesFromServer); enforcement of who
     * gets to create a coupon set happens in the create_coupon_set() Postgres function, not here. */
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
