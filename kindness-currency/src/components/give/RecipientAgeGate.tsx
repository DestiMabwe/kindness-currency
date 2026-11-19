'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AgeGate } from '@/components/modals/AgeGate'
import { ctaCopy } from '@/constants/ctaCopy'
import { confirmRecipientAgeAction } from '@/app/give/[id]/actions'

/**
 * Shown by /give/[id] in place of the whole gift for an age-restricted set until this browser holds
 * the age cookie. The server component renders nothing but this — no names, message or coupons are
 * in the HTML — so confirming sets the cookie via a server action and refreshes to load the gift.
 */
export function RecipientAgeGate({ setId }: { setId: string }) {
  const router = useRouter()
  const [declined, setDeclined] = useState(false)
  const [, startTransition] = useTransition()

  const confirm = () => {
    startTransition(async () => {
      const result = await confirmRecipientAgeAction(setId)
      if (result.success) router.refresh()
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FFF8F0] px-6 text-center">
      {declined ? (
        <div className="max-w-sm">
          <h1 className="text-2xl font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            {ctaCopy.ageGateDeclinedHeading}
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#2C2C2C]">{ctaCopy.ageGateDeclinedBody}</p>
          <button
            type="button"
            onClick={() => setDeclined(false)}
            className="mt-5 rounded-[14px] bg-[#C2185B] px-6 py-3.5 font-sans text-[15px] font-bold text-white"
          >
            {ctaCopy.ageGateDismiss}
          </button>
        </div>
      ) : (
        <AgeGate templateName={ctaCopy.ageGateRecipientSubject} onConfirm={confirm} onDismiss={() => setDeclined(true)} />
      )}
    </main>
  )
}
