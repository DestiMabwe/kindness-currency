import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/adminAuth'
import { createAdminRepository } from '@/lib/adminRepository'
import { createFeatureInterestRepository } from '@/lib/featureInterestRepository'
import { createFeedbackRepository } from '@/lib/feedbackRepository'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { FeedbackFeed } from '@/components/admin/FeedbackFeed'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminPage() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!isAdminEmail(user?.email)) redirect('/')

  const supabase = createServiceClient()
  const adminRepo = createAdminRepository(supabase)
  const featureInterestRepo = createFeatureInterestRepository(supabase)
  const [popularTemplates, interestCounts, comingSoonInterest, feedbackEntries, waitlistSignups, earlyAccessSignups] =
    await Promise.all([
      adminRepo.getPopularTemplates(),
      featureInterestRepo.getInterestCounts(),
      adminRepo.getComingSoonTemplateInterest(),
      createFeedbackRepository(supabase).getAllFeedback(),
      featureInterestRepo.getAllSignups(),
      adminRepo.getEarlyAccessSignupList(),
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

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] text-[#2C2C2C] uppercase opacity-60">Feedback Submissions</h2>
          <div className="mt-3">
            <FeedbackFeed entries={feedbackEntries} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] text-[#2C2C2C] uppercase opacity-60">Custom Coupon Book — Signups</h2>
          {waitlistSignups.length === 0 ? (
            <div className="mt-3 text-[13px] text-[#2C2C2C] opacity-60">No signups yet.</div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {waitlistSignups.map((signup) => (
                <div key={`${signup.email}-${signup.createdAt}`} className="flex items-center justify-between rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
                  <a href={`mailto:${signup.email}`} className="text-[13.5px] font-semibold text-[#1A1A2E]">
                    {signup.email}
                  </a>
                  <span className="text-[11px] text-[#2C2C2C] opacity-50">{formatDate(signup.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold tracking-[0.06em] text-[#2C2C2C] uppercase opacity-60">Coming Soon — Signups</h2>
          {earlyAccessSignups.length === 0 ? (
            <div className="mt-3 text-[13px] text-[#2C2C2C] opacity-60">No signups yet.</div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {earlyAccessSignups.map((signup) => (
                <div key={`${signup.email}-${signup.templateName}-${signup.createdAt}`} className="rounded-2xl border border-[#1A1A2E]/8 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-bold text-[#1A1A2E]">{signup.name}</span>
                    <span className="text-[11px] text-[#2C2C2C] opacity-50">{formatDate(signup.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-[12px] text-[#2C2C2C] opacity-70">{signup.templateName}</div>
                  <a href={`mailto:${signup.email}`} className="mt-1.5 block text-[12.5px] font-semibold text-[#1A1A2E]">
                    {signup.email}
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
