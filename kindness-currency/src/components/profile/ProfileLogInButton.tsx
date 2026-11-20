'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ctaCopy } from '@/constants/ctaCopy'

// Same deferral as HeaderMenu: the Supabase auth client only loads once someone opens the form.
const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

/** Logged-out /profile: a direct way in, so the visitor isn't told to go hunting through the menu. */
export function ProfileLogInButton() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAuthOpen(true)}
        className="mt-5 rounded-2xl bg-[#C2185B] px-6 py-3.5 font-sans text-[15px] font-bold text-white"
      >
        {ctaCopy.navLogIn}
      </button>
      {authOpen && <AuthGate initialMode="login" onClose={() => setAuthOpen(false)} />}
    </>
  )
}
