'use client'

import { useMemo, useState } from 'react'
import { FEEDBACK_TYPES, type FeedbackType } from '@/schemas/feedbackSchema'
import { buildFollowUpMailto, buildThankYouMailto } from '@/lib/feedbackEmailTemplates'
import type { FeedbackEntry } from '@/lib/feedbackRepository'

export type FeedbackFeedProps = {
  entries: FeedbackEntry[]
}

type FilterValue = FeedbackType | 'all'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function FeedbackFeed({ entries }: FeedbackFeedProps) {
  const [filter, setFilter] = useState<FilterValue>('all')

  const counts = useMemo(() => {
    const byType = new Map<FeedbackType, number>(FEEDBACK_TYPES.map((option) => [option.value, 0]))
    for (const entry of entries) {
      byType.set(entry.type as FeedbackType, (byType.get(entry.type as FeedbackType) ?? 0) + 1)
    }
    return byType
  }, [entries])

  const visibleEntries = filter === 'all' ? entries : entries.filter((entry) => entry.type === filter)

  return (
    <div>
      <div className="flex gap-2">
        {FEEDBACK_TYPES.map((option) => (
          <div key={option.value} className="flex-1 rounded-2xl border border-[#1A1A2E]/8 bg-white p-3">
            <div className="text-[10px] font-semibold tracking-[0.04em] text-[#2C2C2C] uppercase opacity-60">{option.label}</div>
            <div className="mt-0.5 text-[18px] font-extrabold text-[#1A1A2E]">{counts.get(option.value) ?? 0}</div>
          </div>
        ))}
      </div>

      <div role="radiogroup" aria-label="Filter feedback by type" className="mt-3.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          role="radio"
          aria-checked={filter === 'all'}
          onClick={() => setFilter('all')}
          className="rounded-full px-4 py-2 text-[12.5px] font-semibold"
          style={{ backgroundColor: filter === 'all' ? '#C2185B' : '#F0ECE4', color: filter === 'all' ? '#fff' : '#2C2C2C' }}
        >
          All ({entries.length})
        </button>
        {FEEDBACK_TYPES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={filter === option.value}
            onClick={() => setFilter(option.value)}
            className="rounded-full px-4 py-2 text-[12.5px] font-semibold"
            style={{
              backgroundColor: filter === option.value ? '#C2185B' : '#F0ECE4',
              color: filter === option.value ? '#fff' : '#2C2C2C',
            }}
          >
            {option.label} ({counts.get(option.value) ?? 0})
          </button>
        ))}
      </div>

      {visibleEntries.length === 0 ? (
        <div className="mt-3 text-[13px] text-[#2C2C2C] opacity-60">
          {entries.length === 0 ? 'No feedback yet.' : 'No feedback of this type yet.'}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {visibleEntries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold tracking-[0.05em] text-[#C2185B] uppercase">{entry.type}</span>
                <span className="text-[11px] text-[#2C2C2C] opacity-50">{formatDate(entry.createdAt)}</span>
              </div>
              <div className="mt-1.5 text-[13.5px] leading-relaxed text-[#2C2C2C]">{entry.message}</div>
              {entry.email ? (
                <>
                  <a href={`mailto:${entry.email}`} className="mt-2 block text-[12.5px] font-semibold text-[#1A1A2E]">
                    {entry.email}
                  </a>
                  <div className="mt-2 flex gap-1.5">
                    <a
                      href={buildThankYouMailto(entry.email, { type: entry.type as FeedbackType, message: entry.message })}
                      className="rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold"
                      style={{ backgroundColor: '#F0ECE4', color: '#2C2C2C' }}
                    >
                      Thank
                    </a>
                    <a
                      href={buildFollowUpMailto(entry.email, { type: entry.type as FeedbackType, message: entry.message })}
                      className="rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold"
                      style={{ backgroundColor: '#F0ECE4', color: '#2C2C2C' }}
                    >
                      Follow Up
                    </a>
                  </div>
                </>
              ) : (
                <div className="mt-2 text-[12.5px] font-semibold text-[#1A1A2E] opacity-50">No email on file</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
