import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/adminAuth'
import { HeaderMenu } from '@/components/shared/HeaderMenu'

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex items-center justify-between px-4.5 pt-3.5 pb-3">
      <Link href="/" aria-label="Kindness Currency home" className="flex items-center gap-2">
        <Image src="/logo.png" alt="" width={359} height={257} priority className="h-9 w-auto" />
        <span className="font-sans text-lg font-extrabold text-[#1A1A2E]">Kindness Currency</span>
      </Link>
      <HeaderMenu isLoggedIn={!!user} isAdmin={isAdminEmail(user?.email)} />
    </div>
  )
}
