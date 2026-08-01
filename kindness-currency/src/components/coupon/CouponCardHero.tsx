import styles from './CouponCardHero.module.css'

export function CouponCardHero() {
  return (
    <div className={styles.card}>
      <div className={styles.inner}>
        <div className={styles.stub}>
          <div className={styles.barcode} />
        </div>
        <div className={styles.perforation} />
        <div className={styles.content}>
          <span className={styles.placeholder}>Coupon content placeholder</span>
        </div>
      </div>
    </div>
  )
}
