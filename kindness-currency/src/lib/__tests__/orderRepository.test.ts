import { describe, it, expect, vi } from 'vitest'
import { createOrderRepository, groupUnconsumedInstances } from '../orderRepository'

describe('OrderRepository', () => {
  describe('createPendingOrder', () => {
    it('inserts a pending order and returns its id', async () => {
      const single = vi.fn().mockResolvedValue({ data: { id: 'order-1' }, error: null })
      const select = vi.fn().mockReturnValue({ single })
      const insert = vi.fn().mockReturnValue({ select })
      const from = vi.fn().mockReturnValue({ insert })
      const repo = createOrderRepository({ from } as never)

      const result = await repo.createPendingOrder({
        userId: 'user-1',
        email: 'alex@example.com',
        amountCents: 299,
        currency: 'USD',
        reference: 'kc_1',
        cartSnapshot: [{ slug: 'mothers_day', qty: 1 }],
      })

      expect(result).toEqual({ success: true, orderId: 'order-1' })
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', status: 'pending', amount_cents: 299, paystack_reference: 'kc_1' })
      )
    })

    it('returns an error result if the insert fails', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } })
      const select = vi.fn().mockReturnValue({ single })
      const insert = vi.fn().mockReturnValue({ select })
      const from = vi.fn().mockReturnValue({ insert })
      const repo = createOrderRepository({ from } as never)

      const result = await repo.createPendingOrder({
        userId: 'user-1',
        email: 'alex@example.com',
        amountCents: 299,
        currency: 'USD',
        reference: 'kc_1',
        cartSnapshot: [{ slug: 'mothers_day', qty: 1 }],
      })

      expect(result.success).toBe(false)
    })
  })

  describe('markOrderPaid', () => {
    it('returns true when the conditional update actually transitions a pending order', async () => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'order-1' }, error: null })
      const select = vi.fn().mockReturnValue({ maybeSingle })
      const eqStatus = vi.fn().mockReturnValue({ select })
      const eqId = vi.fn().mockReturnValue({ eq: eqStatus })
      const update = vi.fn().mockReturnValue({ eq: eqId })
      const from = vi.fn().mockReturnValue({ update })
      const repo = createOrderRepository({ from } as never)

      const won = await repo.markOrderPaid('order-1')

      expect(won).toBe(true)
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }))
      expect(eqId).toHaveBeenCalledWith('id', 'order-1')
      expect(eqStatus).toHaveBeenCalledWith('status', 'pending')
    })

    it('returns false — without erroring — when the order was already paid (no row matched)', async () => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
      const select = vi.fn().mockReturnValue({ maybeSingle })
      const eqStatus = vi.fn().mockReturnValue({ select })
      const eqId = vi.fn().mockReturnValue({ eq: eqStatus })
      const update = vi.fn().mockReturnValue({ eq: eqId })
      const from = vi.fn().mockReturnValue({ update })
      const repo = createOrderRepository({ from } as never)

      const won = await repo.markOrderPaid('order-1')

      expect(won).toBe(false)
    })
  })

  describe('grantPurchasedInstances', () => {
    it('resolves each cart line slug to a template_id and inserts one row per unit', async () => {
      const templatesEq = vi.fn().mockReturnThis()
      const templatesIn = vi.fn().mockResolvedValue({
        data: [{ id: 'tpl-1', slug: 'mothers_day' }],
        error: null,
      })
      const templatesSelect = vi.fn().mockReturnValue({ in: templatesIn, eq: templatesEq })
      const instancesInsert = vi.fn().mockResolvedValue({ error: null })
      const from = vi.fn((table: string) =>
        table === 'templates' ? { select: templatesSelect } : { insert: instancesInsert }
      )
      const repo = createOrderRepository({ from } as never)

      const result = await repo.grantPurchasedInstances('order-1', 'user-1', [{ slug: 'mothers_day', qty: 2 }])

      expect(result.success).toBe(true)
      const inserted = instancesInsert.mock.calls[0][0]
      expect(inserted).toHaveLength(2)
      expect(inserted.every((row: { template_id: string; user_id: string; order_id: string }) => row.template_id === 'tpl-1' && row.user_id === 'user-1' && row.order_id === 'order-1')).toBe(true)
    })

    it('fails without inserting anything when a slug does not resolve to a known template', async () => {
      const templatesIn = vi.fn().mockResolvedValue({ data: [], error: null })
      const templatesSelect = vi.fn().mockReturnValue({ in: templatesIn })
      const instancesInsert = vi.fn()
      const from = vi.fn((table: string) =>
        table === 'templates' ? { select: templatesSelect } : { insert: instancesInsert }
      )
      const repo = createOrderRepository({ from } as never)

      const result = await repo.grantPurchasedInstances('order-1', 'user-1', [{ slug: 'unknown-slug', qty: 1 }])

      expect(result.success).toBe(false)
      expect(instancesInsert).not.toHaveBeenCalled()
    })
  })

  describe('groupUnconsumedInstances', () => {
    it('groups repeated slugs into one row with a count, buying 3 of the same coupon book never limits sending all 3', () => {
      const instances = [
        { id: 'i1', slug: 'birthday' },
        { id: 'i2', slug: 'birthday' },
        { id: 'i3', slug: 'birthday' },
      ]

      expect(groupUnconsumedInstances(instances)).toEqual([{ slug: 'birthday', count: 3 }])
    })

    it('keeps distinct slugs as separate rows, in order of first appearance', () => {
      const instances = [
        { id: 'i1', slug: 'mothers_day' },
        { id: 'i2', slug: 'birthday' },
        { id: 'i3', slug: 'mothers_day' },
      ]

      expect(groupUnconsumedInstances(instances)).toEqual([
        { slug: 'mothers_day', count: 2 },
        { slug: 'birthday', count: 1 },
      ])
    })

    it('returns an empty array for no unconsumed instances', () => {
      expect(groupUnconsumedInstances([])).toEqual([])
    })
  })
})
