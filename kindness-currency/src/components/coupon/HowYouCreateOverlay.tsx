'use client'

import { useState } from 'react'
import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { GiftMessageScreen, GiftInstructionsScreen } from '@/components/give/GiftIntroScreens'
import { couponsFromTemplate } from '@/hooks/useCouponSetBuilder'
import { templateVisuals, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import type { TemplateWithCoupons } from '@/lib/templateRepository'

type Step = 'personalize' | 'preview' | 'message' | 'instructions'

const STAGE_FOR_STEP: Record<Step, 0 | 1 | 2> = {
  personalize: 0,
  preview: 1,
  message: 2,
  instructions: 2,
}

const STAGE_LABELS = [ctaCopy.howYouCreateStepPersonalize, ctaCopy.howYouCreateStepPreview, ctaCopy.howYouCreateStepSend]

function StepTimeline({ activeStage }: { activeStage: 0 | 1 | 2 }) {
  return (
    <div className="flex items-center gap-2">
      {STAGE_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: i <= activeStage ? 'white' : 'rgba(255,255,255,0.3)' }}
            />
            <span className={`text-[10.5px] font-bold tracking-[0.06em] uppercase ${i === activeStage ? 'text-white' : 'text-white/50'}`}>
              {label}
            </span>
          </div>
          {i < STAGE_LABELS.length - 1 && <span aria-hidden="true" className="h-px w-3 bg-white/25" />}
        </div>
      ))}
    </div>
  )
}

/**
 * The "How You Create Your Perfect Gift" walkthrough opened from a template card: a 3-stage
 * tour (Personalize → Preview → Send) that's purely explanatory — it never drops the sender
 * into the real builder, since that would let someone design and send a full gift for free
 * before any payment step exists for it (see PRICING.md).
 */
export function HowYouCreateOverlay({ template, onClose }: { template: TemplateWithCoupons; onClose: () => void }) {
  const [step, setStep] = useState<Step>('personalize')
  const visuals = templateVisuals[template.slug as TemplateSlug]
  const coupons = couponsFromTemplate(template)
  const sampleCoupons = coupons.slice(0, 3)

  if (step === 'message') {
    return (
      <div className="fixed inset-0 z-[80] overflow-y-auto">
        <GiftMessageScreen
          senderName={ctaCopy.howYouCreateSenderName}
          senderMessage={visuals.previewMessage}
          accent={visuals.accent}
          onContinue={() => setStep('instructions')}
          onClose={onClose}
        />
      </div>
    )
  }

  if (step === 'instructions') {
    return (
      <div className="fixed inset-0 z-[80] overflow-y-auto">
        <GiftInstructionsScreen
          senderName={ctaCopy.howYouCreateSenderName}
          accent={visuals.accent}
          onContinue={onClose}
          onClose={onClose}
          continueLabel={ctaCopy.howYouCreateDone}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] flex h-dvh flex-col bg-[#1A1A2E]">
      <div className="flex items-center justify-between gap-2 px-5 pt-11 pb-3">
        <StepTimeline activeStage={STAGE_FOR_STEP[step]} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4.5 pb-6.5">
        {step === 'personalize' && coupons[0] && (
          <>
            <CouponCardHero
              serviceTitle={coupons[0].serviceTitle}
              microCopy={coupons[0].microCopy}
              finePrint={coupons[0].finePrint}
              backgroundColor={coupons[0].backgroundColor}
              backgroundEffect={coupons[0].backgroundEffect}
              status="sent"
              accent={visuals.accent}
              motif={visuals.motif}
              imageSrc={visuals.imageSrc}
              expiresAt={null}
            />
            <p className="max-w-[300px] text-center text-[14px] leading-relaxed text-white/80">
              {ctaCopy.howYouCreatePersonalizeBody}
            </p>
          </>
        )}

        {step === 'preview' &&
          sampleCoupons.map((coupon) => (
            <CouponCardHero
              key={coupon.id}
              serviceTitle={coupon.serviceTitle}
              microCopy={coupon.microCopy}
              finePrint={coupon.finePrint}
              backgroundColor={coupon.backgroundColor}
              backgroundEffect={coupon.backgroundEffect}
              status="sent"
              accent={visuals.accent}
              motif={visuals.motif}
              imageSrc={visuals.imageSrc}
              expiresAt={null}
            />
          ))}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 pb-8">
        {step === 'preview' ? (
          <button
            type="button"
            onClick={() => setStep('personalize')}
            className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {ctaCopy.howYouCreateBack}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setStep(step === 'personalize' ? 'preview' : 'message')}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: visuals.accent }}
        >
          {ctaCopy.howYouCreateNext}
        </button>
      </div>
    </div>
  )
}
