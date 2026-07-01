import { useCallback, useEffect, useRef, useState } from 'react'
import type { TemplateWithCoupons } from '@/lib/templateRepository'
import type { FontChoice, BackgroundEffect } from '@/schemas/couponSchema'
import type { TemplateSlug } from '@/constants/designTokens'

export type BuilderScreen = 'select' | 'details' | 'edit'

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

export type BuilderState = {
  screen: BuilderScreen
  selectedTemplateId: string | null
  selectedTemplateSlug: TemplateSlug | null
  senderName: string
  recipientName: string
  expiryDate: string
  coupons: BuilderCoupon[]
}

const DRAFT_STORAGE_KEY = 'kindness-currency:coupon-set-draft'

const initialState: BuilderState = {
  screen: 'select',
  selectedTemplateId: null,
  selectedTemplateSlug: null,
  senderName: '',
  recipientName: '',
  expiryDate: '',
  coupons: [],
}

function couponsFromTemplate(template: TemplateWithCoupons): BuilderCoupon[] {
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
    return JSON.parse(raw) as BuilderState
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
    if (!hydrated.current || typeof window === 'undefined') return
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

  const startEditing = useCallback(() => {
    if (!state.recipientName.trim()) return false
    setState((s) => ({ ...s, screen: 'edit' }))
    return true
  }, [state.recipientName])

  return {
    state,
    templateBySlug,
    loadTemplate,
    backToSelect,
    backToDetails,
    setSenderName,
    setRecipientName,
    setExpiryDate,
    startEditing,
  }
}
