'use client'

import { useState } from 'react'
import { ctaCopy } from '@/constants/ctaCopy'
import type { CouponSetSummary, ReceivedCouponSetSummary } from '@/lib/couponSetRepository'

export type ProfileTabsProps = {
  sentSets: CouponSetSummary[]
  receivedSets: ReceivedCouponSetSummary[]
}

type Tab = 'sent' | 'received'

function redeemedCount(coupons: { status: string }[]): number {
  return coupons.filter((c) => c.status === 'redeemed').length
}

export function ProfileTabs({ sentSets, receivedSets }: ProfileTabsProps) {
  const [tab, setTab] = useState<Tab>('sent')

  return (
    <div>
      <div role="tablist" aria-label="Your coupons" className="flex gap-1.5">
        <button
          type="button"
          role="tab"
          id="profile-tab-sent"
          aria-selected={tab === 'sent'}
          aria-controls="profile-panel-sent"
          onClick={() => setTab('sent')}
          className="rounded-full px-4 py-2 text-[13px] font-semibold"
          style={{ backgroundColor: tab === 'sent' ? '#C2185B' : '#F0ECE4', color: tab === 'sent' ? '#fff' : '#2C2C2C' }}
        >
          {ctaCopy.profileTabSent}
        </button>
        <button
          type="button"
          role="tab"
          id="profile-tab-received"
          aria-selected={tab === 'received'}
          aria-controls="profile-panel-received"
          onClick={() => setTab('received')}
          className="rounded-full px-4 py-2 text-[13px] font-semibold"
          style={{ backgroundColor: tab === 'received' ? '#C2185B' : '#F0ECE4', color: tab === 'received' ? '#fff' : '#2C2C2C' }}
        >
          {ctaCopy.profileTabReceived}
        </button>
      </div>

      {tab === 'sent' && (
        <div role="tabpanel" id="profile-panel-sent" aria-labelledby="profile-tab-sent" className="mt-4">
          {sentSets.length === 0 ? (
            <div className="text-[14px] text-[#2C2C2C] opacity-70">{ctaCopy.profileEmptyState}</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {sentSets.map((set) => (
                <div key={set.id} className="rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[15.5px] font-bold text-[#1A1A2E]">{set.recipient_name}</div>
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
