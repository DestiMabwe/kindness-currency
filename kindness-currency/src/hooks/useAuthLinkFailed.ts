'use client'

import { useEffect, useState } from 'react'

// /auth/callback flags a failed sign-in-link exchange with ?authError=1 (expired/already-used
// code, or the link opened in a different browser than the one that requested it) rather than
// silently landing the sender on the page looking logged in when they're not. Read once on mount
// and strip the flag so refreshing doesn't keep re-showing it.
export function useAuthLinkFailed() {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (url.searchParams.get('authError') !== '1') return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-mount sync from the URL, not a render-time update
    setFailed(true)
    url.searchParams.delete('authError')
    window.history.replaceState({}, '', url.toString())
  }, [])

  return { failed, dismiss: () => setFailed(false) }
}
