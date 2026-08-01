import styles from './CouponCardHero.module.css'

export type CouponCardHeroProps = {
  serviceTitle: string
  microCopy?: string | null
  finePrint?: string | null
}

export function CouponCardHero({ serviceTitle, microCopy, finePrint }: CouponCardHeroProps) {
  return (
    <div className={styles.card}>
      <div className={styles.inner}>
        <div className={styles.stub}>
          <div className={styles.barcode} />
        </div>
        <div className={styles.perforation} />
        <div className={styles.content}>
          <p className={styles.eyebrow}>GOOD FOR ONE</p>
          <h1
            className={styles.headline}
            style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}
          >
            {serviceTitle}
          </h1>
          {microCopy && <p className={styles.subline}>{microCopy}</p>}
          {finePrint && <p className={styles.finePrint}>{finePrint}</p>}
        </div>
      </div>
    </div>
  )
}
