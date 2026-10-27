'use client'

import { ctaCopy } from '@/constants/ctaCopy'

/**
 * The write/edit-message button on step 3 of both builders. Render it inside the sticky bottom
 * bar: it's absolutely positioned against the bar's top-right edge, so it always floats just above
 * the action buttons — whatever the bar's height — and never near the header.
 */
export function MessagePill({ hasMessage, onClick }: { hasMessage: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 bottom-full mb-3 flex items-center gap-1.5 rounded-full border border-[#1A1A2E]/10 bg-white px-4 py-2.5 font-sans text-[13px] font-bold text-[#1A1A2E] shadow-[0_8px_20px_-8px_rgba(26,26,46,0.35)]"
    >
      <span aria-hidden="true">✉</span>
      {hasMessage ? ctaCopy.editMessageEditLabel : ctaCopy.editMessageWriteLabel}
    </button>
  )
}
