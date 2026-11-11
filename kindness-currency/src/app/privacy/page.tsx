import { LegalPage, LegalSection } from '@/components/shared/LegalPage'
import { legal } from '@/constants/legal'

export const metadata = { title: 'Privacy Policy | Kindness Currency' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {legal.businessName} ({legal.country}) operates {legal.brandName}. This policy explains what personal
        information we collect and how we handle it, in line with South Africa&apos;s Protection of Personal
        Information Act (POPIA).
      </p>

      <LegalSection heading="What we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-bold">Account details:</span> your email address and, if you sign in with Google,
            your basic Google profile.
          </li>
          <li>
            <span className="font-bold">Coupon content:</span> the titles, messages and recipient names you write
            when creating coupons.
          </li>
          <li>
            <span className="font-bold">Orders:</span> what you bought, the amount, and payment status. Card details
            are entered with Paystack and are never seen or stored by us.
          </li>
          <li>
            <span className="font-bold">Redemption PINs:</span> stored only as a one-way hash, never as plain text.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we use it">
        <p>
          To run your account, deliver and redeem coupons, process payments, prevent misuse, and answer support
          requests. We do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection heading="Who we share it with">
        <p>
          Only the service providers needed to run {legal.brandName}: Paystack (payments), Supabase (database and
          sign-in) and our hosting provider. Recipients can see the coupon content you chose to send them. We may
          also disclose information where the law requires it.
        </p>
      </LegalSection>

      <LegalSection heading="Keeping it safe and how long we keep it">
        <p>
          We use reasonable technical measures to protect your information. We keep it while your account is active
          and as long as needed for legal and accounting purposes.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can ask to see, correct or delete the personal information we hold about you, or object to how we use
          it. Email{' '}
          <a href={`mailto:${legal.supportEmail}`} className="font-semibold underline">
            {legal.supportEmail}
          </a>
          . You may also complain to South Africa&apos;s Information Regulator.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>We will update the date above whenever this policy changes.</p>
      </LegalSection>
    </LegalPage>
  )
}
