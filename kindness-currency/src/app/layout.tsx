import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  style: ['normal', 'italic'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

// Without metadataBase, Next.js falls back to hardcoding http://localhost:3000 for
// every URL-based metadata field (og:image included) regardless of where the request
// actually came from — silently broken on any deployment, preview, or tunnel. Deriving
// it from the incoming request's own Host header, the same way the auth callback route
// already derives its redirect origin, means it's correct everywhere with zero
// per-environment config.
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')

  return {
    title: 'Kindness Currency',
    description: 'Give the gift of acts of service.',
    metadataBase: host ? new URL(`${protocol}://${host}`) : undefined,
    // The image lives in public/ (not src/app/) so Next's opengraph-image file-convention
    // auto-detection never picks it up — that auto-detected URL ignores metadataBase and
    // (for the root segment specifically) takes priority over an explicit declaration here.
    // Declaring it explicitly instead routes it through the metadataBase resolution that
    // already works for every other field.
    //
    // Square (not 1200x630) and a real designed asset, not a next/og-rendered one — satori's
    // font rendering looked washed out and illegible once WhatsApp/iMessage recompressed it.
    openGraph: {
      images: [{ url: '/opengraph-image.jpg', width: 1200, height: 1200, alt: 'Kindness Currency' }],
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
