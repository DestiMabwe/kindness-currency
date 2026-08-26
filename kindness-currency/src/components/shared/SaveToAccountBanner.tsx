'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ctaCopy } from '@/constants/ctaCopy'

const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

export type SaveToAccountBannerProps = {
  setId: string
  isLoggedIn: boolean
  alreadyLinked: boolean
  /** Claims setId for the current account — linkRecipientAction or linkSenderAction. */
  linkAction: (setId: string) => Promise<{ success: boolean }>
  /** Where the auth redirect should land the viewer back, to resume the pending link. */
  redirectTo: string
  /** Distinguishes this banner's localStorage keys from another usage on the same setId (e.g. recipient vs sender). */
  storageScope: string
}

const dismissedKey = (scope: string, setId: string) => `kindness-currency:save-banner-dismissed:${scope}:${setId}`
const pendingLinkKey = (scope: string, setId: string) => `kindness-currency:pending-link:${scope}:${setId}`

export function SaveToAccountBanner({ setId, isLoggedIn, alreadyLinked, linkAction, redirectTo, storageScope }: SaveToAccountBannerProps) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [linked, setLinked] = useState(alreadyLinked)
  const [linking, setLinking] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const performLink = async () => {
    setLinking(true)
    const result = await linkAction(setId)
    setLinking(false)
    if (result.success) setLinked(true)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-mount sync from localStorage, not a render-time update
    setDismissed(window.localStorage.getItem(dismissedKey(storageScope, setId)) === 'true')
    setReady(true)
  }, [setId, storageScope])

  useEffect(() => {
    if (!isLoggedIn || alreadyLinked) return
    if (window.localStorage.getItem(pendingLinkKey(storageScope, setId)) !== 'true') return
    window.localStorage.removeItem(pendingLinkKey(storageScope, setId))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time completion of a link the user already started before the auth redirect, not a render-time sync
    void performLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount to finish a link the user already started before the auth redirect
  }, [])

  const handleClick = () => {
    if (isLoggedIn) {
      void performLink()
      return
    }
    window.localStorage.setItem(pendingLinkKey(storageScope, setId), 'true')
    setAuthOpen(true)
  }

  const dismiss = () => {
    window.localStorage.setItem(dismissedKey(storageScope, setId), 'true')
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

      {authOpen && <AuthGate redirectTo={redirectTo} onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
