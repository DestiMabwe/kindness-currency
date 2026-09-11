'use client'

import { useState } from 'react'
import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { GiftMessageScreen, GiftInstructionsScreen } from '@/components/give/GiftIntroScreens'
import { couponsFromTemplate, type BuilderCoupon } from '@/hooks/useCouponSetBuilder'
import { templateVisuals, colorWheelSwatches, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import type { TemplateWithCoupons } from '@/lib/templateRepository'

type Step = 'personalize' | 'preview' | 'message' | 'instructions' | 'recipientCoupons'

// How far each of the 3 stages is filled for a given step — Send spans 3 real screens, so it
// fills in thirds across them instead of jumping straight from empty to full like the other
// two single-screen stages do.
const PROGRESS_FOR_STEP: Record<Step, readonly [number, number, number]> = {
  personalize: [1, 0, 0],
  preview: [1, 1, 0],
  message: [1, 1, 1 / 3],
  instructions: [1, 1, 2 / 3],
  recipientCoupons: [1, 1, 1],
}

const STAGE_LABELS = [ctaCopy.howYouCreateStepPersonalize, ctaCopy.howYouCreateStepPreview, ctaCopy.howYouCreateStepSend]

/** The 3-stage progress bar shown on every screen of the walkthrough — each segment fills with
 * the chosen template's own accent color as that stage is reached, so the timeline itself is
 * already personalized to the template before the sender has customized anything. */
function ProgressTimeline({
  progress,
  accent,
  light,
}: {
  progress: readonly [number, number, number]
  accent: string
  light?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      {STAGE_LABELS.map((label, i) => (
        <div key={label} className="flex flex-col items-start gap-1">
          <span
            className={`text-[9.5px] font-bold tracking-[0.07em] uppercase transition-colors duration-300 ${
              light
                ? progress[i] > 0
                  ? 'text-[#1A1A2E]'
                  : 'text-[#1A1A2E]/55'
                : progress[i] > 0
                  ? 'text-white'
                  : 'text-white/55'
            }`}
          >
            {label}
          </span>
          <span className={`block h-[3px] w-7 overflow-hidden rounded-full ${light ? 'bg-[#1A1A2E]/15' : 'bg-white/20'}`}>
            <span
              aria-hidden="true"
              className="block h-full w-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-[400ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `scaleX(${progress[i]})`, backgroundColor: accent }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

/** The shared header on every screen of the walkthrough: the progress timeline plus the close
 * button, fixed at the top so it survives the full-bleed message/instructions screens too.
 * `light` switches both to the dark-on-cream palette for the one screen (instructions) with a
 * cream background instead of the deep-ink one every other step uses. */
function TimelineHeader({
  progress,
  accent,
  onClose,
  light,
}: {
  progress: readonly [number, number, number]
  accent: string
  onClose: () => void
  light?: boolean
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-between gap-2 px-5 pt-11 pb-3">
      <ProgressTimeline progress={progress} accent={accent} light={light} />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          light ? 'bg-[#1A1A2E]/8 text-[#1A1A2E]' : 'bg-white/10 text-white'
        }`}
      >
        ✕
      </button>
    </div>
  )
}

/** A small always-on-top badge marking the message/instructions/coupon-list screens as a preview of the recipient's own view, not the sender's. */
function RecipientBanner({ accent }: { accent: string }) {
  return (
    <div className="pointer-events-none fixed top-24 left-1/2 z-[90] -translate-x-1/2 px-4">
      <span
        className="block rounded-full px-3 py-1.5 text-[9.5px] font-bold tracking-[0.03em] whitespace-nowrap text-white uppercase shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)]"
        style={{ backgroundColor: accent }}
      >
        {ctaCopy.howYouCreateRecipientBanner}
      </span>
    </div>
  )
}

/** A disabled-looking snapshot of the real "Who's it for?" form — same fields, same placeholders, un-editable. */
function DetailsFormMockup() {
  return (
    <div className="w-full max-w-[300px] rounded-2xl bg-[#FFF8F0] p-4 text-left">
      <div className="text-[10px] font-bold tracking-[0.08em] text-[#2C2C2C]/60 uppercase">{ctaCopy.howYouCreateDetailsStepLabel}</div>
      <div className="mt-2.5 flex flex-col gap-2">
        <div className="rounded-[10px] border border-[#1A1A2E]/14 bg-white p-2.5 text-[13px] text-[#1A1A2E]/40">e.g. Alex</div>
        <div className="rounded-[10px] border border-[#1A1A2E]/14 bg-white p-2.5 text-[13px] text-[#1A1A2E]/40">e.g. Mom</div>
        <div className="rounded-[10px] border border-[#1A1A2E]/14 bg-white p-2.5 text-[13px] text-[#1A1A2E]/40">
          Something to say before they open it…
        </div>
      </div>
    </div>
  )
}

/** A disabled-looking snapshot of the real coupon editor — the template's own first default coupon, pre-filled, plus the colour row. */
function EditCouponMockup({ coupon, accent }: { coupon: BuilderCoupon; accent: string }) {
  return (
    <div className="w-full max-w-[300px] rounded-2xl bg-[#FFF8F0] p-4 text-left">
      <div className="text-[10px] font-bold tracking-[0.08em] text-[#2C2C2C]/60 uppercase">{ctaCopy.howYouCreateEditStepLabel}</div>
      <div className="mt-2.5 flex flex-col gap-2">
        <div
          className="rounded-[10px] border border-[#1A1A2E]/14 bg-white p-2.5 text-[13px] font-bold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {coupon.serviceTitle}
        </div>
        <div className="rounded-[10px] border border-[#1A1A2E]/14 bg-white p-2.5 text-[13px] text-[#2C2C2C]">{coupon.microCopy}</div>
        <div className="rounded-[10px] border border-[#1A1A2E]/14 bg-white p-2 text-[11.5px] text-[#2C2C2C]">{coupon.finePrint}</div>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-[0.08em] text-[#2C2C2C]/50 uppercase">Colour</span>
        <div className="flex gap-1.5" aria-hidden="true">
          {colorWheelSwatches.map((color) => (
            <span
              key={color}
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: color, boxShadow: '0 0 0 1px rgba(26,26,46,0.15)' }}
            />
          ))}
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: accent, boxShadow: '0 0 0 1px rgba(26,26,46,0.15)' }} />
        </div>
      </div>
    </div>
  )
}

/**
 * The "How You Create Your Perfect Gift" walkthrough opened from a template card: a 3-stage
 * tour (Personalize → Preview → Send) that's purely explanatory — it never drops the sender
 * into the real builder, since that would let someone design and send a full gift for free
 * before any payment step exists for it (see PRICING.md). Personalize and Send both show
 * static, disabled-looking snapshots of the real screens (the editor fields, the recipient's
 * message/instructions/coupon-list views) so the sender can trust what they're about to get
 * before committing to a template.
 */
export function HowYouCreateOverlay({ template, onClose }: { template: TemplateWithCoupons; onClose: () => void }) {
  const [step, setStep] = useState<Step>('personalize')
  const visuals = templateVisuals[template.slug as TemplateSlug]
  const coupons = couponsFromTemplate(template)
  const sampleCoupons = coupons.slice(0, 3)

  const progress = PROGRESS_FOR_STEP[step]

  if (step === 'message') {
    return (
      <div className="fixed inset-0 z-[80] overflow-y-auto">
        <TimelineHeader progress={progress} accent={visuals.accent} onClose={onClose} />
        <RecipientBanner accent={visuals.accent} />
        {/* TimelineHeader already renders the one close button for this screen. */}
        <GiftMessageScreen
          senderName={ctaCopy.howYouCreateSenderName}
          senderMessage={visuals.previewMessage}
          accent={visuals.accent}
          onContinue={() => setStep('instructions')}
        />
      </div>
    )
  }

  if (step === 'instructions') {
    return (
      <div className="fixed inset-0 z-[80] overflow-y-auto">
        <TimelineHeader progress={progress} accent={visuals.accent} onClose={onClose} light />
        <RecipientBanner accent={visuals.accent} />
        {/* TimelineHeader already renders the one close button for this screen. */}
        <GiftInstructionsScreen
          senderName={ctaCopy.howYouCreateSenderName}
          accent={visuals.accent}
          onContinue={() => setStep('recipientCoupons')}
        />
      </div>
    )
  }

  if (step === 'recipientCoupons') {
    return (
      <div className="fixed inset-0 z-[80] flex h-dvh flex-col bg-[#1A1A2E]">
        <TimelineHeader progress={progress} accent={visuals.accent} onClose={onClose} />
        <RecipientBanner accent={visuals.accent} />
        <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4.5 pt-32 pb-6.5">
          {sampleCoupons.map((coupon) => (
            <CouponCardHero
              key={coupon.id}
              serviceTitle={coupon.serviceTitle}
              microCopy={coupon.microCopy}
              finePrint={coupon.finePrint}
              backgroundColor={coupon.backgroundColor}
              backgroundEffect={coupon.backgroundEffect}
              status="sent"
              showRedeem
              accent={visuals.accent}
              motif={visuals.motif}
              imageSrc={visuals.imageSrc}
              expiresAt={null}
            />
          ))}
        </div>
        <div className="flex justify-center px-5 pb-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: visuals.accent }}
          >
            {ctaCopy.howYouCreateDone}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] flex h-dvh flex-col bg-[#1A1A2E]">
      <TimelineHeader progress={progress} accent={visuals.accent} onClose={onClose} />

      <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4.5 pt-24 pb-6.5">
        {step === 'personalize' && coupons[0] && (
          <>
            <DetailsFormMockup />
            <EditCouponMockup coupon={coupons[0]} accent={visuals.accent} />
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
