'use client'

import { useState } from 'react'
import { ctaCopy } from '@/constants/ctaCopy'

export type GiftReadyScreenProps = {
  shareLink: string
  pin: string
}

export function GiftReadyScreen({ shareLink, pin }: GiftReadyScreenProps) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
    } catch {
      // Clipboard access can be denied — the link is still selectable/visible on screen.
    }
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareLink)}`, '_blank', 'noopener,noreferrer')
  }

  const webShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: shareLink })
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-5.5 pb-7.5">
      <div className="pt-13 text-center">
        <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#C2185B] text-[34px] text-white">
          ♥
        </div>
        <div className="mt-4.5 text-[30px] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Your gift is ready
        </div>
        <div className="mt-2 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-75">
          Share the link and PIN separately, so the surprise stays a surprise.
        </div>
      </div>

      <div className="mt-6.5 rounded-[18px] border border-[#1A1A2E]/8 bg-white p-4">
        <div className="text-[10.5px] font-semibold tracking-[0.1em] text-[#2C2C2C] uppercase opacity-55">Shareable link</div>
        <div className="mt-2 truncate rounded-[10px] border border-[#1A1A2E]/10 bg-[#FFF8F0] p-2.75 text-[12.5px] text-[#1A1A2E]">
          {shareLink}
        </div>
      </div>

      <div className="mt-3.5 rounded-[18px] bg-[#1A1A2E] p-4.5 text-center">
        <div className="text-[10.5px] font-semibold tracking-[0.1em] text-white/55 uppercase">Their 4-digit PIN</div>
        <div className="mt-2.5 flex items-center justify-center gap-3">
          {pin.split('').map((digit, i) => (
            <span
              key={i}
              className="flex h-[58px] w-[46px] items-center justify-center rounded-xl border border-white/16 bg-white/6 text-[30px] font-bold text-white"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {digit}
            </span>
          ))}
        </div>
        <div className="mt-3 text-[11.5px] leading-relaxed text-[#FF8F00]">{ctaCopy.giftReadyPinInstruction}</div>
      </div>

      <div className="mt-4.5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={shareWhatsApp}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] p-3.5 font-sans text-[15px] font-bold text-white"
        >
          <span className="text-[17px]">✆</span> Share via WhatsApp
        </button>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 rounded-[13px] border-[1.5px] border-[#1A1A2E]/16 bg-white p-3 font-sans text-[13.5px] font-semibold text-[#1A1A2E]"
          >
            {copied ? 'Copied ✓' : 'Copy Link'}
          </button>
          <button
            type="button"
            onClick={webShare}
            className="flex-1 rounded-[13px] border-[1.5px] border-[#1A1A2E]/16 bg-white p-3 font-sans text-[13.5px] font-semibold text-[#1A1A2E]"
          >
            Share…
          </button>
        </div>
      </div>
    </div>
  )
}
