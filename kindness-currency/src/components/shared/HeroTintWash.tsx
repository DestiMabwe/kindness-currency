'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

export type HeroTintWashProps = {
  /** Accent used until the first measurement (and for the server render). */
  initialTint: string
  className?: string
  children: ReactNode
}

/**
 * Hero background that takes on the accent of whichever marquee card is nearest the hero's
 * horizontal center. Cards opt in with a `data-hero-accent` attribute; the cross-fade itself is
 * CSS (`.kc-hero-wash`), so this only sets the `--hero-tint` custom property.
 */
export function HeroTintWash({ initialTint, className, children }: HeroTintWashProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-accent]'))
    if (cards.length === 0) return

    const update = () => {
      const rootRect = root.getBoundingClientRect()
      const center = rootRect.left + rootRect.width / 2
      let nearest = cards[0]
      let nearestDistance = Infinity
      for (const card of cards) {
        const rect = card.getBoundingClientRect()
        const distance = Math.abs(rect.left + rect.width / 2 - center)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = card
        }
      }
      const accent = nearest.dataset.heroAccent
      if (accent) root.style.setProperty('--hero-tint', accent)
    }

    update()
    // Cards pass the center every few seconds, so a coarse poll is plenty.
    const id = window.setInterval(update, 250)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div ref={ref} className={className} style={{ '--hero-tint': initialTint } as CSSProperties}>
      {children}
    </div>
  )
}
