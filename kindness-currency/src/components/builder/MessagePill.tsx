'use client'

import { ctaCopy } from '@/constants/ctaCopy'

/**
 * The write/edit-message button on step 3 of both builders. Render it inside the sticky bottom
 * bar, under the action buttons: it sits in the bar's normal flow, so it never floats over the
 * personalization options scrolling behind the bar.
 */
export function MessagePill({ hasMessage, onClick }: { hasMessage: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-[13px] border border-[#1A1A2E]/10 bg-white px-4 py-2.5 font-sans text-[13px] font-bold text-[#1A1A2E]"
    >
      <span aria-hidden="true">✉</span>
      {hasMessage ? ctaCopy.editMessageEditLabel : ctaCopy.editMessageWriteLabel}
    </button>
  )
}
