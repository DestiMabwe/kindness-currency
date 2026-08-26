'use client'

import { useDialogA11y } from '@/hooks/useDialogA11y'

export type MessageReplayModalProps = {
  senderName: string
  senderMessage: string
  onClose: () => void
}

/** Lets the recipient re-read the sender's message anytime after the initial reveal, via the envelope icon. */
export function MessageReplayModal({ senderName, senderMessage, onClose }: MessageReplayModalProps) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose)

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-[#1A1A2E]/55 backdrop-blur-[3px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-replay-heading"
        className="w-full rounded-t-[26px] rounded-b-[36px] bg-[#1A1A2E] px-6 pt-7 pb-8 text-center"
      >
        <div aria-hidden="true" className="text-xl">
          ✉
        </div>
        <div id="message-replay-heading" className="mt-2 text-xs tracking-[0.16em] text-white/60 uppercase">
          A gift from {senderName}
        </div>
        <div className="mt-4 text-[17px] leading-relaxed text-white italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          &ldquo;{senderMessage}&rdquo;
        </div>
        <button type="button" onClick={onClose} className="mt-6 rounded-full bg-white px-6 py-3 font-sans text-sm font-bold text-[#1A1A2E]">
          Close
        </button>
      </div>
    </div>
  )
}
