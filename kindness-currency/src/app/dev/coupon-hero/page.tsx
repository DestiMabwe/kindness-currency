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
        finePrint="Redeemable anytime"
        accent="#D4658A"
        backgroundEffect="sparkle"
        motif="❀"
        imageSrc="/images/mothers_day.png"
        expiresAt="2026-12-25"
        status="sent"
      />
    </div>
  )
}
