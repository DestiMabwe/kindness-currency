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
    <div className="flex flex-1 flex-col bg-[#FFF8F0]">
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

        <section className="mt-10 border-t border-[#1A1A2E]/10 pt-6">
          <h2
            className="text-[22px] leading-[1.1] font-bold text-[#1A1A2E]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {ctaCopy.faqHeading}
          </h2>
          <div className="mt-3 flex flex-col">
            {ctaCopy.faqItems.map((item) => (
              <details key={item.question} className="group border-b border-[#1A1A2E]/10 py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14.5px] font-semibold text-[#1A1A2E] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span aria-hidden="true" className="text-[18px] leading-none text-[#C2185B] group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#2C2C2C] opacity-78">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
