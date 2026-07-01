import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCouponSetBuilder } from '../useCouponSetBuilder'
import type { TemplateWithCoupons } from '@/lib/templateRepository'

const DRAFT_KEY = 'kindness-currency:coupon-set-draft'

const mothersDay: TemplateWithCoupons = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  slug: 'mothers_day',
  name: "Mom's Promise Tokens",
  theme: 'Promise',
  color_mood: null,
  decorative_element: 'Flower',
  emotional_tone: null,
  is_age_restricted: false,
  is_active: true,
  sort_order: 1,
  template_coupons: [
    { id: 'c1', template_id: 'aaaaaaaa-0000-0000-0000-000000000001', sort_order: 1, service_title: 'One Home-Cooked Meal', micro_copy: 'Made with love', fine_print: 'No expiry' },
    { id: 'c2', template_id: 'aaaaaaaa-0000-0000-0000-000000000001', sort_order: 2, service_title: 'One Errand Run', micro_copy: "I'll handle it", fine_print: 'No questions asked' },
  ],
}

describe('useCouponSetBuilder', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('localStorage persistence', () => {
    it('persists draft state to localStorage when the builder state changes', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))

      act(() => result.current.loadTemplate('mothers_day'))

      const stored = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? 'null')
      expect(stored.selectedTemplateSlug).toBe('mothers_day')
      expect(stored.coupons).toHaveLength(2)
    })

    it('rehydrates builder state from localStorage on reload', () => {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          screen: 'details',
          selectedTemplateId: mothersDay.id,
          selectedTemplateSlug: 'mothers_day',
          senderName: 'Alex',
          recipientName: 'Mom',
          expiryDate: '',
          coupons: [],
        })
      )

      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))

      expect(result.current.state.senderName).toBe('Alex')
      expect(result.current.state.recipientName).toBe('Mom')
      expect(result.current.state.screen).toBe('details')
    })
  })

  describe('template selection', () => {
    it('seeds coupons from the template defaults and advances to the details screen', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))

      act(() => result.current.loadTemplate('mothers_day'))

      expect(result.current.state.screen).toBe('details')
      expect(result.current.state.coupons.map((c) => c.serviceTitle)).toEqual(['One Home-Cooked Meal', 'One Errand Run'])
    })
  })

  describe('startEditing', () => {
    it('refuses to advance to the edit screen without a recipient name', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))

      let advanced = true
      act(() => {
        advanced = result.current.startEditing()
      })

      expect(advanced).toBe(false)
      expect(result.current.state.screen).toBe('details')
    })

    it('advances to the edit screen once a recipient name is set', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))
      act(() => result.current.setRecipientName('Mom'))

      act(() => result.current.startEditing())

      expect(result.current.state.screen).toBe('edit')
    })
  })
})
