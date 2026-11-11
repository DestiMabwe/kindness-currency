import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/shared/LegalPage'
import { legal } from '@/constants/legal'

export const metadata = { title: 'Terms of Service | Kindness Currency' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms apply to your use of {legal.brandName} (the &ldquo;Service&rdquo;), operated by{' '}
        {legal.businessName}, {legal.country}. By using the Service you agree to them.
      </p>

      <LegalSection heading="What the Service is">
        <p>
          {legal.brandName} lets you create digital coupons for acts of service, send them to someone through a
          private link, and lets the recipient redeem them. A coupon is a personal promise between the sender and the
          recipient. {legal.businessName} does not fulfil the promises made in coupons and is not a party to them.
        </p>
      </LegalSection>

      <LegalSection heading="Accounts">
        <p>
          You sign in with Google or an emailed magic link. You are responsible for activity on your account and for
          keeping your sign-in email secure. You must be old enough to form a binding contract where you live, or
          have a parent or guardian&apos;s permission.
        </p>
      </LegalSection>

      <LegalSection heading="Purchases and payment">
        <p>
          Paid coupon sets and one-time gestures are one-time purchases. Prices are shown before you pay. Payments are
          processed securely by Paystack, and we never see or store your card details. Refunds are covered by our{' '}
          <Link href="/refunds" className="font-semibold underline">
            Refund &amp; Cancellation Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>harass, threaten or deceive anyone, or send unwanted content;</li>
          <li>create coupons that are unlawful, sexually explicit involving minors, or promote harm;</li>
          <li>try to guess PINs, bypass redemption controls, or interfere with the Service;</li>
          <li>copy or resell the Service or its designs without permission.</li>
        </ul>
        <p>We may remove content or suspend accounts that break these rules.</p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          You keep ownership of the messages and text you write. You give us permission to store and display them so
          the Service can work, including showing them to the recipient you choose. Coupon links are private, but
          anyone who has a link can open it, so share it only with the intended recipient.
        </p>
      </LegalSection>

      <LegalSection heading="Availability and liability">
        <p>
          We work to keep the Service running but do not guarantee it will always be available or error-free. To the
          extent the law allows, {legal.businessName} is not liable for indirect or consequential losses, or for
          anything that happens between a sender and a recipient. Our total liability for any claim is limited to the
          amount you paid for the item the claim relates to. Nothing here limits rights you have under South African
          consumer law.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and governing law">
        <p>
          We may update these terms and will change the date above when we do. Continuing to use the Service after a
          change means you accept it. These terms are governed by the laws of {legal.country}.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions?{' '}
          <a href={`mailto:${legal.supportEmail}`} className="font-semibold underline">
            {legal.supportEmail}
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  )
}
