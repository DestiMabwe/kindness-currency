'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCouponSetBuilder, couponsFromTemplate, type BuilderCoupon } from '@/hooks/useCouponSetBuilder'
import { AgeGate } from '@/components/modals/AgeGate'
import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { PreviewOverlay } from '@/components/coupon/PreviewOverlay'
import { GiftReadyScreen } from '@/components/shared/GiftReadyScreen'
import { templateVisuals, colorWheelSwatches, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import { createClient } from '@/lib/supabase/client'
import { saveCouponSetAction } from '@/app/create/actions'
import { SERVICE_TITLE_MAX_LENGTH } from '@/schemas/couponSchema'
import type { TemplateCoupon, TemplateWithCoupons } from '@/lib/templateRepository'

// Deferred: only needed once a giver actually opens the auth form (Save/Send for an
// anonymous giver), not on every /create visit.
const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

export type CouponSetBuilderProps = {
  templates: TemplateWithCoupons[]
  isLoggedIn: boolean
}

type PendingAgeGate = { template: TemplateWithCoupons; action: 'select' | 'preview' }

export function CouponSetBuilder({ templates, isLoggedIn }: CouponSetBuilderProps) {
  const builder = useCouponSetBuilder(templates)
  const [pendingAgeGate, setPendingAgeGate] = useState<PendingAgeGate | null>(null)
  const [sampleTemplate, setSampleTemplate] = useState<TemplateWithCoupons | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const attemptedResume = useRef(false)

  const handleSaveOrSend = () => {
    if (isLoggedIn) {
      void performSave()
      return
    }
    setAuthOpen(true)
  }

  const performSave = async () => {
    const payload = builder.toSavePayload()
    if (!payload) return
    setSaving(true)
    setSaveError('')
    const result = await saveCouponSetAction(payload)
    setSaving(false)
    if (!result.success) {
      setSaveError(result.error)
      return
    }
    builder.completeSave({ setId: result.id, pin: result.pin })
  }

  // After a magic-link click, the browser lands back here already authenticated.
  // If there's still an unsaved draft in the builder, finish the save automatically
  // instead of making the user click "Save My Coupons" again.
  useEffect(() => {
    if (attemptedResume.current || !builder.hasSaveableDraft) return
    attemptedResume.current = true
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session) void performSave()
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check once per mount, not on every builder state change
  }, [builder.hasSaveableDraft])

  const handleSelectTemplate = (template: TemplateWithCoupons) => {
    if (template.is_age_restricted) {
      setPendingAgeGate({ template, action: 'select' })
      return
    }
    builder.loadTemplate(template.slug as TemplateSlug)
  }

  const handlePreviewSample = (template: TemplateWithCoupons) => {
    if (template.is_age_restricted) {
      setPendingAgeGate({ template, action: 'preview' })
      return
    }
    setSampleTemplate(template)
  }

  const confirmAgeGate = () => {
    if (!pendingAgeGate) return
    if (pendingAgeGate.action === 'select') {
      builder.loadTemplate(pendingAgeGate.template.slug as TemplateSlug)
    } else {
      setSampleTemplate(pendingAgeGate.template)
    }
    setPendingAgeGate(null)
  }

  const selectedTemplate = builder.templateBySlug(builder.state.selectedTemplateSlug as TemplateSlug)
  const visuals = builder.state.selectedTemplateSlug ? templateVisuals[builder.state.selectedTemplateSlug] : null

  if (builder.state.screen === 'giftReady' && builder.state.savedResult) {
    return (
      <GiftReadyScreen
        shareLink={`${window.location.origin}/give/${builder.state.savedResult.setId}`}
        pin={builder.state.savedResult.pin}
        onStartOver={builder.startNewSet}
      />
    )
  }

  return (
    <div className="min-h-screen">
      {builder.state.screen === 'select' && (
        <TemplateSelectScreen templates={templates} onSelect={handleSelectTemplate} onPreviewSample={handlePreviewSample} />
      )}

      {builder.state.screen === 'details' && (
        <DetailsFormScreen
          templateName={selectedTemplate?.name ?? ''}
          senderName={builder.state.senderName}
          recipientName={builder.state.recipientName}
          expiryDate={builder.state.expiryDate}
          onBack={builder.backToSelect}
          onSenderChange={builder.setSenderName}
          onRecipientChange={builder.setRecipientName}
          onExpiryChange={builder.setExpiryDate}
          onContinue={builder.startEditing}
        />
      )}

      {builder.state.screen === 'edit' && visuals && (
        <EditScreen
          templateName={selectedTemplate?.name ?? ''}
          senderName={builder.state.senderName}
          recipientName={builder.state.recipientName}
          coupons={builder.state.coupons}
          originalCoupons={selectedTemplate?.template_coupons ?? []}
          accent={visuals.accent}
          motif={visuals.motif}
          imageSrc={visuals.imageSrc}
          expiresAt={builder.state.expiryDate || null}
          saving={saving}
          saveError={saveError}
          onBack={builder.backToDetails}
          onPatchCoupon={builder.patchCoupon}
          onPatchAllCoupons={builder.patchAllCoupons}
          onPreview={() => setPreviewOpen(true)}
          onSave={handleSaveOrSend}
          onSend={handleSaveOrSend}
        />
      )}

      {previewOpen && (
        <PreviewOverlay
          coupons={builder.state.coupons}
          accent={visuals?.accent ?? '#C2185B'}
          motif={visuals?.motif ?? ''}
          imageSrc={visuals?.imageSrc ?? null}
          expiresAt={builder.state.expiryDate || null}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {sampleTemplate && (
        <PreviewOverlay
          coupons={couponsFromTemplate(sampleTemplate)}
          accent={templateVisuals[sampleTemplate.slug as TemplateSlug].accent}
          motif={templateVisuals[sampleTemplate.slug as TemplateSlug].motif}
          imageSrc={templateVisuals[sampleTemplate.slug as TemplateSlug].imageSrc}
          expiresAt={null}
          maxVisible={3}
          onViewAll={() => {
            setSampleTemplate(null)
            handleSelectTemplate(sampleTemplate)
          }}
          onClose={() => setSampleTemplate(null)}
        />
      )}

      {pendingAgeGate && (
        <AgeGate templateName={pendingAgeGate.template.name} onConfirm={confirmAgeGate} onDismiss={() => setPendingAgeGate(null)} />
      )}

      {authOpen && <AuthGate onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

function TemplateSelectScreen({
  templates,
  onSelect,
  onPreviewSample,
}: {
  templates: TemplateWithCoupons[]
  onSelect: (template: TemplateWithCoupons) => void
  onPreviewSample: (template: TemplateWithCoupons) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 px-4.5 pt-11.5 pb-1.5">
        <Link href="/" aria-label="Kindness Currency home">
          <Image src="/logo.png" alt="" width={359} height={257} className="h-6 w-auto" />
        </Link>
        <div className="font-sans text-[13px] font-semibold tracking-[0.04em] text-[#2C2C2C] uppercase opacity-60">Step 1 of 3</div>
      </div>
      <div className="px-5.5 pt-1.5">
        <h1 className="text-[28px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Pick a template
        </h1>
        <div className="mt-1.5 text-[13px] text-[#2C2C2C] opacity-72">Each ships with eight thoughtful coupons, ready to personalise.</div>
      </div>
      <div className="flex flex-col gap-5 px-5.5 pt-4 pb-7.5">
        {templates.map((template) => {
          const visuals = templateVisuals[template.slug as TemplateSlug]
          return (
            <div
              key={template.id}
              className="overflow-hidden rounded-2xl border border-[#1A1A2E]/8 bg-white shadow-[0_14px_30px_-24px_rgba(26,26,46,0.5)]"
            >
              <button type="button" onClick={() => onSelect(template)} className="block w-full text-left">
                <div className="relative aspect-[1748/1240] w-full">
                  <Image src={visuals.coverImageSrc} alt={template.name} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="px-4 pt-3.5">
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-playfair)' }}>
                      {template.name}
                    </div>
                    {template.is_age_restricted && (
                      <span className="rounded-full border border-[#C2185B] px-1.5 py-0.5 text-[8.5px] font-bold tracking-[0.08em] text-[#C2185B]">
                        18+
                      </span>
                    )}
                  </div>
                  {template.emotional_tone && (
                    <div className="mt-1 text-xs leading-snug text-[#2C2C2C] opacity-70">{template.emotional_tone}</div>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onPreviewSample(template)}
                className="mx-4 mt-2.5 mb-3.5 text-xs font-semibold underline underline-offset-2"
                style={{ color: visuals.accent }}
              >
                {ctaCopy.previewSampleCoupons}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailsFormScreen({
  templateName,
  senderName,
  recipientName,
  expiryDate,
  onBack,
  onSenderChange,
  onRecipientChange,
  onExpiryChange,
  onContinue,
}: {
  templateName: string
  senderName: string
  recipientName: string
  expiryDate: string
  onBack: () => void
  onSenderChange: (value: string) => void
  onRecipientChange: (value: string) => void
  onExpiryChange: (value: string) => void
  onContinue: () => void
}) {
  const [attempted, setAttempted] = useState(false)

  const handleContinue = () => {
    setAttempted(true)
    onContinue()
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4.5 pt-11.5 pb-1.5">
        <button type="button" onClick={onBack} className="p-1 text-xl text-[#1A1A2E]" aria-label="Back">
          ‹
        </button>
        <div className="font-sans text-[13px] font-semibold tracking-[0.04em] text-[#2C2C2C] uppercase opacity-60">Step 2 of 3</div>
      </div>
      <div className="px-5.5">
        <h1 className="text-[27px] leading-[1.1] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Who&apos;s it for?
        </h1>
        <div className="mt-1.5 text-[13px] text-[#2C2C2C] opacity-72">
          {templateName ? `${templateName} — ` : ''}We&apos;ll weave these names through the whole gift.
        </div>
      </div>
      <div className="flex flex-col gap-4 px-5.5 py-5.5">
        <label className="block">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-60">Your name</span>
          <input
            value={senderName}
            onChange={(e) => onSenderChange(e.target.value)}
            placeholder="e.g. Alex"
            className="mt-1.5 w-full rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-60">Their name</span>
          <input
            value={recipientName}
            onChange={(e) => onRecipientChange(e.target.value)}
            placeholder="e.g. Mom"
            className="mt-1.5 w-full rounded-xl border-[1.5px] p-3.5 text-[15px] text-[#1A1A2E] outline-none"
            style={{ borderColor: attempted && !recipientName.trim() ? '#C2185B' : 'rgba(26,26,46,0.14)' }}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-60">
            Expiry date <span className="font-medium normal-case opacity-60">· optional</span>
          </span>
          <input
            value={expiryDate}
            onChange={(e) => onExpiryChange(e.target.value)}
            type="date"
            className="mt-1.5 w-full rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
          />
        </label>
        <button
          type="button"
          onClick={handleContinue}
          className="mt-1.5 w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15.5px] font-bold text-white"
        >
          Personalise the coupons →
        </button>
        {attempted && !recipientName.trim() && (
          <div className="text-center text-[11.5px] text-[#C2185B]">Add their name first ♥</div>
        )}
        <div className="text-center text-[11.5px] text-[#2C2C2C] opacity-55">{ctaCopy.templatesSubheading}</div>
      </div>
    </div>
  )
}

const EFFECT_OPTIONS: { value: BuilderCoupon['backgroundEffect']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'confetti', label: 'Confetti' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'soft-glow', label: 'Soft Glow' },
]

function isCouponCustomized(coupon: BuilderCoupon, original: TemplateCoupon | undefined): boolean {
  if (!original) return true
  return (
    coupon.serviceTitle !== original.service_title ||
    coupon.microCopy !== (original.micro_copy ?? '') ||
    coupon.finePrint !== (original.fine_print ?? '') ||
    coupon.backgroundColor !== '#FFF8F0' ||
    coupon.backgroundEffect !== 'none'
  )
}

function ColorSwatchPicker({
  value,
  accent,
  onChange,
  applyToAll = false,
}: {
  value: string | null
  accent: string
  onChange: (color: string) => void
  applyToAll?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {colorWheelSwatches.map((swatch) => (
        <button
          key={swatch}
          type="button"
          aria-label={applyToAll ? `Set all coupons' background colour ${swatch}` : `Set background colour ${swatch}`}
          onClick={() => onChange(swatch)}
          className="flex h-11 w-11 items-center justify-center"
        >
          <span
            className="h-[22px] w-[22px] rounded-full"
            style={{
              backgroundColor: swatch,
              boxShadow: value === swatch ? `0 0 0 2px #fff, 0 0 0 3.5px ${accent}` : '0 0 0 1px rgba(26,26,46,0.15)',
            }}
          />
        </button>
      ))}
      <label className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full">
        <span
          className="h-[26px] w-[26px] rounded-full"
          style={{ background: 'conic-gradient(from 0deg, #ff5252, #ffb142, #fffb52, #52ff7a, #52d9ff, #5271ff, #c952ff, #ff52a8, #ff5252)' }}
        />
        <input
          type="color"
          aria-label={applyToAll ? "Set all coupons' custom background colour" : 'Custom background colour'}
          value={value ?? '#FFF8F0'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  )
}

function EffectPillPicker({
  value,
  accent,
  onChange,
  applyToAll = false,
}: {
  value: BuilderCoupon['backgroundEffect'] | null
  accent: string
  onChange: (effect: BuilderCoupon['backgroundEffect']) => void
  applyToAll?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {EFFECT_OPTIONS.map((effect) => (
        <button
          key={effect.value}
          type="button"
          onClick={() => onChange(effect.value)}
          aria-label={applyToAll ? `Set all coupons' effect to ${effect.label}` : undefined}
          className="flex h-11 min-w-11 items-center justify-center rounded-full px-2.5 text-[11px] font-semibold"
          style={{
            backgroundColor: value === effect.value ? accent : '#F0ECE4',
            color: value === effect.value ? '#fff' : '#2C2C2C',
          }}
        >
          {effect.label}
        </button>
      ))}
    </div>
  )
}

function EditScreen({
  templateName,
  senderName,
  recipientName,
  coupons,
  originalCoupons,
  accent,
  motif,
  imageSrc,
  expiresAt,
  saving,
  saveError,
  onBack,
  onPatchCoupon,
  onPatchAllCoupons,
  onPreview,
  onSave,
  onSend,
}: {
  templateName: string
  senderName: string
  recipientName: string
  coupons: BuilderCoupon[]
  originalCoupons: TemplateCoupon[]
  accent: string
  motif: string
  imageSrc: string
  expiresAt: string | null
  saving: boolean
  saveError: string
  onBack: () => void
  onPatchCoupon: (id: string, patch: Partial<BuilderCoupon>) => void
  onPatchAllCoupons: (patch: Partial<Pick<BuilderCoupon, 'backgroundColor' | 'backgroundEffect'>>) => void
  onPreview: () => void
  onSave: () => void
  onSend: () => void
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const originalById = new Map(originalCoupons.map((c) => [c.id, c]))
  const customizedCount = coupons.filter((c) => isCouponCustomized(c, originalById.get(c.id))).length

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="pb-5">
      <div className="sticky top-0 z-30 border-b border-[#1A1A2E]/7 bg-[#FFF8F0]/92 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4.5 pt-11.5 pb-3">
          <button type="button" onClick={onBack} className="p-1 text-xl text-[#1A1A2E]" aria-label="Back">
            ‹
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-sans text-[13px] font-semibold tracking-[0.04em] text-[#2C2C2C] uppercase opacity-60">
              Step 3 of 3 · {templateName}
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#2C2C2C] opacity-60">
              For {recipientName || 'them'} · from {senderName || 'you'} · {customizedCount} of {coupons.length} customized
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#1A1A2E]/7 bg-white/60 px-4.5 py-3.5">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-50">Style all 8 the same</span>
        <div className="mt-2 flex flex-col gap-2">
          <ColorSwatchPicker value={null} accent={accent} applyToAll onChange={(color) => onPatchAllCoupons({ backgroundColor: color })} />
          <EffectPillPicker value={null} accent={accent} applyToAll onChange={(effect) => onPatchAllCoupons({ backgroundEffect: effect })} />
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4.5 pt-4.5">
        {coupons.map((coupon) => (
          <CouponEditorCard
            key={coupon.id}
            coupon={coupon}
            accent={accent}
            motif={motif}
            imageSrc={imageSrc}
            expiresAt={expiresAt}
            expanded={expandedIds.has(coupon.id)}
            customized={isCouponCustomized(coupon, originalById.get(coupon.id))}
            onToggleExpand={() => toggleExpanded(coupon.id)}
            onPatch={(patch) => onPatchCoupon(coupon.id, patch)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 z-40 mt-3.5 flex flex-col gap-2.5 border-t border-[#1A1A2E]/8 bg-[#FFF8F0]/94 px-4.5 pt-3.5 pb-4 backdrop-blur">
        {saveError && <div className="text-center text-[12.5px] text-[#C2185B]">{saveError}</div>}
        <button type="button" onClick={onPreview} className="w-full rounded-[13px] border-[1.5px] border-[#1A1A2E] p-3 font-sans text-sm font-semibold text-[#1A1A2E]">
          {ctaCopy.previewAllCoupons}
        </button>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 rounded-[13px] border-[1.5px] border-[#C2185B] p-3.5 font-sans text-sm font-bold text-[#C2185B] disabled:opacity-50"
          >
            {ctaCopy.saveMyCoupons}
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={saving}
            className="flex-[1.3] rounded-[13px] bg-[#C2185B] p-3.5 font-sans text-sm font-bold text-white disabled:opacity-50"
          >
            {ctaCopy.sendWithLove}
          </button>
        </div>
      </div>
    </div>
  )
}

function CouponEditorCard({
  coupon,
  accent,
  motif,
  imageSrc,
  expiresAt,
  expanded,
  customized,
  onToggleExpand,
  onPatch,
}: {
  coupon: BuilderCoupon
  accent: string
  motif: string
  imageSrc: string
  expiresAt: string | null
  expanded: boolean
  customized: boolean
  onToggleExpand: () => void
  onPatch: (patch: Partial<BuilderCoupon>) => void
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#1A1A2E]/7 bg-white shadow-[0_12px_28px_-22px_rgba(26,26,46,0.55)]">
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        <span
          aria-hidden="true"
          className="h-9 w-9 shrink-0 rounded-full"
          style={{ backgroundColor: coupon.backgroundColor, boxShadow: '0 0 0 1px rgba(26,26,46,0.15)' }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            {coupon.serviceTitle || 'Untitled coupon'}
          </span>
          <span className="block text-[11px] text-[#2C2C2C] opacity-60">{customized ? 'Customized ✓' : 'Using template default'}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-lg text-[#1A1A2E] opacity-60">
          {expanded ? '︿' : '﹀'}
        </span>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5">
          <div className="flex justify-center">
            <CouponCardHero
              serviceTitle={coupon.serviceTitle}
              microCopy={coupon.microCopy}
              finePrint={coupon.finePrint}
              backgroundColor={coupon.backgroundColor}
              backgroundEffect={coupon.backgroundEffect}
              status="sent"
              accent={accent}
              motif={motif}
              imageSrc={imageSrc}
              expiresAt={expiresAt}
            />
          </div>

          <div className="mt-3.5 flex flex-col gap-2.5">
            <input
              value={coupon.serviceTitle}
              onChange={(e) => onPatch({ serviceTitle: e.target.value })}
              placeholder="Service title"
              aria-label="Service title"
              maxLength={SERVICE_TITLE_MAX_LENGTH}
              className="w-full rounded-[10px] border border-[#1A1A2E]/12 bg-[#FFF8F0] p-2.5 text-[15px] font-bold text-[#1A1A2E] italic outline-none"
              style={{ fontFamily: 'var(--font-playfair)' }}
            />
            <input
              value={coupon.microCopy}
              onChange={(e) => onPatch({ microCopy: e.target.value })}
              placeholder="A warm supporting line"
              aria-label="Micro copy"
              className="w-full rounded-[10px] border border-[#1A1A2E]/12 bg-[#FFF8F0] p-2.5 text-[13px] text-[#2C2C2C] outline-none"
            />
            <input
              value={coupon.finePrint}
              onChange={(e) => onPatch({ finePrint: e.target.value })}
              placeholder="Fine print"
              aria-label="Fine print"
              className="w-full rounded-[10px] border border-[#1A1A2E]/12 bg-[#FFF8F0] p-2 text-[11.5px] text-[#2C2C2C] outline-none"
            />
          </div>

          <div className="mt-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-[46px] shrink-0 text-[10px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-50">Colour</span>
              <ColorSwatchPicker value={coupon.backgroundColor} accent={accent} onChange={(color) => onPatch({ backgroundColor: color })} />
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-[46px] shrink-0 text-[10px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-50">Effect</span>
              <EffectPillPicker value={coupon.backgroundEffect} accent={accent} onChange={(effect) => onPatch({ backgroundEffect: effect })} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

