import type { CSSProperties } from 'react'
import type { BackgroundEffect } from '@/schemas/couponSchema'
import styles from './CouponCardHero.module.css'

export type CouponCardHeroProps = {
  serviceTitle: string
  microCopy?: string | null
  finePrint?: string | null
  accent: string
  backgroundColor?: string | null
  backgroundEffect: BackgroundEffect
  motif: string
  imageSrc?: string | null
  expiresAt?: string | null
}

function formatStubLabel(expiresAt?: string | null): string {
  if (!expiresAt) return 'NO EXPIRY DATE'
  const date = new Date(`${expiresAt}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

export function CouponCardHero({
  serviceTitle,
  microCopy,
  finePrint,
  accent,
  backgroundColor,
  backgroundEffect,
  motif,
  imageSrc,
  expiresAt,
}: CouponCardHeroProps) {
  return (
    <div className={styles.card} style={{ '--hero-accent': accent } as CSSProperties}>
      <div className={styles.inner} style={{ backgroundColor: backgroundColor ?? '#FFF8F0' }}>
        {backgroundEffect === 'soft-glow' && (
          <div
            className={styles.glow}
            style={{ background: `radial-gradient(120px 90px at 30% 25%, ${accent}33, transparent 70%)` }}
          />
        )}
        {backgroundEffect === 'confetti' && (
          <div className={styles.confetti}>
            <span className={styles.confettiPieceSquare} style={{ top: '14%', left: '30%', background: '#C2185B' }} />
            <span className={styles.confettiPieceDot} style={{ top: '62%', left: '18%', background: '#FF8F00' }} />
            <span className={styles.confettiPieceSquare} style={{ top: '30%', left: '55%', background: '#D4658A' }} />
            <span className={styles.confettiPieceDot} style={{ top: '78%', left: '46%', background: '#C2185B' }} />
            <span className={styles.confettiPieceSquare} style={{ top: '20%', left: '70%', background: '#FF8F00' }} />
          </div>
        )}
        {backgroundEffect === 'sparkle' && (
          <div className={styles.sparkle} style={{ color: accent }}>
            <span style={{ top: '12%', left: '32%' }}>✦</span>
            <span style={{ top: '58%', left: '20%' }}>✦</span>
            <span style={{ top: '34%', left: '58%' }}>✦</span>
            <span style={{ top: '76%', left: '48%' }}>✦</span>
          </div>
        )}
        <div className={styles.stub}>
          <div className={styles.barcode} />
          <div className={styles.stubLabel}>{formatStubLabel(expiresAt)}</div>
        </div>
        <div className={styles.perforation} />
        <div className={imageSrc ? `${styles.content} ${styles.contentWithImage}` : styles.content}>
          <p className={styles.eyebrow}>GOOD FOR ONE</p>
          <h1
            className={styles.headline}
            style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}
          >
            {serviceTitle}
          </h1>
          {microCopy && <p className={styles.subline}>{microCopy}</p>}
          {finePrint && <p className={styles.finePrint}>{finePrint}</p>}
          {imageSrc ? (
            <img className={styles.decorativeImage} src={imageSrc} alt="" />
          ) : (
            <div className={styles.decorativeMotif} style={{ color: accent }}>
              {motif}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
