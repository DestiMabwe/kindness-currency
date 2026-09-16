import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isPricingRegion, regionFromCountryCode } from '@/lib/geoPricing'
import { REGION_COOKIE } from '@/lib/region'

// Blocks the ?region= override the moment EITHER signal says production — deny-if-either rather
// than deny-if-both, so a single misconfigured env var can't reopen the hole. NODE_ENV alone isn't
// enough to trust here: `next build` always sets it to 'production', but nothing stops a
// misconfigured deployment from overriding it, and VERCEL_ENV alone doesn't help a non-Vercel
// deployment. Together they cover both cases without either one being a single point of failure.
function isProductionEnvironment(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  // Dev-only preview: ?region=ZA lets pricing be checked locally without deploying (Vercel's geo
  // header isn't present in local dev). Never honored in production — a URL param can't spoof
  // pricing (and therefore the real ZAR charge amount) for a real visitor.
  const override = isProductionEnvironment() ? null : request.nextUrl.searchParams.get('region')
  const region = isPricingRegion(override) ? override : regionFromCountryCode(request.headers.get('x-vercel-ip-country'))
  response.cookies.set(REGION_COOKIE, region, { path: '/', maxAge: 60 * 60 * 24 * 30 })

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
