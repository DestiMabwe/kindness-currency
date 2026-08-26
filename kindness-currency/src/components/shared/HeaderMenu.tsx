'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ctaCopy } from '@/constants/ctaCopy'
import { useDialogA11y } from '@/hooks/useDialogA11y'

// Deferred: the Supabase auth client (~250KB) has no reason to load until someone
// actually opens the login form or signs out — neither happens on most page visits,
// including the recipient's `/give/[id]` page, which has zero auth requirement of its own.
const AuthGate = dynamic(() => import('@/components/modals/AuthGate').then((m) => m.AuthGate), { ssr: false })

export type HeaderMenuProps = {
  isLoggedIn: boolean
  isAdmin?: boolean
}

const linkClasses = 'rounded-xl px-3 py-3 font-sans text-[15px] font-semibold text-[#1A1A2E]'

export function HeaderMenu({ isLoggedIn, isAdmin = false }: HeaderMenuProps) {
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const router = useRouter()
  const drawerRef = useDialogA11y<HTMLDivElement>(open, () => setOpen(false))

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-11 w-11 flex-col items-center justify-center gap-1.25 rounded-full border border-[#1A1A2E]/18"
      >
        <span className="h-[1.5px] w-4 rounded-full bg-[#1A1A2E]" />
        <span className="h-[1.5px] w-4 rounded-full bg-[#1A1A2E]" />
        <span className="h-[1.5px] w-4 rounded-full bg-[#1A1A2E]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex justify-end bg-[#1A1A2E]/45 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="flex h-full w-[78%] max-w-[300px] flex-col bg-[#FFF8F0] px-6 pt-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center self-end text-[22px] leading-none text-[#1A1A2E]"
            >
              ×
            </button>
            <nav className="mt-6 flex flex-col gap-1">
              <Link href="/create" onClick={() => setOpen(false)} className={linkClasses}>
                {ctaCopy.navCreate}
              </Link>
              <Link href="/about" onClick={() => setOpen(false)} className={linkClasses}>
                {ctaCopy.navAboutUs}
              </Link>
              <Link href="/profile" onClick={() => setOpen(false)} className={linkClasses}>
                {ctaCopy.navProfile}
              </Link>
              <Link href="/feedback" onClick={() => setOpen(false)} className={linkClasses}>
                {ctaCopy.navFeedback}
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)} className={linkClasses}>
                  {ctaCopy.navAdmin}
                </Link>
              )}
              {isLoggedIn ? (
                <button type="button" onClick={handleSignOut} className={`mt-2 text-left ${linkClasses} text-[#C2185B]`}>
                  {ctaCopy.navLogOut}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className={`mt-2 text-left ${linkClasses} text-[#C2185B]`}
                >
                  {ctaCopy.navLogIn}
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {authOpen && (
        <AuthGate
          initialMode="login"
          onClose={() => {
            setAuthOpen(false)
            setOpen(false)
          }}
        />
      )}
    </>
  )
}
