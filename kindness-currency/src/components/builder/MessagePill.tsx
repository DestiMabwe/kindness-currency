'use client'

import { ctaCopy } from '@/constants/ctaCopy'

/**
 * The edit-message button on step 3 of both builders. Render it inside the sticky bottom bar,
 * in the same row as the Preview button: it sits in the bar's normal flow, so it never floats
 * over the personalization options scrolling behind the bar. Always reads "Edit your message":
 * the message is written on the details step, so by step 3 there's something to edit.
 */
export function MessagePill({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-[13px] border-[1.5px] border-[#1A1A2E]/25 bg-white p-3 font-sans text-sm font-semibold text-[#1A1A2E]"
    >
      <span aria-hidden="true">✉</span>
      {ctaCopy.editMessageEditLabel}
    </button>
  )
}
