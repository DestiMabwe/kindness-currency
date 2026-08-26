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
          savedResult: null,
        })
      )

      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))

      expect(result.current.state.senderName).toBe('Alex')
      expect(result.current.state.recipientName).toBe('Mom')
      expect(result.current.state.screen).toBe('details')
    })

    it('fills in a default senderMessage when rehydrating a draft saved before that field existed', () => {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          screen: 'edit',
          selectedTemplateId: mothersDay.id,
          selectedTemplateSlug: 'mothers_day',
          senderName: 'Alex',
          recipientName: 'Mom',
          expiryDate: '',
          coupons: [],
          savedResult: null,
          // senderMessage intentionally omitted, simulating a pre-existing draft
        })
      )

      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))

      expect(result.current.state.senderMessage).toBe('')
      expect(() => result.current.toSavePayload()).not.toThrow()
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

  describe('patchCoupon', () => {
    it('updates only the targeted coupon, leaving the others untouched', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))

      act(() => result.current.patchCoupon('c1', { serviceTitle: 'One Homemade Feast', fontChoice: 'dm-sans' }))

      expect(result.current.state.coupons[0]).toMatchObject({ id: 'c1', serviceTitle: 'One Homemade Feast', fontChoice: 'dm-sans' })
      expect(result.current.state.coupons[1]).toMatchObject({ id: 'c2', serviceTitle: 'One Errand Run' })
    })
  })

  describe('patchAllCoupons', () => {
    it('applies a color/effect patch to every coupon at once', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))

      act(() => result.current.patchAllCoupons({ backgroundColor: '#DCEEE8', backgroundEffect: 'confetti' }))

      expect(result.current.state.coupons).toHaveLength(2)
      for (const coupon of result.current.state.coupons) {
        expect(coupon.backgroundColor).toBe('#DCEEE8')
        expect(coupon.backgroundEffect).toBe('confetti')
      }
    })

    it('does not touch text fields', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))

      act(() => result.current.patchAllCoupons({ backgroundColor: '#DCEEE8' }))

      expect(result.current.state.coupons[0].serviceTitle).toBe('One Home-Cooked Meal')
    })
  })

  describe('toSavePayload', () => {
    it('builds a save payload matching SaveCouponSetInputSchema', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))
      act(() => result.current.setSenderName('Alex'))
      act(() => result.current.setRecipientName('Mom'))

      const payload = result.current.toSavePayload()

      expect(payload).toMatchObject({
        template_id: mothersDay.id,
        sender_name: 'Alex',
        recipient_name: 'Mom',
      })
      expect(payload?.coupons).toHaveLength(2)
      expect(payload).not.toHaveProperty('expiry_date')
    })

    it('omits expiry_date when unset rather than sending an empty string', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))

      expect(result.current.toSavePayload()).not.toHaveProperty('expiry_date')
    })

    it('includes the trimmed sender_message when one was written', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))
      act(() => result.current.setSenderMessage('  Thinking of you every day.  '))

      expect(result.current.toSavePayload()).toMatchObject({ sender_message: 'Thinking of you every day.' })
    })

    it('omits sender_message when left blank, rather than sending an empty string', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))

      expect(result.current.toSavePayload()).not.toHaveProperty('sender_message')
    })

    it('omits sender_message when it is only whitespace', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))
      act(() => result.current.setSenderMessage('   '))

      expect(result.current.toSavePayload()).not.toHaveProperty('sender_message')
    })
  })

  describe('completeSave', () => {
    it('moves to the giftReady screen, stores the result, and clears the localStorage draft', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))

      act(() => result.current.completeSave({ setId: 'set-1', pin: '4821' }))

      expect(result.current.state.screen).toBe('giftReady')
      expect(result.current.state.savedResult).toEqual({ setId: 'set-1', pin: '4821' })
      expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull()
    })
  })

  describe('startNewSet', () => {
    it('resets back to the select screen and clears the saved result', () => {
      const { result } = renderHook(() => useCouponSetBuilder([mothersDay]))
      act(() => result.current.loadTemplate('mothers_day'))
      act(() => result.current.completeSave({ setId: 'set-1', pin: '4821' }))

      act(() => result.current.startNewSet())

      expect(result.current.state.screen).toBe('select')
      expect(result.current.state.savedResult).toBeNull()
      expect(result.current.state.coupons).toHaveLength(0)
      // The persistence effect re-writes the (now-empty) draft on the next render, which is
      // harmless — hasSaveableDraft is false for a fresh 'select' screen, so nothing auto-resumes.
      expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? 'null')).toMatchObject({ screen: 'select', coupons: [] })
    })
  })
})
