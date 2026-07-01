import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { CouponSetBuilder } from '@/components/builder/CouponSetBuilder'

export default async function CreatePage() {
  const repo = createTemplateRepository(createServiceClient())
  const templates = await repo.getActiveTemplatesWithCoupons()

  return <CouponSetBuilder templates={templates} />
}
