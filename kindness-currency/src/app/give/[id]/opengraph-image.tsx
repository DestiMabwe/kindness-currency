import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createServiceClient } from '@/lib/supabase/service'
import { createGiveRepository } from '@/lib/giveRepository'
import { getOgImageContent } from '@/lib/ogImageContent'

export const alt = 'A Kindness Currency gift'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadLogoSrc() {
  const logoData = await readFile(join(process.cwd(), 'public/logo.png'), 'base64')
  return `data:image/png;base64,${logoData}`
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const giveData = await createGiveRepository(createServiceClient()).getCouponSetForRecipient(id)
  const content = getOgImageContent(giveData)
  const logoSrc = await loadLogoSrc()

  if (!content) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#1A1A2E',
          }}
        >
          <img src={logoSrc} width={120} height={86} alt="" />
          <div style={{ marginTop: 24, fontSize: 40, fontWeight: 700, color: '#fff' }}>Kindness Currency</div>
        </div>
      ),
      { ...size }
    )
  }

  const { recipientName, senderName, accent } = content

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: accent,
          position: 'relative',
        }}
      >
        {/* satori's default font is missing glyphs for the app's per-template motif characters (❦ ❀ ✺ ☾ ✦) — ♥ is the one confirmed to render, so it stands in here rather than risking a tofu box. */}
        <div style={{ display: 'flex', position: 'absolute', fontSize: 260, opacity: 0.16, color: '#fff' }}>♥</div>
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: '6px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          Good For One ♥
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            maxWidth: 940,
            textAlign: 'center',
            justifyContent: 'center',
            fontSize: 58,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          For {recipientName}, with love from {senderName}
        </div>
        <img src={logoSrc} width={64} height={46} alt="" style={{ position: 'absolute', right: 48, bottom: 40 }} />
      </div>
    ),
    { ...size }
  )
}
