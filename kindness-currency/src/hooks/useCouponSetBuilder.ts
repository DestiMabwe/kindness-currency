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

export type SavedResult = { setId: string; pin: string }

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
      setState((s) => ({
        ...s,
        selectedTemplateId: template.id,
        selectedTemplateSlug: slug,
        coupons: couponsFromTemplate(template),
        screen: 'details',
      }))
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
    if (!state.recipientName.trim()) return false
    setState((s) => ({ ...s, screen: 'edit' }))
    return true
  }, [state.recipientName])

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

  const hasSaveableDraft = state.screen === 'edit' && state.coupons.length === 8

  return {
    state,
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
    hasSaveableDraft,
  }
}
