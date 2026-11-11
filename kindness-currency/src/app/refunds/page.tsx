import { LegalPage, LegalSection } from '@/components/shared/LegalPage'
import { legal } from '@/constants/legal'

export const metadata = { title: 'Refund & Cancellation Policy | Kindness Currency' }

export default function RefundsPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy">
      <p>
        {legal.brandName} is operated by {legal.businessName}. All purchases are one-time payments. There are no
        subscriptions, so there is nothing to cancel and you will never be charged again automatically.
      </p>

      <LegalSection heading="When you can get a refund">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-bold">Unsent coupon sets:</span> if you have not yet sent your coupon set, you can
            request a full refund within {legal.refundWindowDays} days of purchase.
          </li>
          <li>
            <span className="font-bold">Duplicate or failed deliveries:</span> if you were charged twice, or paid and
            did not receive what you bought, we will fix it or refund you in full.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="When refunds are not available">
        <p>
          Once a coupon set or one-time gesture has been sent to a recipient or redeemed, the digital product has
          been delivered and it can no longer be refunded. Requests made more than {legal.refundWindowDays} days
          after purchase are not eligible, except for duplicate charges or non-delivery as described above.
        </p>
      </LegalSection>

      <LegalSection heading="How to request a refund">
        <p>
          Email{' '}
          <a href={`mailto:${legal.supportEmail}`} className="font-semibold underline">
            {legal.supportEmail}
          </a>{' '}
          with your order number and the email address you used to pay. We aim to reply within 2 business days.
        </p>
      </LegalSection>

      <LegalSection heading="How refunds are paid">
        <p>
          Approved refunds are returned to your original payment method through Paystack. They usually appear within
          5 to 10 business days, depending on your bank.
        </p>
      </LegalSection>

      <p>Nothing in this policy limits any rights you have under South African consumer law.</p>
    </LegalPage>
  )
}
