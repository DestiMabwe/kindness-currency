'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AgeGate } from '@/components/modals/AgeGate'
import { PreviewOverlay } from '@/components/coupon/PreviewOverlay'
import { couponsFromTemplate } from '@/hooks/useCouponSetBuilder'
import { templateVisuals, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'
import type { TemplateWithCoupons } from '@/lib/templateRepository'
import type { ComingSoonTemplate } from '@/lib/comingSoonTemplateRepository'

export type TemplateGalleryProps = {
  templates: TemplateWithCoupons[]
  comingSoonTemplates: ComingSoonTemplate[]
}

// Made By Him / Made By Her are two halves of one paired idea — a couple makes
// one each and swaps. Look up each other's display name by slug so the on-card
// badge stays correct if a name changes, instead of hardcoding it here.
const PAIRED_SLUGS: Record<string, string> = {
  'made-by-him': 'made-by-her',
  'made-by-her': 'made-by-him',
}

export function TemplateGallery({ templates, comingSoonTemplates }: TemplateGalleryProps) {
  const [pendingAgeGate, setPendingAgeGate] = useState<TemplateWithCoupons | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<TemplateWithCoupons | null>(null)
  const [comingSoonModal, setComingSoonModal] = useState<ComingSoonTemplate | null>(null)

  const handleSelectLiveTemplate = (template: TemplateWithCoupons) => {
    if (template.is_age_restricted) {
      setPendingAgeGate(template)
      return
    }
    setPreviewTemplate(template)
  }

  const confirmAgeGate = () => {
    if (!pendingAgeGate) return
    setPreviewTemplate(pendingAgeGate)
    setPendingAgeGate(null)
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-12">
      <div className="px-5.5 pt-11.5 pb-1.5">
        <h1 className="text-[28px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.templatesPageHeading}
        </h1>
        <div className="mt-1.5 text-[13px] text-[#2C2C2C] opacity-72">{ctaCopy.templatesPageSubheading}</div>
      </div>

      <div className="flex flex-col gap-5 px-5.5 pt-4">
        {templates.map((template) => {
          const visuals = templateVisuals[template.slug as TemplateSlug]
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelectLiveTemplate(template)}
              className="overflow-hidden rounded-2xl border border-[#1A1A2E]/8 bg-white text-left shadow-[0_14px_30px_-24px_rgba(26,26,46,0.5)]"
            >
              <div className="relative aspect-[1748/1240] w-full">
                <Image src={visuals.coverImageSrc} alt={template.name} fill sizes="100vw" className="object-cover" />
                {template.is_age_restricted && (
                  <span className="absolute top-2 right-2 rounded-full border border-[#C2185B] bg-white/92 px-1.75 py-0.5 text-[9px] font-bold tracking-[0.08em] text-[#C2185B]">
                    18+
                  </span>
                )}
              </div>
              <div className="px-4 py-3.5">
                <div className="text-lg font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {template.name}
                </div>
                {template.emotional_tone && (
                  <div className="mt-1 text-xs leading-snug text-[#2C2C2C] opacity-70">{template.emotional_tone}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-9 bg-[#0a1f44] py-5">
        <div className="px-5.5">
          <h2 className="text-[22px] font-bold text-[#eaeaf2]" style={{ fontFamily: 'var(--font-playfair)' }}>
            {ctaCopy.comingSoonHeading}
          </h2>
          <div className="mt-0.75 text-[12.5px] text-white/70">{ctaCopy.comingSoonSubheading}</div>
        </div>
        <div className="mt-4 flex flex-col gap-3.25 px-5.5">
          {comingSoonTemplates.map((template) => {
            const pairedSlug = PAIRED_SLUGS[template.slug]
            const pairedTemplate = pairedSlug ? comingSoonTemplates.find((t) => t.slug === pairedSlug) : undefined
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setComingSoonModal(template)}
                className="overflow-hidden rounded-[18px] border border-white/10 bg-white text-left shadow-[0_14px_30px_-22px_rgba(0,0,0,0.5)]"
              >
                <div className="relative aspect-[1748/1240] w-full">
                  <Image src={template.cover_image_path} alt={template.name} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="p-3.75">
                  <div className="text-[16.5px] leading-tight font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {template.name}
                  </div>
                  {pairedTemplate && (
                    <div className="mt-1 text-[10.5px] font-semibold tracking-[0.02em] text-[#C2185B] uppercase opacity-80">
                      Pairs with {pairedTemplate.name}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {previewTemplate && (
        <PreviewOverlay
          coupons={couponsFromTemplate(previewTemplate)}
          accent={templateVisuals[previewTemplate.slug as TemplateSlug].accent}
          motif={templateVisuals[previewTemplate.slug as TemplateSlug].motif}
          imageSrc={templateVisuals[previewTemplate.slug as TemplateSlug].imageSrc}
          expiresAt={null}
          maxVisible={3}
          onViewAll={() => setPreviewTemplate(null)}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {pendingAgeGate && (
        <AgeGate templateName={pendingAgeGate.name} onConfirm={confirmAgeGate} onDismiss={() => setPendingAgeGate(null)} />
      )}

      {comingSoonModal && (
        <ComingSoonModal template={comingSoonModal} onClose={() => setComingSoonModal(null)} />
      )}
    </div>
  )
}

function ComingSoonModal({ template, onClose }: { template: ComingSoonTemplate; onClose: () => void }) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-heading"
        className="w-full rounded-t-[26px] bg-[#FFF8F0] px-6 pt-7 pb-8"
      >
        <div className="flex items-start justify-between">
          <h2 id="coming-soon-heading" className="text-2xl font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            {template.name}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-xl text-[#1A1A2E]">
            ✕
          </button>
        </div>
        <ul className="mt-4 flex flex-col gap-2.5 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-85">
          {template.blurb_points.map((point) => (
            <li key={point} className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
