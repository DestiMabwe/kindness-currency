'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { resetPinAction } from '@/app/profile/actions'
import { ResetPinModal } from './ResetPinModal'
import { resolveGiftVisual } from '@/constants/designTokens'
import type { GiftTrackingDetail as GiftTrackingDetailData } from '@/lib/couponSetRepository'

export type GiftTrackingDetailProps = {
  detail: GiftTrackingDetailData
}

type GiftStatus = 'sent' | 'seen' | 'redeemed'

function redeemedCount(coupons: { status: string }[]): number {
  return coupons.filter((c) => c.status === 'redeemed').length
}

/** Sent → Seen → Redeemed, same three-state logic as the Profile list badge. */
function statusFor(detail: GiftTrackingDetailData): GiftStatus {
  if (redeemedCount(detail.coupons) > 0) return 'redeemed'
  if (detail.openedAt) return 'seen'
  return 'sent'
}

function firstRedeemedAt(coupons: { redeemed_at: string | null }[]): string | null {
  const dates = coupons
    .map((c) => c.redeemed_at)
    .filter((d): d is string => d !== null)
    .sort()
  return dates[0] ?? null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_HEADLINE: Record<GiftStatus, (name: string) => string> = {
  sent: ctaCopy.giftTrackingStatusSent,
  seen: ctaCopy.giftTrackingStatusSeen,
  redeemed: ctaCopy.giftTrackingStatusRedeemed,
}

export function GiftTrackingDetail({ detail }: GiftTrackingDetailProps) {
  const [copied, setCopied] = useState(false)
  const [resetPinOpen, setResetPinOpen] = useState(false)
  const status = statusFor(detail)
  const { accent, motif } = resolveGiftVisual(detail.templateSlug)
  const redeemed = redeemedCount(detail.coupons)
  const total = detail.coupons.length
  const redeemedAt = firstRedeemedAt(detail.coupons)

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/give/${detail.id}` : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
    } catch {
      // Clipboard access can be denied — nothing to recover from here.
    }
  }

  const resendShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareLink })
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
    } else {
      await copyLink()
    }
  }

  return (
    <div className="px-5.5 pt-2 pb-10">
      <Link
        href="/profile"
        aria-label={ctaCopy.giftTrackingBackAria}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1A1A2E]/16 text-[15px] text-[#1A1A2E]"
      >
        ←
      </Link>

      <div className="mt-4 rounded-[20px] p-5 text-white" style={{ background: `linear-gradient(160deg, ${accent}, #1A1A2E)` }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-[20px]">{motif}</div>
        <h1 className="mt-3 text-[19px] leading-snug font-extrabold italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          {STATUS_HEADLINE[status](detail.recipient_name)}
        </h1>
        <div className="mt-1 text-[12.5px] opacity-85">{ctaCopy.giftTrackingProgress(redeemed, total)}</div>
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <button
          type="button"
          onClick={copyLink}
          className="flex-1 rounded-[13px] border-[1.5px] border-[#1A1A2E]/16 bg-white p-3 font-sans text-[13.5px] font-semibold text-[#1A1A2E]"
        >
          {copied ? ctaCopy.giftTrackingCopyLinkDone : ctaCopy.giftTrackingCopyLink}
        </button>
        <button
          type="button"
          onClick={resendShare}
          className="flex-1 rounded-[13px] border-[1.5px] border-[#1A1A2E]/16 bg-white p-3 font-sans text-[13.5px] font-semibold text-[#1A1A2E]"
        >
          {ctaCopy.giftTrackingResendShare}
        </button>
      </div>

      <div className="mt-3.5 rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-semibold tracking-[0.08em] text-[#2C2C2C] uppercase opacity-60">
              {ctaCopy.giftTrackingRecipientLabel}
            </div>
            <div className="mt-0.5 text-[15px] font-bold text-[#1A1A2E]">{detail.recipient_name}</div>
            {detail.templateName && <div className="text-[12.5px] text-[#2C2C2C] opacity-70">{detail.templateName}</div>}
          </div>
          <button
            type="button"
            onClick={() => setResetPinOpen(true)}
            className="flex items-center gap-1 text-[12px] font-semibold text-[#1A1A2E] opacity-70"
          >
            <span aria-hidden="true">👁</span> {ctaCopy.resetPinButtonLabel}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[13px] font-bold text-[#1A1A2E]">{ctaCopy.giftTrackingItemsHeading}</div>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {detail.coupons.map((coupon) => {
            const isRedeemed = coupon.status === 'redeemed'
            return (
              <div key={coupon.id} className="flex items-center gap-2 rounded-xl border border-[#1A1A2E]/8 bg-white p-2.5">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: isRedeemed ? '#C2185B' : '#D9D3C7' }}
                />
                <div>
                  <div className="text-[12.5px] font-semibold text-[#1A1A2E]">{coupon.service_title}</div>
                  <div className="text-[11px] text-[#2C2C2C] opacity-60">
                    {isRedeemed ? ctaCopy.giftTrackingCouponRedeemed : ctaCopy.giftTrackingCouponPending}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[13px] font-bold text-[#1A1A2E]">{ctaCopy.giftTrackingHistoryHeading}</div>
        <div className="mt-2.5 flex flex-col gap-3">
          <TimelineStep done label={ctaCopy.giftTrackingHistorySent} date={formatDate(detail.created_at)} />
          <TimelineStep
            done={!!detail.openedAt}
            label={detail.openedAt ? ctaCopy.giftTrackingHistorySeen : ctaCopy.giftTrackingHistoryPendingSeen}
            date={detail.openedAt ? formatDate(detail.openedAt) : undefined}
          />
          <TimelineStep
            done={!!redeemedAt}
            label={redeemedAt ? ctaCopy.giftTrackingHistoryRedeemed : ctaCopy.giftTrackingHistoryPendingRedeemed}
            date={redeemedAt ? formatDate(redeemedAt) : undefined}
          />
        </div>
      </div>

      {resetPinOpen && (
        <ResetPinModal
          recipientName={detail.recipient_name}
          onReset={() => resetPinAction(detail.id)}
          onClose={() => setResetPinOpen(false)}
        />
      )}
    </div>
  )
}

function TimelineStep({ done, label, date }: { done: boolean; label: string; date?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ backgroundColor: done ? '#2E7D6B' : '#E4DFD3', color: done ? '#fff' : '#8A8578' }}
      >
        {done ? '✓' : ''}
      </span>
      <div className="flex flex-1 items-center justify-between">
        <span className={`text-[13px] ${done ? 'font-semibold text-[#1A1A2E]' : 'text-[#2C2C2C] opacity-60'}`}>{label}</span>
        {date && <span className="text-[11.5px] text-[#2C2C2C] opacity-50">{date}</span>}
      </div>
    </div>
  )
}
