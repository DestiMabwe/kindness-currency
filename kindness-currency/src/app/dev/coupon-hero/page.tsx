import { CouponCardHero } from '@/components/coupon/CouponCardHero'

/**
 * Scratch route for visually validating CouponCardHero during #18-#22.
 * Remove once the component is wired into real screens in #23/#24.
 */
export default function CouponHeroDevPreview() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0e9e4' }}>
      <CouponCardHero
        serviceTitle="Home Cooked Meal"
        microCopy="Just the way you like it"
        finePrint="No expiry date"
        accent="#D4658A"
        backgroundEffect="sparkle"
      />
    </div>
  )
}
