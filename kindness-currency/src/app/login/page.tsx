import { redirect } from 'next/navigation'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { AuthGate } from '@/components/modals/AuthGate'
import { createClient } from '@/lib/supabase/server'
import { resolveLoginPage } from '@/lib/authRedirect'

type LoginSearchParams = { next?: string; mode?: string; authError?: string }

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const { next, mode, authError } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const plan = resolveLoginPage({ loggedIn: !!user, next, mode, authError })
  if (plan.kind === 'redirect') redirect(plan.to)

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[420px] flex-1 px-4 pt-4 pb-10">
        <AuthGate next={plan.next} initialMode={plan.initialMode} authFailed={plan.authFailed} />
      </main>
    </div>
  )
}
