import Link from 'next/link'
import { SiteHeader } from '@/components/shared/SiteHeader'
import { ctaCopy } from '@/constants/ctaCopy'

export default function OurStoryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F0]">
      <SiteHeader />
      <div className="px-5.5 pt-2 pb-10">
        <h1
          className="text-[23px] leading-[1.18] font-extrabold text-[#1A1A2E] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Our Story
        </h1>
        <div className="mt-4 flex flex-col gap-3.5 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
          <p className="text-[15px] font-bold text-[#1A1A2E] opacity-100">
            It started with a thoughtful heart — and a tight budget.
          </p>
          <p>
            Like a lot of meaningful ideas, Kindness Currency began with something simple: wanting to give thoughtful,
            personal gifts to the people who matter most, without needing a big budget. There&apos;s something
            special about a gift that feels handmade — truly made from the heart.
          </p>
          <p>
            That search led to printable love-coupon templates — the kind you buy online, print at home, and
            hand-assemble into a little booklet. A Mother&apos;s Day set for Mom. A Father&apos;s Day set for Dad.
            Each one made with love.
          </p>
        </div>

        <div className="mt-6 h-px bg-[#1A1A2E]/10" />

        <div className="mt-6">
          <h2
            className="text-[18px] leading-[1.2] font-extrabold text-[#1A1A2E] italic"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            The Missing Piece
          </h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            The sentiment always landed. The paper didn&apos;t.
          </p>
          <ul className="mt-3.5 flex flex-col gap-3 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            <li>
              <span className="font-bold text-[#1A1A2E]">The Memory Hole:</span>{' '}
              Paper coupons got misplaced, tucked into drawers, and forgotten.
            </li>
            <li>
              <span className="font-bold text-[#1A1A2E]">The Confusion Factor:</span>{' '}
              Recipients weren&apos;t always sure how or when to redeem them, and life got in the way.
            </li>
            <li>
              <span className="font-bold text-[#1A1A2E]">The Footprint:</span>{' '}
              Printing booklets that might never get used didn&apos;t sit right in a world that&apos;s already
              asking too much of paper.
            </li>
          </ul>
          <p className="mt-3.5 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            It became clear that this kind of love needed a digital home — something accessible, something that
            lasts, something lighter on the planet.
          </p>
        </div>

        <div className="mt-6 h-px bg-[#1A1A2E]/10" />

        <div className="mt-6">
          <h2
            className="text-[18px] leading-[1.2] font-extrabold text-[#1A1A2E] italic"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Rethinking How We Give
          </h2>
          <div className="mt-3 flex flex-col gap-3.5 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            <p>
              As the idea took digital shape, another realization surfaced: not every gift needs to be a whole
              booklet of eight promises. Sometimes you just want to do one meaningful thing for someone, today.
            </p>
            <p>That&apos;s the shape Kindness Currency took — two simple ways to show up:</p>
          </div>
          <ul className="mt-3.5 flex flex-col gap-3 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            <li>
              <span className="font-bold text-[#1A1A2E]">One Clear Gesture:</span>{' '}
              A single, focused coupon for the moment that doesn&apos;t need eight promises — just the one you
              already know you want to give.
            </li>
            <li>
              <span className="font-bold text-[#1A1A2E]">A Full Coupon Book:</span>{' '}
              Eight coupons built around one relationship or occasion, for when you want to show up in more than one
              way.
            </li>
          </ul>
        </div>

        <div className="mt-6 h-px bg-[#1A1A2E]/10" />

        <div className="mt-6">
          <h2
            className="text-[18px] leading-[1.2] font-extrabold text-[#1A1A2E] italic"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Why We Do What We Do
          </h2>
          <div className="mt-3 flex flex-col gap-3.5 text-[14.5px] leading-relaxed text-[#2C2C2C] opacity-85">
            <p>
              Those first paper coupons may be long gone — lost in a drawer somewhere — but what they stood for
              never left.
            </p>
            <p>
              Kindness Currency was never really about coupons, or code, or features. It&apos;s about making it
              easy — genuinely easy — to say the things we mean, to the people we love, before life talks us out of
              it.
            </p>
          </div>
        </div>

        <p
          className="mt-7 text-[15px] font-bold text-[#C2185B] italic"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {ctaCopy.footerTagline}
        </p>

        <Link
          href="/create"
          className="mt-4.5 inline-block rounded-full bg-[#1A1A2E] px-[22px] py-3 font-sans text-sm font-bold text-white"
        >
          {ctaCopy.recipientConversionButton}
        </Link>
      </div>
    </div>
  )
}
