import { SiteHeader } from '@/components/shared/SiteHeader'
import { FeedbackForm } from '@/components/feedback/FeedbackForm'
import { createClient } from '@/lib/supabase/server'
import { ctaCopy } from '@/constants/ctaCopy'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <div className="px-5.5 pt-2 pb-10">
        <h1
          className="text-[28px] leading-[1.1] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {ctaCopy.feedbackHeading}
        </h1>
        <div className="mt-2.5 text-[14px] leading-relaxed text-[#2C2C2C] opacity-72">{ctaCopy.feedbackSubtext}</div>
        <FeedbackForm isLoggedIn={!!user} />
      </div>
    </div>
  )
}
