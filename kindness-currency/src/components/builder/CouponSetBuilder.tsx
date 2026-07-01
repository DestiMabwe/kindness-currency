'use client'

import { useState } from 'react'
import { useCouponSetBuilder } from '@/hooks/useCouponSetBuilder'
import { AgeGate } from '@/components/modals/AgeGate'
import { templateVisuals, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import type { TemplateWithCoupons } from '@/lib/templateRepository'

export type CouponSetBuilderProps = {
  templates: TemplateWithCoupons[]
}

export function CouponSetBuilder({ templates }: CouponSetBuilderProps) {
  const builder = useCouponSetBuilder(templates)
  const [pendingAgeGateSlug, setPendingAgeGateSlug] = useState<TemplateSlug | null>(null)

  const handleSelectTemplate = (template: TemplateWithCoupons) => {
    if (template.is_age_restricted) {
      setPendingAgeGateSlug(template.slug as TemplateSlug)
      return
    }
    builder.loadTemplate(template.slug as TemplateSlug)
  }

  const confirmAgeGate = () => {
    if (!pendingAgeGateSlug) return
    builder.loadTemplate(pendingAgeGateSlug)
    setPendingAgeGateSlug(null)
  }

  const pendingTemplate = pendingAgeGateSlug ? templates.find((t) => t.slug === pendingAgeGateSlug) : null

  return (
    <div className="min-h-screen">
      {builder.state.screen === 'select' && <TemplateSelectScreen templates={templates} onSelect={handleSelectTemplate} />}

      {builder.state.screen === 'details' && (
        <DetailsFormScreen
          templateName={builder.templateBySlug(builder.state.selectedTemplateSlug as TemplateSlug)?.name ?? ''}
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

      {builder.state.screen === 'edit' && (
        <div className="p-6 text-center text-[#2C2C2C]">
          <p>{builder.state.coupons.length} coupons ready to personalise — editor coming soon.</p>
          <button type="button" onClick={builder.backToDetails} className="mt-3 text-sm font-semibold text-[#C2185B]">
            ‹ Back
          </button>
        </div>
      )}

      {pendingTemplate && (
        <AgeGate templateName={pendingTemplate.name} onConfirm={confirmAgeGate} onDismiss={() => setPendingAgeGateSlug(null)} />
      )}
    </div>
  )
}

function TemplateSelectScreen({
  templates,
  onSelect,
}: {
  templates: TemplateWithCoupons[]
  onSelect: (template: TemplateWithCoupons) => void
}) {
  return (
    <div>
      <div className="px-4.5 pt-11.5 pb-1.5">
        <div className="font-sans text-[13px] font-semibold tracking-[0.04em] text-[#2C2C2C] uppercase opacity-60">Step 1 of 3</div>
      </div>
      <div className="px-5.5 pt-1.5">
        <div className="text-[28px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Pick a template
        </div>
        <div className="mt-1.5 text-[13px] text-[#2C2C2C] opacity-72">Each ships with eight thoughtful coupons, ready to personalise.</div>
      </div>
      <div className="flex flex-col gap-3.5 px-5.5 pt-4 pb-7.5">
        {templates.map((template) => {
          const visuals = templateVisuals[template.slug as TemplateSlug]
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="flex items-center gap-3.5 rounded-2xl border border-[#1A1A2E]/8 bg-white p-4 text-left shadow-[0_14px_30px_-24px_rgba(26,26,46,0.5)]"
            >
              <div
                className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl text-[27px]"
                style={{ color: visuals.accent, backgroundColor: visuals.tint }}
              >
                {visuals.motif}
              </div>
              <div className="min-w-0 flex-1">
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
                <div className="mt-1 text-xs leading-snug text-[#2C2C2C] opacity-70">{template.theme}</div>
              </div>
              <div className="shrink-0 text-xl" style={{ color: visuals.accent }}>
                →
              </div>
            </button>
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
        <div className="text-[27px] leading-[1.1] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Who&apos;s it for?
        </div>
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
