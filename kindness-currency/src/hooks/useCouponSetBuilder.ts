import { useCallback, useEffect, useRef, useState } from 'react'
import type { TemplateWithCoupons } from '@/lib/templateRepository'
import type { FontChoice, BackgroundEffect, SaveCouponSetInput } from '@/schemas/couponSchema'
import type { TemplateSlug } from '@/constants/designTokens'

export type BuilderScreen = 'select' | 'details' | 'edit' | 'giftReady'

export type BuilderCoupon = {
  id: string
  sortOrder: number
  serviceTitle: string
  microCopy: string
  finePrint: string
  fontChoice: FontChoice
  backgroundColor: string
  backgroundEffect: BackgroundEffect
}

/**
 * wasLinkedAtSave records whether the sender was already logged in at the
 * moment of saving (so the set's user_id was set at creation) — distinct from
 * whatever the viewer's login state happens to be on a later render/reload,
 * which is what actually decides whether the "save to your account" banner
 * still needs to offer claiming it.
 */
export type SavedResult = { setId: string; pin: string; wasLinkedAtSave: boolean }

export type BuilderState = {
  screen: BuilderScreen
  selectedTemplateId: string | null
  selectedTemplateSlug: TemplateSlug | null
  senderName: string
  recipientName: string
  expiryDate: string
  senderMessage: string
  coupons: BuilderCoupon[]
  savedResult: SavedResult | null
}

const DRAFT_STORAGE_KEY = 'kindness-currency:coupon-set-draft'

const initialState: BuilderState = {
  screen: 'select',
  selectedTemplateId: null,
  selectedTemplateSlug: null,
  senderName: '',
  recipientName: '',
  expiryDate: '',
  senderMessage: '',
  coupons: [],
  savedResult: null,
}

export function couponsFromTemplate(template: TemplateWithCoupons): BuilderCoupon[] {
  return template.template_coupons.map((c) => ({
    id: c.id,
    sortOrder: c.sort_order,
    serviceTitle: c.service_title,
    microCopy: c.micro_copy ?? '',
    finePrint: c.fine_print ?? '',
    fontChoice: 'playfair',
    backgroundColor: '#FFF8F0',
    backgroundEffect: 'none',
  }))
}

function loadDraft(): BuilderState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    // Merge onto initialState so a draft saved before a field existed (e.g.
    // senderMessage) still rehydrates with a valid default instead of undefined.
    return { ...initialState, ...JSON.parse(raw) } as BuilderState
  } catch {
    return null
  }
}

export function useCouponSetBuilder(templates: TemplateWithCoupons[]) {
  const [state, setState] = useState<BuilderState>(initialState)
  const [resumedDraft, setResumedDraft] = useState(false)
  const hydrated = useRef(false)

  // Rehydrate from localStorage once, after mount. Reading in render (e.g. a lazy
  // useState initializer) would make the client's first render diverge from the
  // server-rendered HTML and break hydration, so this has to happen in an effect.
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const draft = loadDraft()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-hydration sync from localStorage, not a render-time update
    if (draft) setState(draft)
    // A draft still on the select screen (nothing chosen yet) isn't "mid-progress" —
    // only flag drafts a "start fresh" affordance would actually need to discard.
    if (draft && draft.screen !== 'select') setResumedDraft(true)
  }, [])

  useEffect(() => {
    if (!hydrated.current || typeof window === 'undefined' || state.screen === 'giftReady') return
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const templateBySlug = useCallback((slug: TemplateSlug) => templates.find((t) => t.slug === slug), [templates])

  const loadTemplate = useCallback(
    (slug: TemplateSlug) => {
      const template = templateBySlug(slug)
      if (!template) return
      setState((s) => {
        // Re-selecting the template already in progress (e.g. backing up to browse
        // then tapping it again) must resume the existing customization rather than
        // wiping it back to template defaults — only a genuinely different template
        // should regenerate fresh coupons.
        const isSameTemplate = s.selectedTemplateId === template.id
        // "In progress" for skip-the-form purposes matches startEditing's own bar:
        // the form was already completed, so there's real customizing to resume.
        const namesFilled = Boolean(s.senderName.trim() && s.recipientName.trim())
        return {
          ...s,
          selectedTemplateId: template.id,
          selectedTemplateSlug: slug,
          coupons: isSameTemplate ? s.coupons : couponsFromTemplate(template),
          screen: isSameTemplate && namesFilled ? 'edit' : 'details',
        }
      })
    },
    [templateBySlug]
  )

  const backToSelect = useCallback(() => setState((s) => ({ ...s, screen: 'select' })), [])
  const backToDetails = useCallback(() => setState((s) => ({ ...s, screen: 'details' })), [])

  const setSenderName = useCallback((senderName: string) => setState((s) => ({ ...s, senderName })), [])
  const setRecipientName = useCallback((recipientName: string) => setState((s) => ({ ...s, recipientName })), [])
  const setExpiryDate = useCallback((expiryDate: string) => setState((s) => ({ ...s, expiryDate })), [])
  const setSenderMessage = useCallback((senderMessage: string) => setState((s) => ({ ...s, senderMessage })), [])

  const startEditing = useCallback(() => {
    if (!state.senderName.trim() || !state.recipientName.trim()) return false
    setState((s) => ({ ...s, screen: 'edit' }))
    return true
  }, [state.senderName, state.recipientName])

  const patchCoupon = useCallback((id: string, patch: Partial<BuilderCoupon>) => {
    setState((s) => ({ ...s, coupons: s.coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }, [])

  const patchAllCoupons = useCallback((patch: Partial<Pick<BuilderCoupon, 'backgroundColor' | 'backgroundEffect'>>) => {
    setState((s) => ({ ...s, coupons: s.coupons.map((c) => ({ ...c, ...patch })) }))
  }, [])

  const toSavePayload = useCallback((): SaveCouponSetInput | null => {
    if (!state.selectedTemplateId || state.coupons.length === 0) return null
    return {
      template_id: state.selectedTemplateId,
      sender_name: state.senderName,
      recipient_name: state.recipientName,
      ...(state.expiryDate ? { expiry_date: state.expiryDate } : {}),
      ...(state.senderMessage?.trim() ? { sender_message: state.senderMessage.trim() } : {}),
      coupons: state.coupons.map((c) => ({
        service_title: c.serviceTitle,
        micro_copy: c.microCopy,
        fine_print: c.finePrint,
        font_choice: c.fontChoice,
        background_color: c.backgroundColor,
        background_effect: c.backgroundEffect,
        sort_order: c.sortOrder,
      })),
    }
  }, [state])

  const completeSave = useCallback((result: SavedResult) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    setState((s) => ({ ...s, screen: 'giftReady', savedResult: result }))
  }, [])

  const startNewSet = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    setState(initialState)
  }, [])

  return {
    state,
    resumedDraft,
    templateBySlug,
    loadTemplate,
    backToSelect,
    backToDetails,
    setSenderName,
    setRecipientName,
    setExpiryDate,
    setSenderMessage,
    startEditing,
    patchCoupon,
    patchAllCoupons,
    toSavePayload,
    completeSave,
    startNewSet,
  }
}
