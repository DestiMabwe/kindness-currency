import { createServiceClient } from '@/lib/supabase/service'
import { createTemplateRepository } from '@/lib/templateRepository'
import { createComingSoonTemplateRepository } from '@/lib/comingSoonTemplateRepository'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { TemplateGallery } from '@/components/templates/TemplateGallery'

export default async function TemplatesPage() {
  const supabase = createServiceClient()
  const templateRepo = createTemplateRepository(supabase)
  const comingSoonRepo = createComingSoonTemplateRepository(supabase)

  const [templates, comingSoonTemplates] = await Promise.all([
    templateRepo.getActiveTemplatesWithCoupons(),
    comingSoonRepo.getActiveComingSoonTemplates(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <TemplateGallery templates={templates} comingSoonTemplates={comingSoonTemplates} />
    </div>
  )
}
