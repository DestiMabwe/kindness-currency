import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createClient } from '@/lib/supabase/server'
import { CouponSetBuilder } from '@/components/builder/CouponSetBuilder'

export default async function CreatePage() {
  const repo = createTemplateRepository(createServiceClient())
  const templates = await repo.getActiveTemplatesWithCoupons()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <CouponSetBuilder templates={templates} isLoggedIn={!!user} />
}
