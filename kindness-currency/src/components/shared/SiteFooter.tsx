import Link from 'next/link'
import { legal } from '@/constants/legal'

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1A1A2E]/10 bg-[#FFF8F0] px-5.5 py-6 font-sans text-[13px] text-[#2C2C2C]">
      <nav aria-label="Policies" className="flex flex-wrap gap-x-4 gap-y-1.5 font-semibold underline">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/refunds">Refund &amp; Cancellation Policy</Link>
      </nav>
      <p className="mt-3 opacity-70">
        Support:{' '}
        <a href={`mailto:${legal.supportEmail}`} className="underline">
          {legal.supportEmail}
        </a>
      </p>
      <p className="mt-1 opacity-70">
        &copy; {new Date().getFullYear()} {legal.businessName}, {legal.country}. {legal.brandName} is operated by{' '}
        {legal.businessName}.
      </p>
    </footer>
  )
}
