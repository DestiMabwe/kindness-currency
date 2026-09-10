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

export type TemplateSlug = 'mothers_day' | 'valentines' | 'birthday' | 'lovers' | 'besties'

export const templateVisuals: Record<
  TemplateSlug,
  { accent: string; tint: string; motif: string; imageSrc: string; coverImageSrc: string; previewMessage: string }
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
}
