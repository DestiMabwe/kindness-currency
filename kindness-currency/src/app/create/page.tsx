import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createComingSoonTemplateRepository } from '@/lib/comingSoonTemplateRepository'
import { createOrderRepository, groupUnconsumedInstances } from '@/lib/orderRepository'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/adminAuth'
import { CouponSetBuilder } from '@/components/builder/CouponSetBuilder'
import { getRegion } from '@/lib/region'

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams
  const supabase = createServiceClient()
  const templateRepo = createTemplateRepository(supabase)
  const comingSoonRepo = createComingSoonTemplateRepository(supabase)

  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  const [templates, singleUseTemplates, comingSoonTemplates, region, unconsumedInstances] = await Promise.all([
    templateRepo.getActiveTemplatesWithCoupons(),
    templateRepo.getActiveSingleUseTemplates(),
    comingSoonRepo.getActiveComingSoonTemplates(),
    getRegion(),
    user ? createOrderRepository(supabase).getUnconsumedInstancesForUser(user.id) : Promise.resolve([]),
  ])

  return (
    <CouponSetBuilder
      templates={templates}
      singleUseTemplates={singleUseTemplates}
      comingSoonTemplates={comingSoonTemplates}
      isLoggedIn={!!user}
      isAdmin={isAdminEmail(user?.email)}
      userEmail={user?.email ?? null}
      region={region}
      pendingPersonalizations={groupUnconsumedInstances(unconsumedInstances)}
      initialTemplateSlug={template ?? null}
    />
  )
}
