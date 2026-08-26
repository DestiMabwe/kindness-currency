import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createComingSoonTemplateRepository } from '@/lib/comingSoonTemplateRepository'
import { createClient } from '@/lib/supabase/server'
import { CouponSetBuilder } from '@/components/builder/CouponSetBuilder'

export default async function CreatePage() {
  const supabase = createServiceClient()
  const templateRepo = createTemplateRepository(supabase)
  const comingSoonRepo = createComingSoonTemplateRepository(supabase)

  const [templates, comingSoonTemplates] = await Promise.all([
    templateRepo.getActiveTemplatesWithCoupons(),
    comingSoonRepo.getActiveComingSoonTemplates(),
  ])

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return (
    <CouponSetBuilder
      templates={templates}
      comingSoonTemplates={comingSoonTemplates}
      isLoggedIn={!!user}
      userEmail={user?.email ?? null}
    />
  )
}
