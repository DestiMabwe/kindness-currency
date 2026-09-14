import { headers } from 'next/headers'

/** Derives the current request's origin from its own Host header — environment-aware with zero
 * config, same approach src/app/layout.tsx's generateMetadata uses for metadataBase. Route
 * handlers can read this straight off `request.url` instead; this is for Server Actions, which
 * have no request object of their own but can still call headers(). */
export async function getOrigin(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}
