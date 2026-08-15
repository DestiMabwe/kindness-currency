# Kindness Currency — Evaluation & Action Plan

Generated 2026-08-14 via `$impeccable critique` + `$impeccable audit` (dual-agent design review + detector/browser evidence + technical audit, 3 isolated sub-agents). Full reports archived at `.impeccable/critique/2026-08-14T21-13-30Z__rrency-app-home-create-give-about-feedback-profile.md` (critique only — this file is the combined, actionable version).

**Scores**: Design Health 25/40 (Acceptable) · Audit Health 11/20 (Acceptable)

Agreed priority: **Redemption + a11y core first**, then the 8-coupon edit screen, then secondary-page polish.

---

## Action checklist

### 1. `$impeccable optimize` — AuthGate bug (P0, confirmed bug not intentional) ✅ done 2026-08-15
- [x] `CouponSetBuilder.tsx`: pass `isLoggedIn`/session into the component and skip `AuthGate` on Save/Send when a session already exists (mirror the branching `FeedbackForm.tsx` already does correctly)

### 2. `$impeccable harden` — redemption + accessibility core (P1) ✅ done 2026-08-15
- [x] Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, and Escape-to-close to `PINVerificationModal.tsx`, `AgeGate.tsx`, `AuthGate.tsx`, and `HeaderMenu.tsx`'s nav drawer — via new shared `src/hooks/useDialogA11y.ts`
- [x] Add a visible `:focus-visible` style sitewide (every input currently sets `outline-none` with no replacement) — global rule in `globals.css`
- [x] Fix opacity-driven text contrast — raised opacity on `.eyebrow`/`.finePrint` in `CouponCardHero.module.css`, `GiftReadyScreen.tsx`'s "Shareable link" label, footer in `page.tsx`, `give/[id]/page.tsx` footer credit
- [x] Fix heading hierarchy: real `<h1>` on `/about`, `/feedback`, `/profile`, `/give/[id]`, the homepage headline, and the 3 builder-flow screen headings; demoted `CouponCardHero`'s title to `<h2>`; `aria-hidden="true"` on the duplicated marquee strip and the `CouponCardHero` decorative motif div
- [x] Add `role="alert"` to inline form-error containers (`AuthGate.tsx`, `PINVerificationModal.tsx`, `FeedbackForm.tsx`)

### 3. `$impeccable onboard` — give/[id] first-touch (P1) ✅ done 2026-08-15
- [x] Add `SiteHeader` (or at minimum the wordmark/logo link) to `src/app/give/[id]/page.tsx` — currently the only route with zero brand chrome

### 4. `$impeccable adapt` — touch targets (P1/P2) ✅ done 2026-08-15
- [x] Enlarge color swatches, custom-color picker, effect pills in `CouponSetBuilder.tsx` — 44px tap zones, visible dots/pills kept same size, centered
- [x] Enlarge `HeaderMenu` hamburger (36→44px) and drawer close button (44px tap zone)

### 5. `$impeccable animate` — motion safety (P1) ✅ done 2026-08-15
- [x] Wrap `kc-marquee` and `kc-hero-wash` in `globals.css` with `@media (prefers-reduced-motion: no-preference)` — both animations now gated, static fallback frame otherwise

### 6. `$impeccable layout` — 8-coupon edit screen (P1, phase 2) ✅ done 2026-08-15
- [x] Default each `CouponEditorCard` to collapsed (title + swatch dot + status), expand-on-click for the full fields/preview; "N of 8 customized" progress indicator in the sticky header; new "Style all 8 the same" bulk color/effect row (`patchAllCoupons` in the hook) instead of repeating ~14 controls × 8 cards

### 7. `$impeccable polish` — secondary pages + drift cleanup (P2, phase 3) ✅ done 2026-08-15
- [x] Extend accent-color/Playfair treatment to `/about` (kindness-red closing tagline, now via `ctaCopy.footerTagline` instead of a duplicated hardcoded string) — `/feedback` and `/profile` already carry accent color via their own CTA button / redeemed-count text
- [x] Reconciled the 2 headings DESIGN.md names explicitly ("About Kindness Currency", "Your Coupons") to exact Title-scale (23px/1.18); for the remaining ~53 sites, updated DESIGN.md with an honest "Scale Coverage" note instead of blind mass-resizing — flagged `$impeccable typeset` as the dedicated follow-up for a real scale consolidation
- [x] Bumped 2 of the 3 radius findings to 14px (`decorativeImage`, `redeemedStamp`); documented the 3rd (7px confetti square) as an explicit DESIGN.md exception — forcing 14px there would erase the intentional square/dot confetti variety
- [x] Folded `#D4658A` and `#6b6b6b` into DESIGN.md's palette as named tokens (`confetti-rose`, `stub-label-gray`)
- [x] Replaced 3 of 4 `<img>` tags with `next/image` (`page.tsx`, `CouponSetBuilder.tsx`, `SiteHeader.tsx`); deliberately left `CouponCardHero.tsx`'s decorative image as-is — it's absolutely-positioned via the card's praised `clamp()`-driven sizing system, and a `fill`-mode refactor risked regressing the single most-praised piece of engineering in the app for a P3 lint nicety
- [x] Added a "Spot a typo? Start a new coupon set →" link on `GiftReadyScreen` (new `startNewSet` in the hook, resets the builder) — a real escape hatch, not full post-save editing (that would need fetch-and-update against the saved DB record, out of scope)

---

## Reference — what's already good (don't touch)
- `redemptionEngine.ts`: `bcrypt.compare()`, idempotent, optimistic-concurrency guard — matches CLAUDE.md's security rules exactly
- `CouponCardHero.module.css`: `clamp()`-driven fluid ticket scaling, no breakpoint snapping
- `ctaCopy.ts` as genuine single source of truth for copy
- `codex-grid-background` finding at `CouponCardHero.module.css:125` is a **false positive** — that's the locked barcode graphic, not decorative slop. Do not "fix" it.
- 7 of the 10 `design-system-color` findings on `CouponSetBuilder.tsx:499` are a native color-picker's rainbow gradient stops, not a token violation. Do not "fix" them.

## Full source reports
- Design critique: `.impeccable/critique/2026-08-14T21-13-30Z__rrency-app-home-create-give-about-feedback-profile.md`
- Technical audit: not separately persisted by the skill — see this file's checklist above for the actionable items, or ask me to re-run `$impeccable audit` for a fresh full report.
