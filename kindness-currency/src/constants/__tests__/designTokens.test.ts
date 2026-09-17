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
