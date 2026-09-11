---
target: kindness-currency app (home, create, give, about, feedback, profile)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-14T21-13-30Z
slug: rrency-app-home-create-give-about-feedback-profile
---
Method: dual-agent (A: design-review sub-agent · B: detector+browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Draft autosave/inline validation work; no per-coupon progress in the 8-card edit step, PIN submit gives no "Verifying…" state |
| 2 | Match System / Real World | 4 | Copy is consistently warm and specific throughout `ctaCopy.ts` |
| 3 | User Control and Freedom | 3 | Modals have exits; once `GiftReadyScreen` is reached there's no way back to fix a typo'd coupon |
| 4 | Consistency and Standards | 2 | `CouponSetBuilder.tsx` opens `AuthGate` unconditionally with no `isLoggedIn` check, while `FeedbackForm.tsx` branches correctly on the same auth state |
| 5 | Error Prevention | 3 | Numeric-only PIN input, disabled Continue until recipient name present |
| 6 | Recognition Rather Than Recall | 3 | Text-labeled nav, `aria-label`s on swatches |
| 7 | Flexibility and Efficiency | 1 | No bulk actions across 8 coupons, no keyboard shortcuts, no fast path for repeat/logged-in givers |
| 8 | Aesthetic and Minimalist Design | 2 | Homepage/builder are tight; `/about`, `/feedback`, `/profile` feel sparse/unfinished by contrast |
| 9 | Error Recovery | 3 | Wrong-PIN error is specific and sender-referencing; AuthGate failure copy is generic |
| 10 | Help and Documentation | 1 | No contextual help in `/create`; `/about` is marketing, not task help |
| **Total** | | **25/40** | **Acceptable (62.5%)** |

## Design Specificity Verdict

**LLM assessment**: The core artifact — the ticket-shaped `CouponCardHero` with punch-hole notches, barcode, and Playfair headline — is clearly authored for this product; nothing about it is category-interchangeable. The homepage marquee, warm sender-referencing copy, and deliberately weighted PIN-redemption friction reinforce a distinct voice. That specificity collapses on `/about`, `/feedback`, and the logged-out `/profile` state, which read as generic heading-and-paragraph pages bolted onto a much more art-directed core product.

**Deterministic scan**: `detect.mjs` returned 65 findings across `src/app` and `src/components`: 51 `design-system-font-size`, 10 `design-system-color`, 3 `design-system-radius`, 1 `codex-grid-background`. Two were verified false positives: the flagged "grid background" is the coupon's barcode stripe (an explicitly locked, required element per CLAUDE.md), and 7 of the 10 color findings are the stops of a rainbow `conic-gradient` on a native color-picker swatch, not a design-token choice. The remaining ~55 findings are real drift — the implementation's type scale and radius values have diverged from what the design system documents, concentrated in secondary/caption-level details rather than the primary brand expression (confirmed independently by the audit agent against DESIGN.md's declared 4-step type ramp and 14px-minimum radius rule).

**Browser evidence**: No console errors across `/`, `/create`, `/about`, `/feedback`, `/profile` beyond a Grammarly-extension hydration artifact (not an app bug). No 404s, no broken images, no CSP issues. `/create` and `/about` show a narrow left-aligned column with unused space to the right at desktop width — plausibly an intentional mobile-first single-column flow, but worth confirming.

## Overall Impression

The redemption artifact itself — the coupon card, the PIN flow, the copy — is genuinely well-crafted and specific to this product. The system falls apart at the seams: the newer secondary pages (`/about`, `/feedback`, `/profile`) don't carry the same design language, the returning-user flow forces everyone through AuthGate regardless of session state, and the 8-coupon edit screen turns what should feel like personalizing a gift into a repetitive data-entry chore. The single biggest opportunity is closing the gap between the polished core (homepage, builder step 1-2, redemption) and everything built around it (secondary pages, AuthGate, the give page's missing header).

## What's Working

- `CouponCardHero.module.css`'s entire ticket shape is driven by `clamp()` custom properties calibrated to the card's own width, scaling as one proportional shape with no breakpoint snapping — sophisticated, product-specific engineering that both assessments independently praised.
- `src/constants/ctaCopy.ts` as a real single source of truth for warm, sender-aware microcopy keeps the voice consistent everywhere it's used; no stray generic "Submit"/"Confirm" strings found.
- `PINVerificationModal.tsx` + `RecipientCouponList.tsx`: the redemption flow's friction (explicit irreversibility warning, wrong-PIN messaging that names the sender) is well-calibrated to the emotional stakes of the moment.

## Priority Issues

**[P0] AuthGate fires unconditionally on every Save/Send, even for logged-in users**
- Why it matters: `CouponSetBuilder.tsx` calls `onSave`/`onSend` → `setAuthOpen(true)` with no `isLoggedIn` check at all, unlike `FeedbackForm.tsx` which correctly branches on the same auth state elsewhere in this app. A returning giver finishing 8 coupons is forced through a full email/magic-link round trip at their moment of highest intent — a real abandonment risk and an internal inconsistency.
- Fix: Pass session/`isLoggedIn` into `CouponSetBuilder` (the pattern already used in `SiteHeader.tsx` and `/feedback`) and skip `AuthGate` when a session exists.
- Suggested command: `$impeccable optimize`

**[P1] No visible focus indicator anywhere in the product**
- Why it matters: Every text input (PIN modal, AuthGate, builder fields) sets `outline-none` with no replacement focus style. Keyboard-only users can't see which field is focused — including the 4-digit PIN field at the single highest-stakes moment in the product. Corroborated by the audit's dialog-semantics finding (same components have no focus trap either).
- Fix: Add a visible `:focus-visible` ring/border-color change sitewide.
- Suggested command: `$impeccable harden`

**[P1] The 8-coupon edit screen violates chunking, minimal-choices, and progressive-disclosure**
- Why it matters: `CouponSetBuilder.tsx`'s edit step renders all 8 coupons fully expanded (3 text fields + 7 color options + 4 effect buttons each ≈ 110 live controls) in one long scroll, with no collapse, no per-coupon progress, no "apply to all." Turns gift personalization into repetitive data entry. The audit agent independently confirmed several of these controls (22-26px swatches, ~21px effect pills) also fail the 44px touch-target minimum.
- Fix: Default each card to a collapsed preview + "Edit," add a "3 of 8 customized" indicator, offer bulk color/effect apply.
- Suggested command: `$impeccable layout`

**[P1] `/give/[id]` — the recipient's first-touch screen — has no header at all**
- Why it matters: Confirmed absent from `src/app/give/[id]/page.tsx`: no `SiteHeader` import. This is the highest-stakes, first-touch moment for a brand-new recipient, who lands with no logo/home link and no way to confirm what "Kindness Currency" even is before being asked to enter a PIN.
- Fix: Add at minimum the wordmark/logo link to the give page.
- Suggested command: `$impeccable onboard`

**[P2] Secondary pages feel like a different, lower-effort product**
- Why it matters: `/about`, `/feedback`, and the logged-out `/profile` state are plain heading+paragraph on cream with no accent color, ticket motif, or imagery, in sharp contrast to the marquee-driven homepage and card-rich builder.
- Fix: Extend the accent-color and Playfair headline treatment already used elsewhere into these pages.
- Suggested command: `$impeccable polish`

## Persona Red Flags

**Jordan (first-timer)**: Opens `/give/[id]` with zero brand chrome — no way to confirm what this product is before trusting a link+PIN combo from someone. The PIN modal only explains "Check your message from {sender}" reactively, after a wrong guess, not proactively before the first attempt.

**Sam (accessibility-dependent)**: `outline-none` with no replacement focus style on every input in the app means tabbing through the PIN field, builder fields, and AuthGate gives no visible focus location. `CouponCardHero.tsx`'s decorative motif div has no `aria-hidden="true"`, so a screen reader will likely announce a stray unicode glyph with no accessible name.

**Casey (mobile)**: The builder's back button (`p-1 text-xl`, ~30px hit area) is under the 44×44pt minimum, in a flow that's otherwise well-placed for thumb use (sticky bottom action bar is correctly positioned).

## Minor Observations

- `AuthGate`'s "We use bank-level encryption and will never share your details" is a vague, unverifiable trust claim that reads as generic SaaS boilerplate against an otherwise specific voice.
- `GiftReadyScreen` has no path back to edit the coupon set once saved — a typo can only be fixed by starting a new set.
- Homepage marquee applies `transform: scale(0.62)` as a second scaling mechanism layered on top of `CouponCardHero`'s own `clamp()`-based fluid sizing — worth confirming these don't compound oddly at extreme viewport widths.
- The home-page marquee auto-scrolls infinitely with no pause control and no `prefers-reduced-motion` handling anywhere in `globals.css` (WCAG 2.2.2) — full detail in the audit report below.

## Questions to Consider

- If a returning giver already has a session, why does "Send with Love" still force a full AuthGate round trip every time — what would a true one-tap send look like for repeat users?
- Should `/give/[id]` carry any brand chrome at all, or is a header-free, drop-straight-into-the-gift experience intentional for a first-time recipient?
- With 8 coupons to personalize, would this feel more like a gift and less like a chore if a giver made stylistic decisions once and applied them to the whole set, instead of 8 times over?
