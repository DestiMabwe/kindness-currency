'use client'

import { useState } from 'react'
import { GiftMessageCard } from './GiftMessageCard'
import { ctaCopy } from '@/constants/ctaCopy'

export type GiftLetterStripProps = {
  senderName: string
  senderMessage: string | null
  accent: string
}

/**
 * The sender's message as a note tucked into the recipient hero — who it's from plus the opening
 * line trailing off — so it's always one tap from being re-read without a floating icon that
 * could sit over the navbar.
 */
export function GiftLetterStrip({ senderName, senderMessage, accent }: GiftLetterStripProps) {
  const [open, setOpen] = useState(false)

  if (!senderMessage) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto mt-4 flex w-full max-w-[320px] items-center gap-3 rounded-2xl border border-white/25 bg-white/12 px-3.5 py-3 text-left backdrop-blur-[2px]"
      >
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base" style={{ color: accent }}>
          ✉
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10.5px] font-bold tracking-[0.14em] uppercase opacity-80">{ctaCopy.giftLetterFrom(senderName)}</span>
          <span className="mt-0.5 block truncate text-[14px] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            &ldquo;{senderMessage}&rdquo;
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-lg opacity-70">
          ›
        </span>
      </button>

      {open && (
        <GiftMessageCard senderName={senderName} senderMessage={senderMessage} accent={accent} entrance="rise" onClose={() => setOpen(false)} />
      )}
    </>
  )
}
