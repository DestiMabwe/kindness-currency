import { singleUseGestures, antiqueGold } from '@/lib/singleUseGestures'

export const colors = {
  primary: '#1A1A2E', // Deep Ink
  secondary: '#C2185B', // Kindness Red
  accent: '#FF8F00', // Warmth Amber
  background: '#FFF8F0', // Cream
  text: '#2C2C2C', // Near Black
} as const

export const fonts = {
  display: 'var(--font-playfair)',
  sans: 'var(--font-dm-sans)',
} as const

export const colorWheelSwatches = [
  '#FFF8F0',
  '#FBE7EE',
  '#FBDCE6',
  '#FFEAC9',
  '#EFE0EA',
  '#DCEEE8',
] as const

export type TemplateSlug = 'mothers_day' | 'valentines' | 'birthday' | 'lovers' | 'besties' | 'requested-by-him' | 'requested-by-her'

export const templateVisuals: Record<
  TemplateSlug,
  // coverImageSrc is null for templates with no staged cover-book photo yet — see
  // TemplateCoverArt, the composed accent/motif fallback CouponSetBuilder and the home
  // gallery render instead of <Image> in that case.
  { accent: string; tint: string; motif: string; imageSrc: string; coverImageSrc: string | null; previewMessage: string }
> = {
  mothers_day: {
    accent: 'rgb(131, 131, 228)',
    tint: '#FBE7EE',
    motif: '❀',
    imageSrc: '/images/mothers_day.png',
    coverImageSrc: '/images/covers/mothers_day.png',
    previewMessage: 'For everything you do without ever being asked — a few ways I want to take care of you now.',
  },
  valentines: {
    accent: '#C2185B',
    tint: '#FBDCE6',
    motif: '❦',
    imageSrc: '/images/valentines.png',
    coverImageSrc: '/images/covers/valentines.png',
    previewMessage: "A few ways I want to make you feel loved this Valentine's Day.",
  },
  birthday: {
    accent: '#FF8F00',
    tint: '#FFEAC9',
    motif: '✺',
    imageSrc: '/images/birthday.png',
    coverImageSrc: '/images/covers/birthday.png',
    previewMessage: 'As we celebrate another birthday together, here is a gift from me to you.',
  },
  lovers: {
    accent: '#7B3F61',
    tint: '#EFE0EA',
    motif: '☾',
    imageSrc: '/images/lovers.png',
    coverImageSrc: '/images/covers/lovers.png',
    previewMessage: "Slow down with me. A few promises just for us, whenever you're ready.",
  },
  besties: {
    accent: '#2E7D6B',
    tint: '#DCEEE8',
    motif: '✦',
    imageSrc: '/images/besties.png',
    coverImageSrc: '/images/covers/besties.png',
    previewMessage: "For my ride-or-die — a few ways I've got your back, any time.",
  },
  'requested-by-him': {
    accent: '#2C3E63',
    tint: '#E3E7F0',
    motif: '✩',
    imageSrc: '/images/requested-by-him.png',
    coverImageSrc: '/images/covers/requested-by-him.png',
    previewMessage: "No guessing what I actually want — here's exactly what would mean something.",
  },
  'requested-by-her': {
    accent: '#CD7479',
    tint: '#F8E3E1',
    motif: '❈',
    imageSrc: '/images/requested-by-her.png',
    coverImageSrc: '/images/covers/requested-by-her.png',
    previewMessage: "No guessing what I actually want — here's exactly what would mean something.",
  },
}

/**
 * Resolves the accent color and motif icon for a gift, given its template's
 * slug. Handles both bundle templates (`templateVisuals`) and single-use
 * gestures (`singleUseGestures`, which share one accent — `antiqueGold` —
 * across the whole tier), falling back to a neutral default for anything
 * unrecognized so callers never have to null-check the result.
 */
export function resolveGiftVisual(templateSlug: string | null): { accent: string; motif: string } {
  if (templateSlug && templateSlug in templateVisuals) {
    const visual = templateVisuals[templateSlug as TemplateSlug]
    return { accent: visual.accent, motif: visual.motif }
  }
  const gesture = singleUseGestures.find((g) => g.slug === templateSlug)
  if (gesture) return { accent: antiqueGold, motif: gesture.motif }
  return { accent: colors.secondary, motif: '✦' }
}
