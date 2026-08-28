'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCouponSetBuilder, couponsFromTemplate, type BuilderCoupon } from '@/hooks/useCouponSetBuilder'
import { SingleUseGestureSection, FilterPills, type FilterValue } from '@/components/builder/SingleUseGestureSection'
import { BundleTierPills } from '@/components/builder/BundleTierPills'
import { PromoScrollPopup } from '@/components/shared/PromoScrollPopup'
import { CartIcon } from '@/components/shared/CartIcon'
import { singleUseGestures, type SingleUseGesture } from '@/lib/singleUseGestures'
import { bundleTierBySlug, tierPrice, type BundleTier } from '@/lib/bundleTiers'
import { useCartSlugs, usePurchasedSlugs, addToCart, removeFromCart, markPersonalized } from '@/lib/cart'
import { GestureFlow } from '@/components/builder/GestureFlow'
import { AgeGate } from '@/components/modals/AgeGate'
import { CouponCardHero } from '@/components/coupon/CouponCardHero'
import { PreviewOverlay } from '@/components/coupon/PreviewOverlay'
import { GiftReadyScreen } from '@/components/shared/GiftReadyScreen'
import { SaveToAccountBanner, pendingLinkKey } from '@/components/shared/SaveToAccountBanner'
import { EarlyAccessSignupForm } from '@/components/templates/EarlyAccessSignupForm'
import { templateVisuals, colorWheelSwatches, type TemplateSlug } from '@/constants/designTokens'
import { ctaCopy } from '@/constants/ctaCopy'
import { saveCouponSetAction, linkSenderAction } from '@/app/create/actions'
import { SERVICE_TITLE_MAX_LENGTH, SENDER_MESSAGE_MAX_LENGTH } from '@/schemas/couponSchema'
import { useDialogA11y } from '@/hooks/useDialogA11y'
import type { TemplateCoupon, TemplateWithCoupons } from '@/lib/templateRepository'
import type { ComingSoonTemplate } from '@/lib/comingSoonTemplateRepository'
import type { FeatureInterestSlug } from '@/schemas/featureInterestSchema'

// Made By Him / Made By Her are two halves of one paired idea — a couple makes
// one each and swaps. Look up each other's display name by slug so the on-card
// badge stays correct if a name changes, instead of hardcoding it here.
const PAIRED_SLUGS: Record<string, string> = {
  'made-by-him': 'made-by-her',
  'made-by-her': 'made-by-him',
}

// Deferred: only needed if a giver opens one of the fake-door "want this?" buttons.
const FeatureInterestModal = dynamic(
  () => import('@/components/modals/FeatureInterestModal').then((m) => m.FeatureInterestModal),
  { ssr: false }
)

// Deferred, matching SaveToAccountBanner's own import of the same modal — only needed
// once a logged-out sender actually tries to save/send.
const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

export type CouponSetBuilderProps = {
  templates: TemplateWithCoupons[]
  comingSoonTemplates?: ComingSoonTemplate[]
  isLoggedIn?: boolean
  userEmail?: string | null
}

type PendingAgeGate = { template: TemplateWithCoupons; action: 'select' | 'preview' }

// Deliberately separate from the builder's own draft persistence (which clears on
// save, so a later /create visit starts fresh rather than resuming a finished
// session). This one exists only to survive the full-page redirect an auth
// provider forces mid "save to your account" click — see the effects below.
const PENDING_SENDER_READY_KEY = 'kindness-currency:pending-sender-ready'

// Set right before opening AuthGate from Save/Send, so the auth redirect's reload knows
// to finish the save automatically once the sender is actually logged in — the draft
// itself survives that redirect via useCouponSetBuilder's own localStorage persistence,
// so only the "they meant to save" intent needs to be remembered separately.
const PENDING_SAVE_INTENT_KEY = 'kindness-currency:pending-save-intent'

export function CouponSetBuilder({ templates, comingSoonTemplates = [], isLoggedIn = false, userEmail = null }: CouponSetBuilderProps) {
  const builder = useCouponSetBuilder(templates)
  const [pendingAgeGate, setPendingAgeGate] = useState<PendingAgeGate | null>(null)
  const [pendingTemplateSwitch, setPendingTemplateSwitch] = useState<TemplateWithCoupons | null>(null)
  const [sampleTemplate, setSampleTemplate] = useState<TemplateWithCoupons | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editMessageOpen, setEditMessageOpen] = useState(false)
  const [featureInterestModal, setFeatureInterestModal] = useState<FeatureInterestSlug | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [resumedDraftDismissed, setResumedDraftDismissed] = useState(false)
  const attemptedResume = useRef(false)
  const attemptedSaveResume = useRef(false)

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
    builder.completeSave({ setId: result.id, pin: result.pin, wasLinkedAtSave: isLoggedIn })
    // Clears the "purchased, not yet personalized" flag once this template's coupons are
    // actually saved/sent — otherwise it would show as pending forever on /create and Profile.
    if (builder.state.selectedTemplateSlug) markPersonalized(builder.state.selectedTemplateSlug)
  }

  const handleSaveOrSend = () => {
    if (!isLoggedIn) {
      if (typeof window !== 'undefined') window.localStorage.setItem(PENDING_SAVE_INTENT_KEY, 'true')
      setAuthOpen(true)
      return
    }
    void performSave()
  }

  // Right after an anonymous save, remember {setId, pin} so that if the sender clicks
  // "Save this to your account" and gets redirected away for auth, the reload below can
  // find it again — the builder's own draft was already cleared by completeSave.
  useEffect(() => {
    if (typeof window === 'undefined' || isLoggedIn || builder.state.screen !== 'giftReady' || !builder.state.savedResult) return
    window.localStorage.setItem(PENDING_SENDER_READY_KEY, JSON.stringify(builder.state.savedResult))
  }, [isLoggedIn, builder.state.screen, builder.state.savedResult])

  // Only resumes the ready screen when the viewer is now logged in AND actually mid a
  // pending "save to your account" link (set by SaveToAccountBanner right before it opens
  // AuthGate) — a plain revisit to /create must still start fresh at template-select.
  useEffect(() => {
    if (attemptedResume.current || !isLoggedIn) return
    attemptedResume.current = true
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(PENDING_SENDER_READY_KEY)
    if (!raw) return
    try {
      const pending = JSON.parse(raw) as { setId: string; pin: string }
      if (window.localStorage.getItem(pendingLinkKey('sender', pending.setId)) === 'true') {
        builder.completeSave({ setId: pending.setId, pin: pending.pin, wasLinkedAtSave: false })
      }
    } catch {
      // Malformed leftover — ignore rather than block a normal /create visit.
    } finally {
      window.localStorage.removeItem(PENDING_SENDER_READY_KEY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount to resume a pending sender link, not on every state change
  }, [isLoggedIn])

  // Completes a save the sender started before AuthGate interrupted them: once the auth
  // redirect lands back here and isLoggedIn is true, and the intent flag from
  // handleSaveOrSend is still set, finish the save automatically instead of making them
  // click "Save My Coupons" a second time. The draft itself is already correct at this
  // point via useCouponSetBuilder's own hydration.
  useEffect(() => {
    if (attemptedSaveResume.current || !isLoggedIn) return
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(PENDING_SAVE_INTENT_KEY) !== 'true') return
    // Save/Send is only reachable from the edit screen, so a pending intent's draft must
    // still be hydrating (from 'select') until the screen actually reaches 'edit' — firing
    // any earlier would call performSave() with the stale pre-hydration builder.state.
    if (builder.state.screen !== 'edit') return
    attemptedSaveResume.current = true
    window.localStorage.removeItem(PENDING_SAVE_INTENT_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time completion of a save the sender already initiated before the auth redirect, not a render-time side effect
    void performSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- performSave is stable per render and would cause an infinite loop if included
  }, [isLoggedIn, builder.state.screen])

  // Switching to a template other than the one already in progress regenerates that
  // template's coupons from defaults (see useCouponSetBuilder's loadTemplate), discarding
  // any customization on the in-progress one — so that case is routed through a warning
  // instead of loading straight away.
  const proceedToTemplate = (template: TemplateWithCoupons) => {
    if (builder.state.selectedTemplateId && builder.state.selectedTemplateId !== template.id) {
      setPendingTemplateSwitch(template)
      return
    }
    builder.loadTemplate(template.slug as TemplateSlug)
  }

  const handleSelectTemplate = (template: TemplateWithCoupons) => {
    if (template.is_age_restricted) {
      setPendingAgeGate({ template, action: 'select' })
      return
    }
    proceedToTemplate(template)
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
      proceedToTemplate(pendingAgeGate.template)
    } else {
      setSampleTemplate(pendingAgeGate.template)
    }
    setPendingAgeGate(null)
  }

  // "Go back to my [current] coupons": cancels the switch and resumes the in-progress
  // template exactly like re-tapping its own card would (see loadTemplate's same-template
  // branch) — straight to the edit screen once the form was already filled in.
  const resumeCurrentTemplate = () => {
    if (!builder.state.selectedTemplateSlug) return
    builder.loadTemplate(builder.state.selectedTemplateSlug as TemplateSlug)
    setPendingTemplateSwitch(null)
  }

  // Dismissing the warning (✕) is a one-time acknowledgment for this attempt only — it
  // proceeds with the newly tapped template, discarding the in-progress one's customization.
  const confirmTemplateSwitch = () => {
    if (!pendingTemplateSwitch) return
    builder.loadTemplate(pendingTemplateSwitch.slug as TemplateSlug)
    setPendingTemplateSwitch(null)
  }

  const selectedTemplate = builder.templateBySlug(builder.state.selectedTemplateSlug as TemplateSlug)
  const visuals = builder.state.selectedTemplateSlug ? templateVisuals[builder.state.selectedTemplateSlug] : null

  if (builder.state.screen === 'giftReady' && builder.state.savedResult) {
    return (
      <>
        <GiftReadyScreen
          shareLink={`${window.location.origin}/give/${builder.state.savedResult.setId}`}
          pin={builder.state.savedResult.pin}
          senderName={builder.state.senderName}
          recipientName={builder.state.recipientName}
          onStartOver={builder.startNewSet}
        />
        <SaveToAccountBanner
          setId={builder.state.savedResult.setId}
          isLoggedIn={isLoggedIn}
          alreadyLinked={builder.state.savedResult.wasLinkedAtSave}
          linkAction={linkSenderAction}
          redirectTo="/create"
          storageScope="sender"
        />
      </>
    )
  }

  return (
    <div className="min-h-screen">
      {builder.state.screen === 'select' && (
        <TemplateSelectScreen
          templates={templates}
          comingSoonTemplates={comingSoonTemplates}
          currentTemplateId={builder.state.selectedTemplateId}
          onSelect={handleSelectTemplate}
          onPreviewSample={handlePreviewSample}
          onFeatureInterest={setFeatureInterestModal}
        />
      )}

      {builder.resumedDraft && !resumedDraftDismissed && (builder.state.screen === 'details' || builder.state.screen === 'edit') && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#1A1A2E]/8 bg-white px-4 py-3.5">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[12.5px] font-semibold text-[#1A1A2E]">{ctaCopy.resumedDraftBannerText}</span>
            <button
              type="button"
              onClick={() => builder.startNewSet()}
              className="w-fit text-[12.5px] font-semibold text-[#C2185B]"
            >
              {ctaCopy.resumedDraftStartFreshButton}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setResumedDraftDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 p-1 text-[15px] text-[#2C2C2C] opacity-50"
          >
            ✕
          </button>
        </div>
      )}

      {builder.state.screen === 'details' && (
        <DetailsFormScreen
          templateName={selectedTemplate?.name ?? ''}
          senderName={builder.state.senderName}
          recipientName={builder.state.recipientName}
          expiryDate={builder.state.expiryDate}
          senderMessage={builder.state.senderMessage}
          onBack={builder.backToSelect}
          onSenderChange={builder.setSenderName}
          onRecipientChange={builder.setRecipientName}
          onExpiryChange={builder.setExpiryDate}
          onSenderMessageChange={builder.setSenderMessage}
          onContinue={builder.startEditing}
        />
      )}

      {builder.state.screen === 'edit' && visuals && (
        <EditScreen
          templateName={selectedTemplate?.name ?? ''}
          senderName={builder.state.senderName}
          recipientName={builder.state.recipientName}
          senderMessage={builder.state.senderMessage}
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
          onEditMessage={() => setEditMessageOpen(true)}
          onSave={handleSaveOrSend}
          onSend={handleSaveOrSend}
        />
      )}

      {editMessageOpen && (
        <EditMessageModal
          senderMessage={builder.state.senderMessage}
          onSave={builder.setSenderMessage}
          onClose={() => setEditMessageOpen(false)}
        />
      )}

      {previewOpen && (
        <PreviewOverlay
          coupons={builder.state.coupons}
          accent={visuals?.accent ?? '#C2185B'}
          motif={visuals?.motif ?? ''}
          imageSrc={visuals?.imageSrc ?? null}
          expiresAt={builder.state.expiryDate || null}
          recipientPreview={{ senderName: builder.state.senderName, senderMessage: builder.state.senderMessage || null }}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {authOpen && <AuthGate redirectTo="/create" onClose={() => setAuthOpen(false)} />}

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

      {pendingTemplateSwitch && selectedTemplate && (
        <TemplateSwitchWarningModal
          currentTemplateName={selectedTemplate.name}
          onResumeCurrent={resumeCurrentTemplate}
          onDismiss={confirmTemplateSwitch}
        />
      )}

      {featureInterestModal && (
        <FeatureInterestModal feature={featureInterestModal} userEmail={userEmail} onClose={() => setFeatureInterestModal(null)} />
      )}
    </div>
  )
}

function TemplateSelectScreen({
  templates,
  comingSoonTemplates,
  currentTemplateId,
  onSelect,
  onPreviewSample,
  onFeatureInterest,
}: {
  templates: TemplateWithCoupons[]
  comingSoonTemplates: ComingSoonTemplate[]
  currentTemplateId: string | null
  onSelect: (template: TemplateWithCoupons) => void
  onPreviewSample: (template: TemplateWithCoupons) => void
  onFeatureInterest: (feature: FeatureInterestSlug) => void
}) {
  const [comingSoonModal, setComingSoonModal] = useState<ComingSoonTemplate | null>(null)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [chosenGesture, setChosenGesture] = useState<SingleUseGesture | null>(null)
  const [bundleTier, setBundleTier] = useState<BundleTier | null>(null)
  const singleUseLayout = filter === 'range' ? 'hidden' : filter === 'focused' ? 'stack' : 'carousel'
  const showBundleList = filter !== 'focused'
  const bundleTemplates = bundleTier ? templates.filter((t) => bundleTierBySlug[t.slug] === bundleTier) : templates
  const cartSlugs = useCartSlugs()
  const purchasedSlugs = usePurchasedSlugs()

  if (chosenGesture) {
    return <GestureFlow gesture={chosenGesture} onExit={() => setChosenGesture(null)} />
  }

  return (
    <div>
      <PromoScrollPopup />
      <div className="flex items-center justify-between gap-2.5 px-4.5 pt-11.5 pb-1.5">
        <div className="flex items-center gap-2.5">
          <Link href="/" aria-label="Kindness Currency home">
            <Image src="/logo.png" alt="" width={359} height={257} className="h-6 w-auto" />
          </Link>
          <div className="font-sans text-[13px] font-semibold tracking-[0.04em] text-[#2C2C2C] uppercase opacity-60">Step 1 of 3</div>
        </div>
        <CartIcon />
      </div>
      <div className="px-5.5 pt-1.5">
        <h1 className="text-[28px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Pick a template
        </h1>
      </div>

      <div className="pt-4">
        <FilterPills value={filter} onChange={setFilter} />
        <SingleUseGestureSection gestures={singleUseGestures} layout={singleUseLayout} onChoose={setChosenGesture} />
      </div>

      {showBundleList && (
        <div className="pt-5.5">
          <div className="px-5.5">
            <h2 className="text-[19px] font-bold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-playfair)' }}>
              {ctaCopy.bundleSectionHeading}
            </h2>
            <div className="mt-1 text-[12.5px] text-[#2C2C2C] opacity-72">{ctaCopy.bundleSectionSubheading}</div>
          </div>
          <div className="mt-3">
            <BundleTierPills value={bundleTier} onChange={setBundleTier} />
          </div>
        </div>
      )}

      {showBundleList && (
      <div className="flex flex-col gap-5 px-5.5 pt-4 pb-7.5">
        {bundleTemplates.map((template) => {
          const visuals = templateVisuals[template.slug as TemplateSlug]
          const isCurrent = template.id === currentTemplateId
          const isPurchased = purchasedSlugs.includes(template.slug)
          const isInCart = cartSlugs.includes(template.slug)
          const showAddToCart = !!bundleTierBySlug[template.slug] && !isPurchased
          return (
            <div
              key={template.id}
              className="overflow-hidden rounded-2xl bg-white shadow-[0_14px_30px_-24px_rgba(26,26,46,0.5)]"
              style={{ border: isCurrent ? `1.5px solid ${visuals.accent}` : '1px solid rgba(26,26,46,0.08)' }}
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
                    {isCurrent && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[8.5px] font-bold tracking-[0.08em] text-white"
                        style={{ backgroundColor: visuals.accent }}
                      >
                        {ctaCopy.currentSetBadge}
                      </span>
                    )}
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
              <div className={`mx-4 mt-2.5 flex items-center justify-between gap-2 ${showAddToCart ? '' : 'mb-3.5'}`}>
                <button
                  type="button"
                  onClick={() => onPreviewSample(template)}
                  className="text-xs font-semibold underline underline-offset-2"
                  style={{ color: visuals.accent }}
                >
                  {ctaCopy.previewSampleCoupons}
                </button>
                {bundleTierBySlug[template.slug] && (
                  <span
                    className="shrink-0 text-[13px] font-bold"
                    style={{ color: isPurchased ? '#2E7D6B' : '#C2185B' }}
                  >
                    {isPurchased ? ctaCopy.purchasedLabel : `$${tierPrice[bundleTierBySlug[template.slug]].toFixed(2)}`}
                  </span>
                )}
              </div>
              {showAddToCart && (
                <div className="mx-4 mt-2 mb-3.5">
                  <button
                    type="button"
                    onClick={() => (isInCart ? removeFromCart(template.slug) : addToCart(template.slug))}
                    className="w-full rounded-xl border-[1.5px] p-2 text-center font-sans text-[12.5px] font-bold"
                    style={
                      isInCart
                        ? { borderColor: '#1A1A2E', color: '#1A1A2E', backgroundColor: '#F0ECE4' }
                        : { borderColor: visuals.accent, color: visuals.accent, backgroundColor: 'transparent' }
                    }
                  >
                    {isInCart ? ctaCopy.inCartLabel : ctaCopy.addToCartCta}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      )}

      {showBundleList && comingSoonTemplates.length > 0 && (
        <div className="mt-4 bg-[#0a1f44] py-5">
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
      )}

      <div className="px-5.5 pt-6 pb-8">
        <h2 className="text-[15px] font-bold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {ctaCopy.customCouponBookHeading}
        </h2>
        <div className="mt-1.5 text-[12.5px] text-[#2C2C2C] opacity-72">{ctaCopy.customCouponBookSubheading}</div>
        <button
          type="button"
          onClick={() => onFeatureInterest('custom_coupons')}
          className="mt-3 w-full rounded-2xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-center font-sans text-[14px] font-bold text-[#1A1A2E]"
        >
          {ctaCopy.customCouponBookButton}
        </button>
      </div>

      {comingSoonModal && <ComingSoonModal template={comingSoonModal} onClose={() => setComingSoonModal(null)} />}
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
        <EarlyAccessSignupForm templateSlug={template.slug} />
      </div>
    </div>
  )
}

function TemplateSwitchWarningModal({
  currentTemplateName,
  onResumeCurrent,
  onDismiss,
}: {
  currentTemplateName: string
  onResumeCurrent: () => void
  onDismiss: () => void
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onDismiss)

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-switch-warning-heading"
        className="w-full rounded-t-[26px] bg-[#FFF8F0] px-6 pt-7 pb-8"
      >
        <div className="flex items-start justify-between">
          <h2
            id="template-switch-warning-heading"
            className="text-2xl font-extrabold text-[#1A1A2E] italic"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {ctaCopy.templateSwitchWarningHeading}
          </h2>
          <button type="button" onClick={onDismiss} aria-label="Dismiss" className="p-1 text-xl text-[#1A1A2E]">
            ✕
          </button>
        </div>
        <div className="mt-3 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-85">
          {ctaCopy.templateSwitchWarningBody(currentTemplateName)}
        </div>
        <button
          type="button"
          onClick={onResumeCurrent}
          className="mt-5 w-full rounded-2xl bg-[#C2185B] p-3.5 text-center font-sans text-[15px] font-bold text-white"
        >
          {ctaCopy.templateSwitchWarningResumeButton(currentTemplateName)}
        </button>
      </div>
    </div>
  )
}

export function DetailsFormScreen({
  templateName,
  senderName,
  recipientName,
  expiryDate,
  senderMessage,
  onBack,
  onSenderChange,
  onRecipientChange,
  onExpiryChange,
  onSenderMessageChange,
  onContinue,
}: {
  templateName: string
  senderName: string
  recipientName: string
  expiryDate: string
  senderMessage: string
  onBack: () => void
  onSenderChange: (value: string) => void
  onRecipientChange: (value: string) => void
  onExpiryChange: (value: string) => void
  onSenderMessageChange: (value: string) => void
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
            className="mt-1.5 w-full rounded-xl border-[1.5px] p-3.5 text-[15px] text-[#1A1A2E] outline-none"
            style={{ borderColor: attempted && !senderName.trim() ? '#C2185B' : 'rgba(26,26,46,0.14)' }}
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
            Write a message to go with this <span className="font-medium normal-case opacity-60">· optional, but it makes this feel like you</span>
          </span>
          <textarea
            value={senderMessage}
            onChange={(e) => onSenderMessageChange(e.target.value)}
            placeholder="Something to say before they open it…"
            maxLength={SENDER_MESSAGE_MAX_LENGTH}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
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
        {attempted && !senderName.trim() && (
          <div className="text-center text-[11.5px] text-[#C2185B]">Add your name first ♥</div>
        )}
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

export function ColorSwatchPicker({
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

export function EffectPillPicker({
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
  senderMessage,
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
  onEditMessage,
  onSave,
  onSend,
}: {
  templateName: string
  senderName: string
  recipientName: string
  senderMessage: string
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
  onEditMessage: () => void
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
      <button
        type="button"
        onClick={onEditMessage}
        aria-label={senderMessage.trim() ? ctaCopy.editMessageEditLabel : ctaCopy.editMessageWriteLabel}
        className="fixed top-4 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-[#1A1A2E]/10 bg-white text-lg text-[#1A1A2E]"
      >
        ✉
      </button>

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

export function EditMessageModal({
  senderMessage,
  onSave,
  onClose,
}: {
  senderMessage: string
  onSave: (value: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(senderMessage)
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-message-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#FFF8F0] px-6 pt-6.5 pb-7.5"
      >
        <h2 id="edit-message-heading" className="text-[21px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {senderMessage.trim() ? ctaCopy.editMessageEditLabel : ctaCopy.editMessageWriteLabel}
        </h2>
        <div className="mt-2 text-[12.5px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.editMessageSubtext}</div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Something to say before they open it…"
          aria-label="Your message"
          maxLength={SENDER_MESSAGE_MAX_LENGTH}
          rows={4}
          className="mt-4 w-full resize-none rounded-xl border-[1.5px] border-[#1A1A2E]/14 bg-white p-3.5 text-[15px] text-[#1A1A2E] outline-none"
        />
        <button
          type="button"
          onClick={handleSave}
          className="mt-4 w-full rounded-2xl bg-[#C2185B] p-3.5 font-sans text-[15px] font-bold text-white"
        >
          {ctaCopy.editMessageSave}
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full p-1.5 text-center font-sans text-[13.5px] font-semibold text-[#2C2C2C] opacity-70">
          Cancel
        </button>
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

