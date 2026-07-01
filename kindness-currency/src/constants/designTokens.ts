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

export const templateVisuals: Record<TemplateSlug, { accent: string; tint: string; motif: string }> = {
  mothers_day: { accent: '#D4658A', tint: '#FBE7EE', motif: '❀' },
  valentines: { accent: '#C2185B', tint: '#FBDCE6', motif: '❦' },
  birthday: { accent: '#FF8F00', tint: '#FFEAC9', motif: '✺' },
  lovers: { accent: '#7B3F61', tint: '#EFE0EA', motif: '☾' },
  besties: { accent: '#2E7D6B', tint: '#DCEEE8', motif: '✦' },
}
