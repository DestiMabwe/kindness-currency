import { SiteHeader } from '@/components/shared/SiteHeader'
import { ctaCopy } from '@/constants/ctaCopy'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <div className="px-5.5 pt-2 pb-10">
        <h1
          className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          About Kindness Currency
        </h1>
        <div className="mt-4 flex flex-col gap-3.5 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
          <p className="text-[15px] font-bold text-[#1A1A2E] opacity-100">
            It starts with a simple thought you never quite say out loud.
          </p>
          <p>
            Maybe it’s a romantic gesture you’ve rehearsed four times in your head, only to chicken out before the
            words leave your mouth. Maybe it’s an offer to help your exhausted parents, a long-overdue adventure
            with a sibling, or a meaningful way to tell a best friend, <em className="italic">“I’m in your corner.”</em>
          </p>
          <p>
            We all have these moments — ideas for connection that get lost to bad timing, fear of awkwardness, or
            the rush of daily life. We end up giving physical objects that gather dust, while the real gift — our
            time, our attention, our care — remains unspoken.
          </p>
          <p>That is why we built Kindness Currency.</p>
        </div>

        <div className="mt-6 h-px bg-[#1A1A2E]/10" />

        <div className="mt-6">
          <h2
            className="text-[18px] leading-[1.2] font-extrabold text-[#1A1A2E] italic"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Bridging the Gap Between Ideas and Memories
          </h2>
          <div className="mt-3 flex flex-col gap-3.5 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            <p>Kindness Currency was created to bridge the space between wanting to reach out and actually making a memory.</p>
            <p>
              We designed it around a gentle truth: real intimacy and connection require courage, but they
              shouldn&apos;t require put-on-the-spot pressure. Kindness Currency allows the sender to{' '}
              <em className="italic">initiate without exposure</em>, giving you the composure to say exactly what
              you mean. In turn, it allows the recipient to <em className="italic">receive without obligation</em>,
              giving them the space to open, digest, and redeem your promise whenever they are truly ready.
            </p>
            <p>When they hit redeem, it isn&apos;t just cashing in a favor — it is their way of reaching back.</p>
          </div>
        </div>

        <div className="mt-6 h-px bg-[#1A1A2E]/10" />

        <div className="mt-6">
          <h2
            className="text-[18px] leading-[1.2] font-extrabold text-[#1A1A2E] italic"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            For Every Relationship &amp; Every Moment
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            Love and connection aren&apos;t one-size-fits-all, and Kindness Currency isn&apos;t tailored for just
            one set of users. It is built for everyone and every kind of bond:
          </p>
          <ul className="mt-3.5 flex flex-col gap-3 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            <li>
              <span className="font-bold text-[#1A1A2E]">For All Your Connections:</span> Express thoughtful care to
              romantic partners, parents, siblings, and lifelong friends.
            </li>
            <li>
              <span className="font-bold text-[#1A1A2E]">For Every Occasion:</span>{' '}
              Elevate major milestones like Valentine&apos;s Day, Christmas, and birthdays, or turn an ordinary
              Tuesday into an unforgettable gesture.
            </li>
            <li>
              <span className="font-bold text-[#1A1A2E]">Thoughtful &amp; Asynchronous:</span> Personalize eight
              meaningful coupons at your own pace. Say what matters most without fumbling live.
            </li>
            <li>
              <span className="font-bold text-[#1A1A2E]">Zero Friction:</span> Shared instantly through a simple
              private link. No apps to download, no accounts for them to create. Just pure intent.
            </li>
          </ul>
        </div>

        <p
          className="mt-7 text-[15px] font-bold text-[#C2185B] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {ctaCopy.footerTagline}
        </p>
      </div>
    </div>
  )
}
