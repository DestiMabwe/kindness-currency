# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two distinct roles:
- **Senders** — people who want to give a meaningful, personal gift (often across distance) but find physical gifts expensive/logistically hard and generic digital gifts impersonal. They pick a relational template (Mother's Day, Valentine's, Birthday, Lovers, Besties), personalise eight "acts of service" coupons, and send a single link.
- **Recipients** — the person receiving the gift. They must be able to open the link on any device and redeem coupons with zero friction: no app download, no account creation.

## Product Purpose

Kindness Currency turns acts-of-service promises ("I'll cook you a meal", "I owe you a night out") into a real, giftable digital object instead of a text message. It exists because there's no frictionless way to make that kind of promise feel like an actual gift. Success means a recipient receives something that feels warm and premium enough that they go on to become a sender themselves.

## Positioning

The mechanism a competitor can't casually copy: a magic link (`/give/[uuid]`, no query params) paired with a 4-digit PIN shared out-of-band by the sender (in person, via text, etc.) rather than embedded in the link. This turns PIN-sharing into part of the gifting ritual itself, and lets the recipient redeem with zero login while still requiring a deliberate, personal handoff of the "key" to the gift.

## Operating Context

- Sender flow: browse 5 templates → personalise 8 pre-written coupons (title/micro-copy/fine-print, background colour, background effect) → optional expiry date → "Save My Coupons" or "Send with Love" → Supabase email-OTP magic-link auth (only prompted at save/send time, not before) → GiftReadyScreen shows the shareable link and PIN separately, with WhatsApp/Copy Link/Web Share sharing.
- Recipient flow: open `/give/[uuid]` on any device → see all coupons in a scrollable view → tap "Redeem This ♥" → confirm via 4-digit PIN → warm success state, coupon stamped "Redeemed ♥" and moved to the bottom of the stack.
- Returning senders: a Profile page (logged-in only) lists their coupon sets with per-set redemption progress ("X of Y redeemed"). Logged-out visitors see a prompt instead.
- Site-wide: an About page explains the product in plain language; a Feedback page (works whether logged in or not) collects user feedback.

## Capabilities and Constraints

- Five v1 templates, each shipping exactly 8 pre-written default coupons, DB-driven (`templates` / `template_coupons` tables) so new templates can be added without a deploy.
- `lovers` template is age-restricted (18+ gate); the rest are not.
- PIN codes are bcrypt-hashed (10 rounds) server-side, compared via `bcrypt.compare()`, never stored or logged in plaintext, never placed in the URL.
- `CouponCardHero` is the single, locked-layout card component used everywhere a coupon renders (recipient page, sender preview, builder edit tile) — shape, barcode, "GOOD FOR ONE" label, Playfair Display title, and accent-driven border/notch colour are never user-configurable. Only title/micro-copy/fine-print, background colour, and background effect are editable.
- Mobile-first is non-negotiable: every component must work at 390px before desktop polish.
- No login/auth requirement anywhere on the recipient (`/give/[id]`) page.
- No payment infrastructure in v1 — monetisation is explicitly undecided beyond a "Made with Kindness Currency" footer watermark on the recipient page. Confirmed still true as of this writing (2026-08-11).
- Web only for v1 — no native mobile app planned (explicit out-of-scope item).
- Out of scope for v1: animated coupon reveals, scheduled delivery, watermark removal, corporate/bulk tier, custom branding, analytics dashboard, sender email notifications on redemption, sender redemption-tracking dashboard beyond the basic Profile list, non-WhatsApp/Copy-Link/Web-Share sharing, content moderation, server-side age verification, custom user-created templates.
- Stack (existing, not delegated): Next.js App Router, TypeScript strict mode, Tailwind CSS, Supabase (Postgres + Auth), Vercel deployment, Zod as the source of truth for types/mutations, `bcryptjs` for PIN hashing.

## Brand Commitments

- Name: Kindness Currency. Tagline: "Because the best gifts are promises kept."
- Voice/quality gate for every UI decision: **Warm. Playful. Intimate. Generous. Surprising.** A component that fails any one of these should be redesigned before shipping.
- Design tokens: Primary `#1A1A2E` (Deep Ink), Secondary `#C2185B` (Kindness Red), Accent `#FF8F00` (Warmth Amber), Background `#FFF8F0` (Cream), Text `#2C2C2C` (Near Black). Fonts: Playfair Display (display/coupon titles), DM Sans (all UI text).
- Approved CTA copy is a fixed registry (`src/constants/ctaCopy.ts`) — no generic labels ("Submit", "Click here", "Confirm") anywhere. Examples: "Create My Coupons", "Send with Love", "Redeem This ♥", "This has been redeemed with love", home page uses "Start free." (never "100% free, always").
- Logo: black line-art, used on Cream/white backgrounds; on the Deep Ink navbar it's shown inverted to white via CSS filter rather than a separate asset.

## Evidence on Hand

- `PRD.md` (project root) is the canonical source of truth for v1 scope, user stories, and the five templates' full seed content — durable reference, not to be duplicated here.
- `CLAUDE.md` records absolute implementation rules (no PIN in URL, no `template_type` TEXT enum, bcrypt-only PIN storage, Supabase access boundaries, module map) that any design work must respect.
- No user research, testimonials, case studies, or press exist yet — do not fabricate any.

## Product Principles

1. The recipient's first open of `/give/[id]` is the single most important moment in the product — it decides whether they ever become a sender. Treat it as a premium experience, not an afterthought.
2. Zero friction for recipients is absolute: no login, no download, no account, ever — this is a constraint, not a nice-to-have.
3. Every visual surface must earn the five-word bar (Warm, Playful, Intimate, Generous, Surprising) or be redesigned.
4. The locked `CouponCardHero` elements exist to guarantee what a sender previews is exactly what a recipient receives — never introduce a surface where these can visually diverge.
5. Grow the template and campaign-banner library through data (DB rows), not code changes — new templates and campaigns should never require a redeploy.

## Accessibility & Inclusion

No product-specific accessibility standard has been established yet beyond mobile-first responsive behaviour (390px+). Treat as an open gap, not a confirmed requirement, until the user sets one.
