'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { linkRecipientAction } from '@/app/give/[id]/actions'
import { ctaCopy } from '@/constants/ctaCopy'

const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

export type SaveToAccountBannerProps = {
  setId: string
  isLoggedIn: boolean
  alreadyLinked: boolean
}

const dismissedKey = (setId: string) => `kindness-currency:save-banner-dismissed:${setId}`
const pendingLinkKey = (setId: string) => `kindness-currency:pending-link:${setId}`

export function SaveToAccountBanner({ setId, isLoggedIn, alreadyLinked }: SaveToAccountBannerProps) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [linked, setLinked] = useState(alreadyLinked)
  const [linking, setLinking] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const performLink = async () => {
    setLinking(true)
    const result = await linkRecipientAction(setId)
    setLinking(false)
    if (result.success) setLinked(true)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-mount sync from localStorage, not a render-time update
    setDismissed(window.localStorage.getItem(dismissedKey(setId)) === 'true')
    setReady(true)
  }, [setId])

  useEffect(() => {
    if (!isLoggedIn || alreadyLinked) return
    if (window.localStorage.getItem(pendingLinkKey(setId)) !== 'true') return
    window.localStorage.removeItem(pendingLinkKey(setId))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time completion of a link the user already started before the auth redirect, not a render-time sync
    void performLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount to finish a link the user already started before the auth redirect
  }, [])

  const handleClick = () => {
    if (isLoggedIn) {
      void performLink()
      return
    }
    window.localStorage.setItem(pendingLinkKey(setId), 'true')
    setAuthOpen(true)
  }

  const dismiss = () => {
    window.localStorage.setItem(dismissedKey(setId), 'true')
    setDismissed(true)
  }

  if (!ready || linked || dismissed) return null

  return (
    <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#1A1A2E]/8 bg-white px-4 py-3.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={linking}
        className="text-left text-[13px] font-semibold text-[#1A1A2E] disabled:opacity-60"
      >
        {isLoggedIn ? ctaCopy.addToAccountBanner : ctaCopy.saveToAccountBanner}
      </button>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 p-1 text-[15px] text-[#2C2C2C] opacity-50">
        ✕
      </button>

      {authOpen && <AuthGate redirectTo={`/give/${setId}`} onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
