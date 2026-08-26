import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/adminAuth'
import { createAdminRepository } from '@/lib/adminRepository'
import { createFeatureInterestRepository } from '@/lib/featureInterestRepository'
import { SiteHeader } from '@/components/shared/SiteHeader'

export default async function AdminPage() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!isAdminEmail(user?.email)) redirect('/')

  const supabase = createServiceClient()
  const adminRepo = createAdminRepository(supabase)
  const [popularTemplates, interestCounts, comingSoonInterest] = await Promise.all([
    adminRepo.getPopularTemplates(),
    createFeatureInterestRepository(supabase).getInterestCounts(),
    adminRepo.getComingSoonTemplateInterest(),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <div className="px-5.5 pt-2 pb-10">
        <h1 className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic" style={{ fontFamily: 'var(--font-playfair)' }}>
          Admin
        </h1>

        <section className="mt-6">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] text-[#2C2C2C] uppercase opacity-60">Popular Templates</h2>
          <div className="mt-3 flex flex-col gap-3">
            {popularTemplates.map((template) => (
              <div key={template.templateId} className="flex items-center justify-between rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
                <div className="text-[14.5px] font-bold text-[#1A1A2E]">{template.name}</div>
                <div className="text-[14.5px] font-semibold text-[#C2185B]">{template.count}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] text-[#2C2C2C] uppercase opacity-60">Custom Coupon Book Waitlist</h2>
          <div className="mt-3 flex gap-3">
            {interestCounts.map((row) => (
              <div key={row.feature} className="flex-1 rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
                <div className="text-[11px] font-semibold tracking-[0.04em] text-[#2C2C2C] uppercase opacity-60">Early-Access Signups</div>
                <div className="mt-1 text-[22px] font-extrabold text-[#1A1A2E]">{row.count}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] text-[#2C2C2C] uppercase opacity-60">Coming Soon Interest</h2>
          <div className="mt-3 flex flex-col gap-3">
            {comingSoonInterest.map((template) => (
              <div key={template.templateSlug} className="flex items-center justify-between rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
                <div className="text-[14.5px] font-bold text-[#1A1A2E]">{template.name}</div>
                <div className="text-[14.5px] font-semibold text-[#C2185B]">{template.count}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
