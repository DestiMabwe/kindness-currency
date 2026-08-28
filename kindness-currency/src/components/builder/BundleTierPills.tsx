'use client'

// Filter pills for the bundle-template list, one per PRICING.md tier. Tapping an already-active
// pill clears it back to "show every tier" (there's no separate "All" pill here, unlike
// FilterPills — three tiers is the whole set, so toggling off is how "all" is reached).

import { ctaCopy } from '@/constants/ctaCopy'
import type { BundleTier } from '@/lib/bundleTiers'

export function BundleTierPills({ value, onChange }: { value: BundleTier | null; onChange: (value: BundleTier | null) => void }) {
  const pills: { value: BundleTier; label: string }[] = [
    { value: 'everyday', label: ctaCopy.bundleTierPillEveryday },
    { value: 'occasion', label: ctaCopy.bundleTierPillOccasion },
    { value: 'romance', label: ctaCopy.bundleTierPillRomance },
  ]
  return (
    <div className="flex gap-1 overflow-x-auto px-5.5 pb-1">
      {pills.map((pill) => (
        <button
          key={pill.value}
          type="button"
          aria-pressed={value === pill.value}
          onClick={() => onChange(value === pill.value ? null : pill.value)}
          className="shrink-0 rounded-full px-2 py-1.5 text-[10px] font-semibold whitespace-nowrap transition-colors"
          style={{
            backgroundColor: value === pill.value ? '#1A1A2E' : '#F0ECE4',
            color: value === pill.value ? '#fff' : '#2C2C2C',
          }}
        >
          {pill.label}
        </button>
      ))}
    </div>
  )
}
