import { describe, it, expect } from 'vitest'
import { getOgImageContent } from '../ogImageContent'
import type { GiveCouponSet } from '../giveRepository'

const giveData = (overrides: Partial<GiveCouponSet> = {}): GiveCouponSet => ({
  id: 'set-1',
  sender_name: 'Alex',
  recipient_name: 'Mom',
  template_slug: 'mothers_day',
  expiry_date: null,
  recipient_user_id: null,
  sender_message: null,
  opened_at: null,
  reminder_frequency: null,
  coupons: [],
  ...overrides,
})

describe('getOgImageContent', () => {
  it('returns the recipient name, sender name, accent, and motif for a valid coupon set', () => {
    const result = getOgImageContent(giveData({ sender_name: 'Alex', recipient_name: 'Mom', template_slug: 'mothers_day' }))

    expect(result).toEqual({
      recipientName: 'Mom',
      senderName: 'Alex',
      accent: 'rgb(131, 131, 228)',
      motif: '❀',
    })
  })

  it('returns null for an unknown id, so the route can fall back to a generic image instead of crashing', () => {
    const result = getOgImageContent(null)

    expect(result).toBeNull()
  })

  it('never surfaces the sender message, even when one was written', () => {
    const result = getOgImageContent(giveData({ sender_message: 'A private note only the recipient should read.' }))

    expect(result).not.toHaveProperty('sender_message')
    expect(result).not.toHaveProperty('senderMessage')
    expect(JSON.stringify(result)).not.toContain('private note')
  })
})
