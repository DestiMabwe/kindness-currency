import { templateVisuals } from '@/constants/designTokens'
import type { GiveCouponSet } from './giveRepository'

export type OgImageContent = {
  recipientName: string
  senderName: string
  accent: string
  motif: string
}

export function getOgImageContent(giveData: GiveCouponSet | null): OgImageContent | null {
  if (!giveData) return null
  const visuals = templateVisuals[giveData.template_slug]
  return {
    recipientName: giveData.recipient_name,
    senderName: giveData.sender_name,
    accent: visuals.accent,
    motif: visuals.motif,
  }
}
