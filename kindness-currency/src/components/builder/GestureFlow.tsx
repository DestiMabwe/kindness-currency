'use client'

// The "Who's it for?" + personalize flow for a chosen single-use gesture.
// Reuses DetailsFormScreen/ColorSwatchPicker/EffectPillPicker/EditMessageModal straight from the
// real CouponSetBuilder (exported there for this purpose) so steps 2 and the message-editing path
// are pixel-identical to the bundle flow. Step 3 is a lighter, single-card variant of the real
// EditScreen — no 8-coupon grid, no "style all 8 the same" — but carries the same preview,
// customized-tracking, and revisit-message features the bundle flow has, so the single-gesture
// path doesn't feel like a lesser product.
//
// Free vs. paid text editing: free gestures are look-only (title/micro-copy/fine-print locked),
// paid gestures unlock the same three text fields the bundle flow edits — see the isPaid checks
// in the 'personalize' step below. Paid gestures also get a gesture-specific message-starter
// suggestion (gesture.messageStarter) on both message-writing surfaces — the step 2 form and the
// step 3 edit-message modal.
//
// Save My Coupons writes a free draft (status='draft'); Send with Love writes status='sent' and,
// for a paid gesture or an unlocked-for-customization free one, requires real payment via Paystack
// first (see performSave's paymentRequired branch) — both go through the same saveDraftAction/
// sendCouponSetAction the bundle flow uses (templateId comes from the real single-use `templates`
// row seeded for this gesture's slug — see CouponSetBuilder's singleUseTemplateIdBySlug). No
// upfront login check, mirroring the bundle flow: a free draft or an unmodified free gesture needs
// no account at all, same as an anonymous /give/[id] recipient. AuthGate only opens if performSave
// comes back paymentRequired — the one point that genuinely needs a userId/email for Paystack —
// since every real auth path here is a full page redirect, not an inline verification.
// The in-progress draft persists to localStorage — keyed by gesture slug, hydrated in an effect
// (never a lazy useState initializer, which would desync the client's first render from the
// server-rendered HTML and break hydration) — and a pending-save-intent flag lets the save resume
// automatically once the auth or Paystack redirect lands the sender back here, instead of making
// them tap Save/Send twice.

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { GoldCoupon } from '@/components/builder/GoldCoupon'
import { ColorSwatchPicker, DetailsFormScreen, EffectPillPicker, EditMessageModal } from '@/components/builder/CouponSetBuilder'
import { PreviewOverlay } from '@/components/coupon/PreviewOverlay'
import { GiftReadyScreen } from '@/components/shared/GiftReadyScreen'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'
import { antiqueGold, antiqueGoldText, type SingleUseGesture, type SingleUseGestureSlug } from '@/lib/singleUseGestures'
import { REGION_GESTURE_UNLOCK_PRICE, gesturePriceForRegion, formatPrice, type PricingRegion } from '@/lib/geoPricing'
import { saveDraftAction, sendCouponSetAction, initiateSendCheckoutAction, verifyCheckoutAction } from '@/app/create/actions'
import { resumePaystackCheckout } from '@/lib/paystack/inline'
import { SERVICE_TITLE_MAX_LENGTH } from '@/schemas/couponSchema'
import type { BackgroundEffect } from '@/schemas/couponSchema'
import type { BuilderCoupon, SavedResult } from '@/hooks/useCouponSetBuilder'

const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

type Step = 'details' | 'personalize' | 'done'

type Draft = {
  serviceTitle: string
  microCopy: string
  finePrint: string
  backgroundColor: string | null
  backgroundEffect: BackgroundEffect
}

type PersistedGestureDraft = {
  gestureSlug: SingleUseGestureSlug
  step: Step
  senderName: string
  recipientName: string
  expiryDate: string
  senderMessage: string
  draft: Draft
  unlocked: boolean
}

const GESTURE_DRAFT_KEY = 'kindness-currency:gesture-draft'
// Set right before opening AuthGate from Save/Send, so the auth redirect's reload knows to finish
// the save automatically once the sender is logged in — mirrors CouponSetBuilder's own
// PENDING_SAVE_INTENT_KEY for the bundle flow.
const GESTURE_PENDING_SAVE_INTENT_KEY = 'kindness-currency:gesture-pending-save-intent'
const CHECKOUT_POPUP_ERROR = 'Could not open the payment window. Please try again.'

function readPersistedGestureDraft(): PersistedGestureDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(GESTURE_DRAFT_KEY)
    return raw ? (JSON.parse(raw) as PersistedGestureDraft) : null
  } catch {
    return null
  }
}

/** Which gesture (if any) has an in-progress draft — lets TemplateSelectScreen decide whether to
 * resume straight into GestureFlow on mount instead of showing the gallery. */
export function peekPersistedGestureSlug(): SingleUseGestureSlug | null {
  return readPersistedGestureDraft()?.gestureSlug ?? null
}

function clearPersistedGestureDraft() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(GESTURE_DRAFT_KEY)
}

// The confirm step behind the "Make This Gift Yours" upsell — mirrors the bottom-sheet confirm
// pattern used elsewhere (e.g. CouponSetBuilder's TemplateSwitchWarningModal). Confirming here only
// unlocks the text fields for editing; the actual GESTURE_UNLOCK_PRICE charge happens later, at
// Send time, via the same Paystack redirect the paid-from-start gestures use (see performSave).
function GestureUnlockConfirm({
  formattedPrice,
  onConfirm,
  onDismiss,
}: {
  formattedPrice: string
  onConfirm: () => void
  onDismiss: () => void
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onDismiss)

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gesture-unlock-heading"
        className="w-full rounded-t-[26px] bg-[#FFF8F0] px-6 pt-7 pb-8"
      >
        <h2 id="gesture-unlock-heading" className="text-2xl font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.gestureUnlockConfirmHeading}
        </h2>
        <div className="mt-3 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-85">{ctaCopy.gestureUnlockConfirmBody}</div>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white"
        >
          {ctaCopy.gestureUnlockConfirmCta(formattedPrice)}
        </button>
        <button type="button" onClick={onDismiss} className="mt-2 w-full p-1.5 text-center font-sans text-[13.5px] font-semibold text-[#2C2C2C] opacity-70">
          {ctaCopy.gestureUnlockDismiss}
        </button>
      </div>
    </div>
  )
}

export function GestureFlow({
  gesture,
  templateId,
  isLoggedIn,
  region,
  onExit,
}: {
  gesture: SingleUseGesture
  templateId: string | null
  isLoggedIn: boolean
  region: PricingRegion
  onExit: () => void
}) {
  const [step, setStep] = useState<Step>('details')
  const [senderName, setSenderName] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [senderMessage, setSenderMessage] = useState('')
  const [draft, setDraft] = useState<Draft>({
    serviceTitle: gesture.serviceTitle,
    microCopy: gesture.microCopy,
    finePrint: gesture.finePrint,
    backgroundColor: '#FFF8F0',
    backgroundEffect: 'none',
  })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editMessageOpen, setEditMessageOpen] = useState(false)
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null)
  const hydrated = useRef(false)
  const attemptedSaveResume = useRef(false)

  // Rehydrate from localStorage once, after mount — reading it during render (e.g. a lazy
  // useState initializer) would make the client's first render diverge from the server-rendered
  // HTML and break hydration, so this has to happen in an effect (mirrors useCouponSetBuilder).
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const persisted = readPersistedGestureDraft()
    if (!persisted || persisted.gestureSlug !== gesture.slug) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-mount rehydration from localStorage, not a render-time update
    setStep(persisted.step)
    setSenderName(persisted.senderName)
    setRecipientName(persisted.recipientName)
    setExpiryDate(persisted.expiryDate)
    setSenderMessage(persisted.senderMessage)
    setDraft(persisted.draft)
    setUnlocked(persisted.unlocked)
  }, [gesture.slug])

  // Keeps the draft resumable across the full-page reload every auth path here causes — including
  // the "Make This Gift Yours" unlock, so a sender who unlocks and then hits Save/Send's own auth
  // redirect doesn't land back on a re-locked coupon. Skips writing once a real save has landed
  // (step 'done') — completeSave-equivalent below already clears this key, and there's nothing
  // left worth resuming into.
  useEffect(() => {
    if (typeof window === 'undefined' || step === 'done') return
    const payload: PersistedGestureDraft = {
      gestureSlug: gesture.slug,
      step,
      senderName,
      recipientName,
      expiryDate,
      senderMessage,
      draft,
      unlocked,
    }
    window.localStorage.setItem(GESTURE_DRAFT_KEY, JSON.stringify(payload))
  }, [gesture.slug, step, senderName, recipientName, expiryDate, senderMessage, draft, unlocked])

  // Free gestures are look-only: title/micro-copy/fine-print stay fixed to the curated
  // "GOOD FOR ONE X" wording, and only background colour/effect are editable — that restriction is
  // the reason they're free. Paying unlocks full text customization too, same as the 8-coupon
  // bundle flow — either by picking an already-paid gesture, or by paying the same $1.99 in-flow
  // to unlock a free one (the "Make This Gift Yours" upsell), which is per-send only: it doesn't
  // persist beyond this one gift.
  const isPaid = gesture.price > 0 || unlocked
  // Same price as the gestures that are paid from the start (see ctaCopy.gestureUnlockCta) —
  // unlocking doesn't get its own separate price point.
  const displayPrice = unlocked ? REGION_GESTURE_UNLOCK_PRICE[region] : gesturePriceForRegion(gesture, region)
  const isCustomized =
    draft.backgroundColor !== '#FFF8F0' ||
    draft.backgroundEffect !== 'none' ||
    (isPaid &&
      (draft.serviceTitle !== gesture.serviceTitle ||
        draft.microCopy !== gesture.microCopy ||
        draft.finePrint !== gesture.finePrint))

  const previewCoupon: BuilderCoupon = {
    id: gesture.slug,
    sortOrder: 0,
    serviceTitle: draft.serviceTitle,
    microCopy: draft.microCopy,
    finePrint: draft.finePrint,
    fontChoice: 'playfair',
    backgroundColor: draft.backgroundColor ?? '#FFF8F0',
    backgroundEffect: draft.backgroundEffect,
  }

  // 'draft' is always free. 'sent' requires payment whenever isPaid is true (a gesture that's
  // paid from the start, or an unlocked-for-customization free one) — if sendCouponSetAction comes
  // back paymentRequired, this redirects to Paystack instead of showing an error, charging
  // the region's gesture-unlock price instead of the gesture's own (zero) base price when
  // unlocked (see resolveCheckoutPrice in pricing.ts). Mirrors CouponSetBuilder's identical pattern.
  const performSave = async (intent: 'draft' | 'sent') => {
    if (!templateId) {
      setSaveError('Something went wrong. Please try again.')
      return
    }
    setSaving(true)
    setSaveError('')
    const payload = {
      template_id: templateId,
      sender_name: senderName,
      recipient_name: recipientName,
      ...(expiryDate ? { expiry_date: expiryDate } : {}),
      ...(senderMessage.trim() ? { sender_message: senderMessage.trim() } : {}),
      gesture_unlocked: unlocked,
      coupons: [
        {
          service_title: draft.serviceTitle,
          micro_copy: draft.microCopy,
          fine_print: draft.finePrint,
          font_choice: 'playfair' as const,
          background_color: draft.backgroundColor ?? undefined,
          background_effect: draft.backgroundEffect,
          sort_order: 1,
        },
      ],
    }
    const result = await (intent === 'draft' ? saveDraftAction(payload) : sendCouponSetAction(payload))

    if (!result.success && result.paymentRequired) {
      if (typeof window !== 'undefined') window.localStorage.setItem(GESTURE_PENDING_SAVE_INTENT_KEY, intent)
      // Payment is the one thing that genuinely requires an account (Paystack checkout needs a
      // userId/email to attribute the order to) — this is the only point in the flow that should
      // ever interrupt with AuthGate, not Save/Send generally (a free draft or an unmodified free
      // gesture needs no account at all, same as an anonymous /give/[id] recipient).
      if (!isLoggedIn) {
        setSaving(false)
        setAuthOpen(true)
        return
      }
      const checkout = await initiateSendCheckoutAction(gesture.slug, unlocked ? 'gestureUnlock' : 'base')
      if (!checkout.success) {
        setSaving(false)
        if (typeof window !== 'undefined') window.localStorage.removeItem(GESTURE_PENDING_SAVE_INTENT_KEY)
        setSaveError(checkout.error)
        return
      }
      // The pending-intent flag set above stays untouched until the popup actually resolves — it's
      // the fallback the mount-effect resume below relies on if Paystack ever has to fall back to a
      // real page redirect (some cards can't complete inside the iframe, e.g. certain 3D Secure
      // flows) instead of resolving inline via onSuccess/onCancel/onError here.
      try {
        await resumePaystackCheckout(checkout.accessCode, {
          onSuccess: async (response) => {
            if (typeof window !== 'undefined') window.localStorage.removeItem(GESTURE_PENDING_SAVE_INTENT_KEY)
            const verified = await verifyCheckoutAction(response.reference)
            if (!verified.paid) {
              setSaving(false)
              setSaveError("Your payment wasn't completed, so this wasn't sent. Feel free to try again.")
              return
            }
            void performSave(intent)
          },
          onCancel: () => {
            if (typeof window !== 'undefined') window.localStorage.removeItem(GESTURE_PENDING_SAVE_INTENT_KEY)
            setSaving(false)
          },
          onError: (error) => {
            if (typeof window !== 'undefined') window.localStorage.removeItem(GESTURE_PENDING_SAVE_INTENT_KEY)
            setSaving(false)
            setSaveError(error.message || CHECKOUT_POPUP_ERROR)
          },
        })
      } catch {
        if (typeof window !== 'undefined') window.localStorage.removeItem(GESTURE_PENDING_SAVE_INTENT_KEY)
        setSaving(false)
        setSaveError(CHECKOUT_POPUP_ERROR)
      }
      return
    }

    setSaving(false)
    if (!result.success) {
      setSaveError(result.error)
      return
    }
    clearPersistedGestureDraft()
    setSavedResult({ setId: result.id, pin: result.pin, wasLinkedAtSave: isLoggedIn })
    setStep('done')
  }

  // No upfront login check — a free draft or an unmodified free gesture needs no account at all;
  // performSave only opens AuthGate if the save actually comes back paymentRequired.
  const handleSaveOrSend = (intent: 'draft' | 'sent') => {
    void performSave(intent)
  }

  // Completes a save the sender started before AuthGate or a Paystack checkout interrupted them —
  // mirrors CouponSetBuilder's identical resume effect. A `?reference=` in the URL means this is
  // specifically a return from Paystack, verified first before resuming; an unpaid result stops
  // here with an explanatory error instead of silently bouncing them to another checkout. Gated on
  // step === 'personalize' since a pending intent's draft must still be hydrating (from 'details')
  // until the rehydration effect above actually lands it there.
  useEffect(() => {
    if (attemptedSaveResume.current || !isLoggedIn) return
    if (typeof window === 'undefined') return
    const intent = window.localStorage.getItem(GESTURE_PENDING_SAVE_INTENT_KEY)
    if (intent !== 'draft' && intent !== 'sent') return
    if (step !== 'personalize') return
    attemptedSaveResume.current = true
    window.localStorage.removeItem(GESTURE_PENDING_SAVE_INTENT_KEY)

    const url = new URL(window.location.href)
    const reference = url.searchParams.get('reference')
    if (reference) {
      url.searchParams.delete('reference')
      window.history.replaceState({}, '', url.toString())
    }

    const resume = async () => {
      if (reference) {
        const verified = await verifyCheckoutAction(reference)
        if (!verified.paid) {
          setSaveError("Your payment wasn't completed, so this wasn't sent. Feel free to try again.")
          return
        }
      }
      void performSave(intent)
    }
    void resume()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- performSave is stable per render and would cause an infinite loop if included
  }, [isLoggedIn, step])

  const handleExit = () => {
    clearPersistedGestureDraft()
    onExit()
  }

  if (step === 'details') {
    return (
      <DetailsFormScreen
        templateName={gesture.serviceTitle}
        senderName={senderName}
        recipientName={recipientName}
        expiryDate={expiryDate}
        senderMessage={senderMessage}
        messageStarter={isPaid ? gesture.messageStarter : undefined}
        onBack={handleExit}
        onSenderChange={setSenderName}
        onRecipientChange={setRecipientName}
        onExpiryChange={setExpiryDate}
        onSenderMessageChange={setSenderMessage}
        onContinue={() => setStep('personalize')}
      />
    )
  }

  if (step === 'done' && savedResult) {
    return (
      <GiftReadyScreen
        shareLink={`${window.location.origin}/give/${savedResult.setId}`}
        pin={savedResult.pin}
        senderName={senderName}
        recipientName={recipientName}
        onStartOver={handleExit}
      />
    )
  }

  return (
    <div className="pb-5">
      <button
        type="button"
        onClick={() => setEditMessageOpen(true)}
        aria-label={senderMessage.trim() ? ctaCopy.editMessageEditLabel : ctaCopy.editMessageWriteLabel}
        className="fixed top-4 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-[#1A1A2E]/10 bg-white text-lg text-[#1A1A2E]"
      >
        ✉
      </button>

      <div className="sticky top-0 z-30 border-b border-[#1A1A2E]/7 bg-[#FFF8F0]/92 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4.5 pt-11.5 pb-3">
          <button type="button" onClick={() => setStep('details')} className="p-1 text-xl text-[#1A1A2E]" aria-label="Back">
            ‹
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-sans text-[13px] font-semibold tracking-[0.04em] text-[#2C2C2C] uppercase opacity-60">
              Step 3 of 3 · {gesture.serviceTitle}
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#2C2C2C] opacity-60">
              For {recipientName || 'them'} · from {senderName || 'you'} ·{' '}
              <span style={{ color: antiqueGoldText, fontWeight: 700 }}>{displayPrice === 0 ? 'Free' : formatPrice(displayPrice, region)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4.5 pt-4.5">
        <div className="overflow-hidden rounded-[20px] border border-[#1A1A2E]/7 bg-white shadow-[0_12px_28px_-22px_rgba(26,26,46,0.55)]">
          <div className="px-3.5 pb-3.5 pt-4">
            <GoldCoupon
              serviceTitle={draft.serviceTitle}
              microCopy={draft.microCopy}
              finePrint={draft.finePrint}
              backgroundColor={draft.backgroundColor}
              backgroundEffect={draft.backgroundEffect}
              status="sent"
              motif={gesture.motif}
              imageSrc={null}
              expiresAt={expiryDate || null}
            />

            <div className="mt-2.5 text-[11px] font-semibold" style={{ color: isCustomized ? '#2E7D6B' : '#2C2C2C', opacity: isCustomized ? 1 : 0.5 }}>
              {isCustomized ? ctaCopy.gestureCustomizedLabel : ctaCopy.gestureDefaultLabel}
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
              <input
                value={draft.serviceTitle}
                onChange={isPaid ? (e) => setDraft((d) => ({ ...d, serviceTitle: e.target.value })) : undefined}
                aria-label="Service title"
                aria-describedby={isPaid ? undefined : 'gesture-text-locked-hint'}
                maxLength={SERVICE_TITLE_MAX_LENGTH}
                disabled={!isPaid}
                readOnly={!isPaid}
                className="w-full rounded-[10px] border border-[#1A1A2E]/12 p-2.5 text-[15px] font-bold text-[#1A1A2E] italic outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ fontFamily: 'var(--font-playfair)', backgroundColor: isPaid ? '#FFF8F0' : '#F0ECE4' }}
              />
              <input
                value={draft.microCopy}
                onChange={isPaid ? (e) => setDraft((d) => ({ ...d, microCopy: e.target.value })) : undefined}
                aria-label="Micro copy"
                aria-describedby={isPaid ? undefined : 'gesture-text-locked-hint'}
                disabled={!isPaid}
                readOnly={!isPaid}
                className="w-full rounded-[10px] border border-[#1A1A2E]/12 p-2.5 text-[13px] text-[#2C2C2C] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: isPaid ? '#FFF8F0' : '#F0ECE4' }}
              />
              <input
                value={draft.finePrint}
                onChange={isPaid ? (e) => setDraft((d) => ({ ...d, finePrint: e.target.value })) : undefined}
                aria-label="Fine print"
                aria-describedby={isPaid ? undefined : 'gesture-text-locked-hint'}
                disabled={!isPaid}
                readOnly={!isPaid}
                className="w-full rounded-[10px] border border-[#1A1A2E]/12 p-2 text-[11.5px] text-[#2C2C2C] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: isPaid ? '#FFF8F0' : '#F0ECE4' }}
              />
              {isPaid ? null : (
                <button
                  type="button"
                  id="gesture-text-locked-hint"
                  onClick={() => setUnlockConfirmOpen(true)}
                  className="w-full rounded-[10px] border-[1.5px] border-dashed border-[#D4AF37] p-2.5 text-center font-sans text-[12.5px] font-bold text-[#8B6F1F]"
                >
                  {ctaCopy.gestureUnlockCta(formatPrice(REGION_GESTURE_UNLOCK_PRICE[region], region))}
                </button>
              )}
            </div>

            <div className="mt-3.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-[46px] shrink-0 text-[10px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-50">
                  Colour
                </span>
                <ColorSwatchPicker
                  value={draft.backgroundColor}
                  accent={antiqueGold}
                  onChange={(color) => setDraft((d) => ({ ...d, backgroundColor: color }))}
                />
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-[46px] shrink-0 text-[10px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-50">
                  Effect
                </span>
                <EffectPillPicker
                  value={draft.backgroundEffect}
                  accent={antiqueGold}
                  onChange={(effect) => setDraft((d) => ({ ...d, backgroundEffect: effect }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-40 mt-3.5 flex flex-col gap-2.5 border-t border-[#1A1A2E]/8 bg-[#FFF8F0]/94 px-4.5 pt-3.5 pb-4 backdrop-blur">
        {saveError && <div className="text-center text-[12.5px] text-[#C2185B]">{saveError}</div>}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="w-full rounded-[13px] border-[1.5px] border-[#1A1A2E] p-3 font-sans text-sm font-semibold text-[#1A1A2E]"
        >
          {ctaCopy.gesturePreviewCta}
        </button>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveOrSend('draft')}
            disabled={saving}
            className="flex-1 rounded-[13px] border-[1.5px] border-[#C2185B] p-3.5 font-sans text-sm font-bold text-[#C2185B] disabled:opacity-50"
          >
            {ctaCopy.saveMyCoupons}
          </button>
          <button
            type="button"
            onClick={() => handleSaveOrSend('sent')}
            disabled={saving}
            className="flex-[1.3] rounded-[13px] bg-[#C2185B] p-3.5 font-sans text-sm font-bold text-white disabled:opacity-50"
          >
            {ctaCopy.sendWithLove}
          </button>
        </div>
      </div>

      {editMessageOpen && (
        <EditMessageModal
          senderMessage={senderMessage}
          messageStarter={isPaid ? gesture.messageStarter : undefined}
          onSave={setSenderMessage}
          onClose={() => setEditMessageOpen(false)}
        />
      )}

      {previewOpen && (
        <PreviewOverlay
          coupons={[previewCoupon]}
          accent={antiqueGold}
          motif={gesture.motif}
          imageSrc={null}
          expiresAt={expiryDate || null}
          recipientPreview={{ senderName, senderMessage: senderMessage || null }}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {authOpen && <AuthGate redirectTo="/create" onClose={() => setAuthOpen(false)} />}

      {unlockConfirmOpen && (
        <GestureUnlockConfirm
          formattedPrice={formatPrice(REGION_GESTURE_UNLOCK_PRICE[region], region)}
          onConfirm={() => {
            setUnlocked(true)
            setUnlockConfirmOpen(false)
          }}
          onDismiss={() => setUnlockConfirmOpen(false)}
        />
      )}
    </div>
  )
}
