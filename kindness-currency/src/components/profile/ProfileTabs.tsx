'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { TabPills } from '@/components/shared/TabPills'
import type { CouponSetSummary, ReceivedCouponSetSummary } from '@/lib/couponSetRepository'

export type ProfileTabsProps = {
  sentSets: CouponSetSummary[]
  receivedSets: ReceivedCouponSetSummary[]
}

type Tab = 'sent' | 'received'
type SentBadge = 'sent' | 'seen' | 'redeemed'

function redeemedCount(coupons: { status: string }[]): number {
  return coupons.filter((c) => c.status === 'redeemed').length
}

/** Sent → Seen → Redeemed. Any redemption flips it to Redeemed, even if others in the set are still unused. */
function sentBadgeFor(set: CouponSetSummary): SentBadge {
  if (redeemedCount(set.coupons) > 0) return 'redeemed'
  if (set.openedAt) return 'seen'
  return 'sent'
}

const SENT_BADGE_STYLE: Record<SentBadge, { label: string; bg: string; color: string }> = {
  sent: { label: 'Sent', bg: '#F0ECE4', color: '#2C2C2C' },
  seen: { label: 'Seen', bg: '#FF8F00', color: '#fff' },
  redeemed: { label: 'Redeemed', bg: '#C2185B', color: '#fff' },
}

export function ProfileTabs({ sentSets, receivedSets }: ProfileTabsProps) {
  const [tab, setTab] = useState<Tab>('sent')

  return (
    <div>
      <TabPills
        ariaLabel="Your coupons"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'sent', label: ctaCopy.profileTabSent, id: 'profile-tab-sent', panelId: 'profile-panel-sent' },
          { value: 'received', label: ctaCopy.profileTabReceived, id: 'profile-tab-received', panelId: 'profile-panel-received' },
        ]}
      />

      {tab === 'sent' && (
        <div role="tabpanel" id="profile-panel-sent" aria-labelledby="profile-tab-sent" className="mt-4">
          {sentSets.length === 0 ? (
            <div className="text-[14px] text-[#2C2C2C] opacity-70">{ctaCopy.profileEmptyState}</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {sentSets.map((set) => {
                const badge = SENT_BADGE_STYLE[sentBadgeFor(set)]
                return (
                  <Link
                    key={set.id}
                    href={`/profile/${set.id}`}
                    className="block rounded-2xl border border-[#1A1A2E]/8 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[15.5px] font-bold text-[#1A1A2E]">{set.recipient_name}</div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold tracking-[0.03em] uppercase"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {set.templateName && <div className="mt-1 text-[12.5px] text-[#2C2C2C] opacity-70">{set.templateName}</div>}
                    <div className="mt-2.5 text-[12.5px] font-semibold text-[#C2185B]">
                      {redeemedCount(set.coupons)} of {set.coupons.length} redeemed
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'received' && (
        <div role="tabpanel" id="profile-panel-received" aria-labelledby="profile-tab-received" className="mt-4">
          {receivedSets.length === 0 ? (
            <div className="text-[14px] text-[#2C2C2C] opacity-70">{ctaCopy.profileReceivedEmptyState}</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {receivedSets.map((set) => (
                <div key={set.id} className="rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[15.5px] font-bold text-[#1A1A2E]">{set.sender_name}</div>
                    <span className="text-[11px] font-semibold tracking-[0.05em] text-[#2C2C2C] uppercase opacity-60">{set.status}</span>
                  </div>
                  {set.templateName && <div className="mt-1 text-[12.5px] text-[#2C2C2C] opacity-70">{set.templateName}</div>}
                  <div className="mt-2.5 text-[12.5px] font-semibold text-[#C2185B]">
                    {redeemedCount(set.coupons)} of {set.coupons.length} redeemed
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
