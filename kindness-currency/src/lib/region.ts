import { cookies } from 'next/headers'
import { isPricingRegion, DEFAULT_REGION, type PricingRegion } from '@/lib/geoPricing'

export const REGION_COOKIE = 'kc-region'

/** The visitor's pricing region, as detected by src/proxy.ts and stashed in a cookie — same
 * "helper reads next/headers directly" shape as getOrigin() in origin.ts. Server Actions have no
 * request object of their own but can still call cookies(). */
export async function getRegion(): Promise<PricingRegion> {
  const store = await cookies()
  const value = store.get(REGION_COOKIE)?.value
  return isPricingRegion(value) ? value : DEFAULT_REGION
}
