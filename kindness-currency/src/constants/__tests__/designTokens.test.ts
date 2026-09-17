import { describe, it, expect } from 'vitest'
import { resolveGiftVisual, templateVisuals, colors } from '../designTokens'
import { antiqueGold, singleUseGestures } from '@/lib/singleUseGestures'

describe('resolveGiftVisual', () => {
  it('resolves a bundle template slug from templateVisuals', () => {
    expect(resolveGiftVisual('mothers_day')).toEqual({
      accent: templateVisuals.mothers_day.accent,
      motif: templateVisuals.mothers_day.motif,
    })
  })

  // Regression test: give/[id]/page.tsx used to look templateVisuals[slug] up directly, which is
  // undefined for any single-use gesture slug (templateVisuals only ever covered bundle
  // templates) — crashing the recipient page for every gesture coupon ever sent. This is the
  // function that closes that gap.
  it('resolves a single-use gesture slug to the shared antiqueGold accent and its own motif, not undefined', () => {
    const gesture = singleUseGestures.find((g) => g.slug === 'relief')!

    expect(resolveGiftVisual('relief')).toEqual({ accent: antiqueGold, motif: gesture.motif })
  })

  it('falls back to a neutral default for an unrecognized or null slug, never undefined', () => {
    expect(resolveGiftVisual('not-a-real-slug')).toEqual({ accent: colors.secondary, motif: '✦' })
    expect(resolveGiftVisual(null)).toEqual({ accent: colors.secondary, motif: '✦' })
  })
})

describe('templateVisuals accent format', () => {
  // Regression test: mothers_day's accent was 'rgb(131, 131, 228)' while every other template
  // used hex. Several call sites build a translucent tint by string-concatenating a hex alpha
  // suffix onto accent (CouponCardHero's soft-glow effect, CartCompleteView, ProfileCartSection)
  // — appending hex digits onto an rgb(...) string is invalid CSS the browser silently drops, so
  // Mom's Promise Tokens' soft-glow effect never actually rendered. Every accent must stay hex.
  it('is a hex color for every template, never rgb()/hsl(), so `${accent}<hexAlpha>` concatenation stays valid CSS', () => {
    for (const [slug, visual] of Object.entries(templateVisuals)) {
      expect(visual.accent, `${slug}'s accent`).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
