# PRD — Kindness Currency v1.0
*Synthesized from Kindness_Currency_Master_Brief.txt + Kindness_Currency_Brief_Amendments_v1.md*
*Amendments take priority over the original brief where conflicts exist.*
*Date: 2026-05-24*

---

## Problem Statement

Digital gifts feel impersonal and disposable. Physical gifts are expensive, cluttered, and logistically difficult to give across distances. People who want to give meaningful, personal gifts — especially acts of service — have no good tool for doing so. There is no frictionless way to say "I will cook you a meal" or "I owe you a night out" in a format that feels like a real gift rather than a text message.

Recipients bear the worst of this: most gift platforms require them to download an app, create an account, or navigate a clunky interface just to receive something sent with love.

---

## Solution

Kindness Currency is a web app that lets users create sets of "Acts of Service" coupons — digital promises — and send them to a recipient via a single magic link. The recipient opens the link on any device, no download or account required, and can redeem individual coupons when they're ready to call in the promise.

The product is built around five seasonal/relational templates: Mother's Day, Valentine's, Birthday, Lovers, and Besties. Each template ships with eight default coupons that users can personalise before sending.

Security is handled by a 4-digit PIN that the sender shares with the recipient separately — not in the URL — making the PIN a natural part of the gift ritual ("I'll send you the link, tell you the PIN in person").

---

## User Stories

### Sender — Creation Flow

1. As a sender, I want to browse five gift templates on the creation page, so that I can pick the one that fits my recipient and occasion.
2. As a sender, I want to see a visual preview of each template's style before selecting it, so that I know what the finished gift will look like.
3. As a sender selecting the Lover's Intimate Promises template, I want a clear age confirmation modal to appear, so that I can acknowledge the adult content before proceeding.
4. As a sender, I want to enter my name and my recipient's name before editing coupons, so that the gift feels personal from the start.
5. As a sender, I want to optionally set an expiry date for the coupon set, so that I can create time-limited gifts.
6. As a sender, I want to see all eight default coupons for my chosen template pre-filled with warm, thoughtful copy, so that I can send the gift without writing anything if I choose.
7. As a sender, I want to edit the service title, micro-copy, and fine print on each coupon, so that I can make the gift specific to my relationship.
8. As a sender, I want to choose a font per coupon (Playfair Display or DM Sans), so that I can adjust the tone of each promise.
9. As a sender, I want to change the background colour of individual coupon cards using a colour wheel, so that I can personalise the visual feel.
10. As a sender, I want to apply a background effect (None, Confetti, Sparkle, Soft Glow) to coupon cards, so that I can add extra delight.
11. As a sender, I want the coupon shape, border, scalloped edge, and barcode graphic to remain fixed regardless of my changes, so that every set looks premium and consistent.
12. As a sender, I want to preview all eight coupons in a full-screen view before saving, so that I can check how the gift looks before sending.
13. As a sender, I want to save a draft without logging in, so that I can come back and finish later without friction.
14. As a sender, I want to trigger the save/send flow with either "Save My Coupons" or "Send with Love", so that both paths feel intentional.
15. As a sender, I want an auth modal to appear only when I'm ready to save or send — not before — so that I can explore the product before committing.
16. As a sender, I want to verify my identity via a Supabase Email OTP magic link (no password), so that signup is as frictionless as possible.
17. As a sender, after verifying my email, I want to land on a "Your gift is ready" screen that shows me the shareable link and the 4-digit PIN separately, so that I know to share them through different channels.
18. As a sender, I want the "Your gift is ready" screen to prompt me to "Send the PIN separately — or whisper it in person", so that I understand the PIN is not in the link.
19. As a sender, I want one-tap sharing via WhatsApp as the primary option, with "Copy Link" and Web Share API as alternatives, so that sending is instant.
20. As a sender, I want the PIN to be a randomly generated 4-digit code created at save time, so that I don't have to set it myself.

### Recipient — Redemption Flow

21. As a recipient, I want to open the magic link on my phone without downloading anything or creating an account, so that receiving the gift has zero friction.
22. As a recipient, I want to see a personal greeting ("For [My Name], with love from [Sender Name]") when I open the link, so that the gift feels warm and addressed to me.
23. As a recipient, I want to see all eight coupons in a beautiful scrollable view on my phone, so that I can browse what's been given to me.
24. As a recipient, I want each coupon to display the act-of-service title, micro-copy, and fine print clearly, so that I know exactly what's been promised.
25. As a recipient, I want to tap "Redeem This ♥" on any individual coupon when I'm ready to use it, so that I can redeem at my own pace.
26. As a recipient, I want a warm confirmation modal to ask "Are you sure you want to redeem this right now? This cannot be undone", so that I don't redeem by accident.
27. As a recipient, I want the confirmation modal to ask for my 4-digit PIN, so that I can verify my identity without logging in.
28. As a recipient, if I enter the wrong PIN, I want a soft, warm error message referencing the sender's name, so that I know where to find the correct PIN without feeling like I've done something wrong.
29. As a recipient, after successful redemption, I want a "Redeemed ♥" stamp to appear over the coupon, so that I know it's been used.
30. As a recipient, I want redeemed coupons to move to the bottom of the stack, so that my remaining coupons stay prominent.
31. As a recipient, I want a warm thank-you message ("This has been redeemed with love") to appear after redemption, so that the experience ends on a high.
32. As a recipient, I want to see a non-intrusive CTA at the bottom of the page ("Loved this gift? Create your own — it's free."), so that I can become a creator without being pushed.

### Templates & Content

33. As a user, I want the five templates — Mom's Promise Tokens, Valentine's Love Passes, Birthday Joy Tokens, Lover's Intimate Promises, Bestie's Surprise Passes — to be available at launch, so that there's a template for every major relationship.
34. As a user, I want each template to ship with eight pre-written, emotionally resonant coupons, so that the product is useful with zero effort.
35. As a product owner, I want to add new templates by inserting database rows without redeploying the application, so that the template library can grow without engineering overhead.

### Home Page

36. As a visitor, I want to see a competition banner above the navbar advertising the Mother's Day prize, so that I'm immediately aware of the launch promotion.
37. As a visitor, I want to see an animated hero section where coupons from all five templates float and cycle, so that I immediately understand what the product does and feel the premium quality.
38. As a visitor, I want to see a "Trending Templates" section with hover previews of all five templates, so that I can choose the right one before clicking Create.
39. As a visitor, I want the hero CTA "Create My Coupons" to take me directly to /create, so that the path from interest to creation is one click.
40. As a returning user, I want a "Log In" button in the navbar, so that I can access my saved coupon sets.

---

## Implementation Decisions

### Module 1 — TemplateRepository
Fetches active templates and their default coupons from the `templates` and `template_coupons` database tables. Exposes a simple interface: `getActiveTemplates()` and `getTemplateWithCoupons(slug)`. This replaces the hardcoded Zod enum from the original brief. Templates are seeded via a migration file on first deploy.

**Schema (amended — supersedes original brief):**
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  theme TEXT,
  color_mood TEXT,
  decorative_element TEXT,
  emotional_tone TEXT,
  is_age_restricted BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE template_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  service_title TEXT NOT NULL,
  micro_copy TEXT,
  fine_print TEXT
);
```

**Updated coupon_sets schema:**
- `template_type TEXT` is removed
- `template_id UUID REFERENCES templates(id)` is added

### Module 2 — CouponCard & CouponCardHero
Two locked-layout coupon card components, both rendering beautifully at 390px+ and both handling the "Redeemed ♥" stamp overlay state.

- `CouponCard` (compact) is used only in the builder's per-coupon edit tile, next to the live input fields.
- `CouponCardHero` is used on the recipient's gift page and the sender's full-screen "preview all coupons" screen — the two places the coupon is actually being looked at/admired as a finished gift. Its visual spec (below) supersedes the single-card description this section originally had, following a design pass against a concrete HTML/CSS mockup.

**CouponCardHero — LOCKED, never exposed to user control:**
- Ticket/coupon shape: rounded outer frame with punch-hole circle notches at the perforation (replaces the scalloped/torn clip-path used by the compact `CouponCard`)
- Barcode graphic and dashed perforation line on the **left** side (visual only, not functional)
- "GOOD FOR ONE" framing label above every coupon title (hardcoded)
- Playfair Display Bold for the act-of-service title (no font-choice toggle on this card)
- Border and punch-hole notch color both driven by the template's `accent` color (per-template, not one fixed red) — the notch color always matches the card's own border, so no `punchColor` prop is needed
- Cream (#FFF8F0) default card background
- Template-specific decorative photo, one per template (`public/images/<slug>.png`, all 5 templates have one), positioned bottom-right — falls back to the legacy unicode motif (❀, ❦, ✺, ☾, ✦) as a translucent watermark for any template without a photo asset

**CouponCardHero — EDITABLE, user-controlled props:**
- `serviceTitle`, `microCopy`, `finePrint` — same meaning as the compact card
- `backgroundColor` — hex from colour wheel (replaces card background only, not page)
- `backgroundEffect` — `'none' | 'confetti' | 'sparkle' | 'soft-glow'`
- `status` — `'sent' | 'viewed' | 'redeemed'` (drives stamp overlay)
- `expiresAt` — optional; the barcode stub shows the real formatted expiry date when set, otherwise "NO EXPIRY DATE"

**CouponCard (compact) — unchanged:**
- Keeps its original locked spec (scalloped/torn clip-path, barcode-right, `accent`-colored border, `punchColor` prop for the punch-hole notches, unicode motif) and its `fontChoice` (`'playfair' | 'dm-sans'`) toggle for the title.

### Module 3 — CouponSetBuilder (client state)
Manages the in-progress creation state: selected template, sender/recipient names, expiry date, and the array of eight coupon content objects being edited. Persists to localStorage for Save Draft. Feeds into the save mutation when the user authenticates.

### Module 4 — PINVerificationModal
Handles the redemption confirmation flow on the recipient page. Shows a warm confirmation prompt, accepts a 4-digit PIN input, calls the verification API, and returns success or a soft error. This module is purely UI/behaviour — it does not know about Supabase directly; it receives a `onVerify(pin: string) => Promise<boolean>` callback.

**PIN is never in the URL.** The URL is always `kindnesscurrency.app/give/[uuid]` with no query parameters. The PIN is stored as `pin_code` in `coupon_sets` and compared server-side.

### Module 5 — RedemptionEngine
Server action or API route that: validates the PIN against the coupon set, marks the individual coupon as `redeemed`, records `redeemed_at`, and returns the updated coupon state. Wrapped in Zod validation. The `coupons.status` enum remains `'sent' | 'viewed' | 'redeemed'`.

### Module 6 — AuthGate
Renders the "Almost there — save your coupons" modal. Collects Full Name + Email, triggers Supabase Email OTP, and on verification calls the save mutation with the pending CouponSetBuilder state. Only mounts when the user clicks "Save My Coupons" or "Send with Love".

### Module 7 — AgeGate
A React modal that fires when a user selects any template where `is_age_restricted = true`. Blocks template selection until the user confirms they are 18+. "Go Back" dismisses the modal without selecting the template. This is local React state only — no server-side age verification.

### Module 8 — GiftReadyScreen
Post-save screen shown to the sender. Displays:
- The shareable magic link (no PIN in the URL)
- The 4-digit PIN in a prominent, copyable format
- Instruction copy: "Share the link via WhatsApp. Send the PIN separately — or whisper it in person."
- WhatsApp share button (link only, not PIN)
- Copy Link button
- Web Share API fallback

### Canonical Seed Data
These are the authoritative default coupons for all five v1 templates. The seed migration must insert them exactly as specified. Any future template additions follow the same structure.

**Template: `mothers_day` — "Mom's Promise Tokens"**
Theme: Promise | Decorative element: Flower or ribbon motif | Age restricted: false

| # | service_title | micro_copy | fine_print |
|---|--------------|------------|------------|
| 1 | One Home-Cooked Meal | Made with extra love, just the way you like it | No expiry · Redeemable anytime |
| 2 | One Errand Run | Give me the list. I'll handle everything | No questions asked |
| 3 | One Full Day Together | Your plans, your pace, your person | Phone goes away. You have my full attention |
| 4 | One Grocery Shop | Your favourites, plus a little extra | Just send me the list |
| 5 | One Bedside Visit | Soup, company, and zero judgment | Redeemable when you're under the weather |
| 6 | One Long Phone Call | No rushing. Just us talking | Anytime you need it |
| 7 | One Surprise Treat | Something sweet, just because | No occasion needed |
| 8 | One Anything You Need | Whatever it is — I'm already saying yes | Wildcard · No limits |

**Template: `valentines` — "Valentine's Love Passes"**
Theme: Pass | Decorative element: Rose or sparkle motif | Age restricted: false

| # | service_title | micro_copy | fine_print |
|---|--------------|------------|------------|
| 1 | One Romantic Dinner In | Candles, your favourite meal, no interruptions | Redeemable any evening · Chef's kiss guaranteed |
| 2 | One Breakfast in Bed | Stay right there. I've got this | Weekend redemption preferred |
| 3 | One Massage | Full focus. No distractions. Just you | Duration negotiable |
| 4 | One Night, Your Choice | Movie, drive, dancing — you pick, I show up | No vetoes allowed |
| 5 | One Love Letter | Handwritten. From the heart. No edits | Delivered whenever you redeem |
| 6 | One Chore-Free Day | Rest. I'll handle everything today | Valid any day you need a break |
| 7 | One Surprise Date | Just show up. I'll do the rest | Dress code: whatever makes you feel good |
| 8 | One Wild Card | Anything, anywhere, anytime | No questions asked · No limits |

**Template: `birthday` — "Birthday Joy Tokens"**
Theme: Token | Decorative element: Balloon or confetti motif | Age restricted: false

| # | service_title | micro_copy | fine_print |
|---|--------------|------------|------------|
| 1 | One Birthday Meal, Your Choice | Restaurant, takeout, or homemade — your call | Valid all birthday month |
| 2 | One Cake of Your Choice | Ordered, baked, or bought — however you want it | Candles included |
| 3 | One Fun Day Out | Pick the vibe. I'll plan the rest | No budget complaints |
| 4 | One Sleep-In Morning | I'll handle the noise. You stay in bed | Redeemable any weekend |
| 5 | One Playlist Made for You | Every song chosen with you in mind | Delivered within 24 hours of redemption |
| 6 | One Rant Session | Talk. I'll listen. No advice unless you ask | Unlimited time · Full attention |
| 7 | One Guilt-Free Treat | Order the expensive one. No comments from me | One-time use · Fully valid |
| 8 | One Birthday Wish Granted | Whatever you want. Today it's yes | Wildcard · Birthday rules apply |

**Template: `lovers` — "Lover's Intimate Promises"**
Theme: Promise | Decorative element: Candle or moon motif | Age restricted: **true**

| # | service_title | micro_copy | fine_print |
|---|--------------|------------|------------|
| 1 | One Night With No Phones | Just us. The screens can wait | Full evening · No exceptions |
| 2 | One Long Bath Together | Candles, music, no rushing | Redeemable any evening |
| 3 | One Morning We Don't Leave Bed | Nowhere to be. Nothing to do | Weekend use only |
| 4 | One Dance in the Kitchen | No music required. Just us | Redeemable anytime, without warning |
| 5 | One Honest Conversation | No guards. No defensiveness. Just truth | Safe space guaranteed |
| 6 | One Night You Plan Everything | I'll just say yes to whatever you decide | Full surrender of the evening |
| 7 | One Love Language Act | However you feel most loved — I'm doing that | You define it. I deliver it |
| 8 | One Anything After Midnight | You know what this means | Wildcard · No elaboration needed |

**Template: `besties` — "Bestie's Surprise Passes"**
Theme: Pass | Decorative element: Star or lightning bolt motif | Age restricted: false

| # | service_title | micro_copy | fine_print |
|---|--------------|------------|------------|
| 1 | One Emergency Vent Call | Drop everything. I'm already listening | Available 24/7 · No judgment ever |
| 2 | One Unplanned Adventure | Say yes first. Ask questions never | Destination decided on the day |
| 3 | One Ugly Cry Session | Tissues provided. Mascara optional | Full duration · Snacks included |
| 4 | One Honest Opinion | The real answer. Not the nice one | You asked. I delivered |
| 5 | One Hype Session | I will remind you how incredible you are | Redeemable before any big moment |
| 6 | One Night In Together | Snacks, bad TV, no plans, no effort | Comfy clothes mandatory |
| 7 | One Errand Buddy | I'll come. I'll complain. I'll make it fun | Available weekends · Complaints are affectionate |
| 8 | One Wildcard Favour | Whatever you need. No explanation required | Best friend card · Always valid |
Post-save screen shown to the sender. Displays:
- The shareable magic link (no PIN in the URL)
- The 4-digit PIN in a prominent, copyable format
- Instruction copy: "Share the link via WhatsApp. Send the PIN separately — or whisper it in person."
- WhatsApp share button (link only, not PIN)
- Copy Link button
- Web Share API fallback

### Zod Validation
`/src/schemas/couponSchema.ts` is retained but updated:
- Remove `template_type` enum
- Add `template_id` UUID validation
- `coupon_sets.status`: `'draft' | 'sent' | 'viewed'`
- `coupons.status`: `'sent' | 'viewed' | 'redeemed'`
All mutations parse through this schema before hitting Supabase.

### Design System Tokens (Tailwind config)
```
primary:    #1A1A2E  (Deep Ink)
secondary:  #C2185B  (Kindness Red)
accent:     #FF8F00  (Warmth Amber)
background: #FFF8F0  (Cream)
text:       #2C2C2C  (Near Black)
```
Fonts: Playfair Display (display/coupon titles) + DM Sans (all UI text).

### CTA Copy Registry
Every user-facing button and prompt in the app must use this copy exactly. No generic labels ("Submit", "Click here", "Confirm") anywhere.

| Context | Copy |
|---------|------|
| Hero CTA | "Create My Coupons" |
| Primary send action | "Send with Love" |
| Save action | "Save My Coupons" |
| Preview action | "Preview All Coupons" |
| Auth modal heading | "Almost there — save your coupons" |
| Auth modal subtext | "Your information is safe with us. We use bank-level encryption and will never share your details." |
| Recipient redeem button | "Redeem This ♥" |
| Post-redemption state | "This has been redeemed with love" |
| Recipient conversion CTA | "Loved this gift? Create your own — it's free." |
| Recipient conversion button | "Create My Coupons →" |
| Age gate confirm | "I'm 18+, Continue →" |
| Age gate dismiss | "Go Back" |
| PIN wrong error | "That PIN doesn't match. Check your message from [Sender Name]." |
| Gift ready PIN instruction | "Share the link via WhatsApp. Send the PIN separately — or whisper it in person." |
| Templates subheading | "Customize the perfect coupons. Start free." |
| Footer tagline | "Because the best gifts are promises kept." |

### Campaign Banner
A reusable full-width banner slot above the navbar. Driven by a `campaign_banners` database table so new campaigns can be activated without a code deploy.

**Schema:**
```sql
CREATE TABLE campaign_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Display rules:**
- Only one banner is shown at a time: the active row where `is_active = true` and current time is between `starts_at` and `ends_at`
- Background: Kindness Red (#C2185B), white DM Sans Medium text, centered, full width
- Not dismissible by the user
- If no active banner exists, the slot renders nothing (no empty space)

**v1 seed row:**
- Message: "Stand a chance to win a cash prize by using the Mom's Promise Tokens before May 30th 🎉"
- `starts_at`: 2026-05-24, `ends_at`: 2026-05-30, `is_active`: true

### Monetisation Watermark
Phase 1 only: a "Made with Kindness Currency" watermark in the footer of /give/[id]. No payment infrastructure in v1. Home page copy uses "Start free." not "100% free, always."

---

## Testing Decisions

**What makes a good test here:**
Test external behaviour, not implementation. A good test asks "does the user see the right thing / does the right state change happen?" not "did this internal function get called?"

**Modules to test:**

- **RedemptionEngine** — unit test the PIN comparison, status transition, and Zod validation. Test: correct PIN redeems; wrong PIN returns error; already-redeemed coupon is idempotent.
- **CouponCard** — component test that locked visual elements (shape class, barcode, border colour) are always present regardless of props passed. Test that the "Redeemed ♥" stamp renders when `status === 'redeemed'`.
- **PINVerificationModal** — component test: modal renders on "Redeem This ♥" click; soft error message appears on wrong PIN; success callback fires on correct PIN.
- **AgeGate** — component test: modal fires for `is_age_restricted: true` templates; template is not selected if user clicks "Go Back"; template is selected after "I'm 18+, Continue".
- **CouponSetBuilder state** — unit test the draft persistence to localStorage and rehydration on page reload.

**Not worth testing:**
- Supabase auth flow (covered by Supabase's own tests)
- Static page rendering of the home page
- Tailwind class names or colour values

---

## Out of Scope

- Phase 2 features: animated coupon reveals, scheduled delivery, watermark removal
- Phase 3 features: corporate tier, bulk creation, custom branding, analytics dashboard
- Email notifications to senders when a coupon is redeemed
- A sender dashboard to track redemption status
- Any auth or login requirement on the /give/[id] recipient page
- Native mobile app
- Coupon sharing mechanisms other than WhatsApp / Copy Link / Web Share API
- Content moderation or server-side age verification
- Custom template creation by users

---

## Further Notes

- **Build order from the brief is correct and should be followed:** Schema setup → /give/[id] recipient page → Mom's Promise Tokens template UI → /create page → Home page → Remaining 4 templates.
- **Mobile-first is non-negotiable.** Every component must look perfect at 390px before desktop polish is applied.
- **The /give/[id] page is the product's most important moment.** A recipient's first impression determines whether they become a creator. Treat it as a premium experience.
- **"Warm. Playful. Intimate. Generous. Surprising."** Apply these five words as a quality gate to every UI decision. If a component fails any one of them, redesign it before moving on.
- **The campaign banner** is DB-driven via the `campaign_banners` table. The v1 row expires 2026-05-30. To run future campaigns, insert a new row — no code change needed.
- **Domain:** `kindnesscurrency.app` is the target domain. Development will run on a Vercel preview URL. Ensure all magic link URLs are environment-aware.
