import { useEffect, useState } from 'react'

const BUSY_RECHECK_MS = 400

/**
 * Opens after `delayMs` — but if another modal (PIN entry, reminder picker…) is open at that
 * moment, waits until it closes rather than landing on top of it mid-task.
 */
export function useDelayedMessageReveal(enabled: boolean, delayMs: number) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let recheck: ReturnType<typeof setInterval> | undefined

    const tryOpen = () => {
      if (document.querySelector('[aria-modal="true"]')) return false
      setIsOpen(true)
      return true
    }

    const timeout = setTimeout(() => {
      if (tryOpen()) return
      recheck = setInterval(() => {
        if (tryOpen()) clearInterval(recheck)
      }, BUSY_RECHECK_MS)
    }, delayMs)

    return () => {
      clearTimeout(timeout)
      clearInterval(recheck)
    }
  }, [enabled, delayMs])

  return [isOpen, () => setIsOpen(false)] as const
}
