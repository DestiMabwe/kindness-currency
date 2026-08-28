'use client'

// The "Who's it for?" + personalize flow for a chosen single-use gesture.
// Reuses DetailsFormScreen/ColorSwatchPicker/EffectPillPicker/EditMessageModal straight from the
// real CouponSetBuilder (exported there for this purpose) so steps 2 and the message-editing path
// are pixel-identical to the bundle flow. Step 3 is a lighter, single-card variant of the real
// EditScreen — no 8-coupon grid, no "style all 8 the same" — but carries the same preview,
// customized-tracking, and revisit-message features the bundle flow has, so the single-gesture
// path doesn't feel like a lesser product. Saving/saveError state is wired the same way the
// bundle flow does it (disabled-while-saving, an error slot) even though there's no real
// persistence yet — see the 'done' step below for what happens instead.

import { useState } from 'react'
import { GoldCoupon } from '@/components/builder/GoldCoupon'
import { ColorSwatchPicker, DetailsFormScreen, EffectPillPicker, EditMessageModal } from '@/components/builder/CouponSetBuilder'
import { PreviewOverlay } from '@/components/coupon/PreviewOverlay'
import { ctaCopy } from '@/constants/ctaCopy'
import { antiqueGold, antiqueGoldText, type SingleUseGesture } from '@/lib/singleUseGestures'
import { SERVICE_TITLE_MAX_LENGTH } from '@/schemas/couponSchema'
import type { BackgroundEffect } from '@/schemas/couponSchema'
import type { BuilderCoupon } from '@/hooks/useCouponSetBuilder'

type Step = 'details' | 'personalize' | 'done'

type Draft = {
  serviceTitle: string
  microCopy: string
  finePrint: string
  backgroundColor: string | null
  backgroundEffect: BackgroundEffect
}

export function GestureFlow({ gesture, onExit }: { gesture: SingleUseGesture; onExit: () => void }) {
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
  // Mirrors the bundle flow's saving/saveError pattern structurally — there's no real async write
  // yet, so this never actually blocks on anything, but disabling the buttons and reserving the
  // error slot means wiring real persistence later is a drop-in, not a redesign.
  const [saving, setSaving] = useState(false)
  const saveError = ''

  // Free gestures: title + micro-copy are both editable. Paid gestures: only micro-copy —
  // background colour/effect stay editable either way, since "design of the coupon" isn't
  // part of this restriction.
  const titleLocked = gesture.price > 0
  const isCustomized =
    draft.serviceTitle !== gesture.serviceTitle ||
    draft.microCopy !== gesture.microCopy ||
    draft.finePrint !== gesture.finePrint ||
    draft.backgroundColor !== '#FFF8F0' ||
    draft.backgroundEffect !== 'none'

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

  const handleSaveOrSend = () => {
    setSaving(true)
    // Seam for the real Supabase write + GiftReadyScreen hand-off, once that path is built.
    setStep('done')
  }

  if (step === 'details') {
    return (
      <DetailsFormScreen
        templateName={gesture.serviceTitle}
        senderName={senderName}
        recipientName={recipientName}
        expiryDate={expiryDate}
        senderMessage={senderMessage}
        onBack={onExit}
        onSenderChange={setSenderName}
        onRecipientChange={setRecipientName}
        onExpiryChange={setExpiryDate}
        onSenderMessageChange={setSenderMessage}
        onContinue={() => setStep('personalize')}
      />
    )
  }

  if (step === 'done') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.gestureSendPendingHeading}
        </h1>
        <div className="mt-3 max-w-[320px] text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-72">
          {ctaCopy.gestureSendPendingBody}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="mt-6 rounded-2xl bg-[#C2185B] px-6 py-3.5 text-center font-sans text-[15px] font-bold text-white"
        >
          Back to gallery
        </button>
      </div>
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
              <span style={{ color: antiqueGoldText, fontWeight: 700 }}>{gesture.price === 0 ? 'Free' : `$${gesture.price.toFixed(2)}`}</span>
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
              <div>
                <input
                  value={draft.serviceTitle}
                  onChange={(e) => setDraft((d) => ({ ...d, serviceTitle: e.target.value }))}
                  placeholder="Service title"
                  aria-label="Service title"
                  aria-describedby={titleLocked ? 'gesture-title-locked-hint' : undefined}
                  maxLength={SERVICE_TITLE_MAX_LENGTH}
                  disabled={titleLocked}
                  className="w-full rounded-[10px] border border-[#1A1A2E]/12 p-2.5 text-[15px] font-bold text-[#1A1A2E] italic outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ fontFamily: 'var(--font-playfair)', backgroundColor: titleLocked ? '#F0ECE4' : '#FFF8F0' }}
                />
                {titleLocked && (
                  <div id="gesture-title-locked-hint" className="mt-1 text-[10.5px] font-semibold text-[#2C2C2C] opacity-50">
                    Locked — service titles are editable on free gestures
                  </div>
                )}
              </div>
              <input
                value={draft.microCopy}
                onChange={(e) => setDraft((d) => ({ ...d, microCopy: e.target.value }))}
                placeholder="A warm supporting line"
                aria-label="Micro copy"
                className="w-full rounded-[10px] border border-[#1A1A2E]/12 bg-[#FFF8F0] p-2.5 text-[13px] text-[#2C2C2C] outline-none"
              />
              <input
                value={draft.finePrint}
                onChange={(e) => setDraft((d) => ({ ...d, finePrint: e.target.value }))}
                placeholder="Fine print"
                aria-label="Fine print"
                className="w-full rounded-[10px] border border-[#1A1A2E]/12 bg-[#FFF8F0] p-2 text-[11.5px] text-[#2C2C2C] outline-none"
              />
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
            onClick={handleSaveOrSend}
            disabled={saving}
            className="flex-1 rounded-[13px] border-[1.5px] border-[#C2185B] p-3.5 font-sans text-sm font-bold text-[#C2185B] disabled:opacity-50"
          >
            {ctaCopy.saveMyCoupons}
          </button>
          <button
            type="button"
            onClick={handleSaveOrSend}
            disabled={saving}
            className="flex-[1.3] rounded-[13px] bg-[#C2185B] p-3.5 font-sans text-sm font-bold text-white disabled:opacity-50"
          >
            {ctaCopy.sendWithLove}
          </button>
        </div>
      </div>

      {editMessageOpen && (
        <EditMessageModal senderMessage={senderMessage} onSave={setSenderMessage} onClose={() => setEditMessageOpen(false)} />
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
    </div>
  )
}
