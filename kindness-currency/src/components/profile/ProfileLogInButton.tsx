import Link from 'next/link'
import { ctaCopy } from '@/constants/ctaCopy'
import { loginHref } from '@/lib/authRedirect'

/** Logged-out /profile: a direct way in, so the visitor isn't told to go hunting through the menu. */
export function ProfileLogInButton() {
  return (
    <Link
      href={loginHref('/profile', 'login')}
      className="mt-5 rounded-2xl bg-[#C2185B] px-6 py-3.5 font-sans text-[15px] font-bold text-white"
    >
      {ctaCopy.navLogIn}
    </Link>
  )
}
