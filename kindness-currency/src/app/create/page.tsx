import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createComingSoonTemplateRepository } from '@/lib/comingSoonTemplateRepository'
import { createClient } from '@/lib/supabase/server'
import { CouponSetBuilder } from '@/components/builder/CouponSetBuilder'
import { getRegion } from '@/lib/region'

export default async function CreatePage() {
  const supabase = createServiceClient()
  const templateRepo = createTemplateRepository(supabase)
  const comingSoonRepo = createComingSoonTemplateRepository(supabase)

  const [templates, singleUseTemplates, comingSoonTemplates, region] = await Promise.all([
    templateRepo.getActiveTemplatesWithCoupons(),
    templateRepo.getActiveSingleUseTemplates(),
    comingSoonRepo.getActiveComingSoonTemplates(),
    getRegion(),
  ])

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  return (
    <CouponSetBuilder
      templates={templates}
      singleUseTemplates={singleUseTemplates}
      comingSoonTemplates={comingSoonTemplates}
      isLoggedIn={!!user}
      userEmail={user?.email ?? null}
      region={region}
    />
  )
}
