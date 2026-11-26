'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ctaCopy } from '@/constants/ctaCopy'
import { loginHref } from '@/lib/authRedirect'

export type SaveToAccountBannerProps = {
  setId: string
  isLoggedIn: boolean
  alreadyLinked: boolean
  /** Claims setId for the current account — linkRecipientAction or linkSenderAction. */
  linkAction: (setId: string) => Promise<{ success: boolean }>
  /** The page the login page should send the viewer back to, to resume the pending link. */
  redirectTo: string
  /** Distinguishes this banner's localStorage keys from another usage on the same setId (e.g. recipient vs sender). */
  storageScope: string
}

const dismissedKey = (scope: string, setId: string) => `kindness-currency:save-banner-dismissed:${scope}:${setId}`
/** Exported so a caller whose own screen state doesn't survive the trip to the login page (e.g. CouponSetBuilder's giftReady screen) can check whether one of its links is mid-login and needs restoring. */
export const pendingLinkKey = (scope: string, setId: string) => `kindness-currency:pending-link:${scope}:${setId}`

export function SaveToAccountBanner({ setId, isLoggedIn, alreadyLinked, linkAction, redirectTo, storageScope }: SaveToAccountBannerProps) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [linked, setLinked] = useState(alreadyLinked)
  const [linking, setLinking] = useState(false)
  const router = useRouter()

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time completion of a link the user already started before logging in, not a render-time sync
    void performLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finishes a link started before login, on mount (after coming back from the login page); the flag is removed first so it can't run twice
  }, [isLoggedIn])

  const handleClick = () => {
    if (isLoggedIn) {
      void performLink()
      return
    }
    window.localStorage.setItem(pendingLinkKey(storageScope, setId), 'true')
    router.push(loginHref(redirectTo))
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
    </div>
  )
}
