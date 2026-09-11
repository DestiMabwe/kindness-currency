---
target: AuthGate.tsx login/signup modal
total_score: 18
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 3
timestamp: 2026-09-11T01-09-33Z
slug: ndness-currency-src-components-modals-authgate-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Submit only dims to 60% opacity while the OTP request is in flight — no "Sending…" text or spinner, so a slow/rate-limited request reads as a dead button. |
| 2 | Match System / Real World | 2/4 | "We use bank-level encryption and will never share your details" is stock fintech boilerplate directly under the well-voiced Playfair heading — a tonal break in an otherwise warm, gift-specific modal. |
| 3 | User Control and Freedom | 3/4 | Escape, focus-trap, and focus-return-to-trigger are all confirmed working correctly via real keyboard input — but once a sender hits the generic error message there's no path out except blind retry. |
| 4 | Consistency and Standards | 2/4 | Two real token deviations (12px input radius vs. the system's 14px minimum; 60% disabled-button opacity vs. the documented 50%) plus a second tabbed-UI pattern (Sign Up/Log In pills) where DESIGN.md documents tabs as exclusive to Profile's Sent/Received view — a real precedent violation, not just decoration. |
| 5 | Error Prevention | 1/4 | No client-side email-format check; "notanemail" round-trips to Supabase and comes back as a generic failure instead of being caught instantly. |
| 6 | Recognition Rather Than Recall | 3/4 | Clear placeholders/labels throughout; nothing asks the sender to remember prior state. |
| 7 | Flexibility and Efficiency | 1/4 | The entire Log In tab is a dead end in production — see P0 below. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean single-column layout, undercut by six stacked interactive elements (OAuth button, divider, two fields, submit, dismiss) in one undifferentiated column with no card/section boundary. |
| 9 | Error Recovery | 1/4 | Live-tested: a Supabase 400 (bad email) and a 429 (rate limited) both render the identical "Something went wrong sending your link. Please try again." — no differentiation, no actionable guidance, no indication a 429 just needs time. |
| 10 | Help and Documentation | n/a | A two-field auth form isn't a context where inline help exists anywhere else in this system. |
| **Total** | | **18/36** | **Acceptable (50%, bottom of band)** |

## Design Specificity Verdict

**LLM assessment**: The modal's bones are clearly built for this product — Playfair italic heading, Kindness Red CTA, flat cream bottom sheet, every visible label traced to `ctaCopy.ts`. But the trust copy under the heading ("bank-level encryption…") is generic SaaS/fintech language that could paste unchanged into any signup form, sitting directly beneath the best-voiced line in the component. Combined with an unbranded plain-text "Continue with Google" (no logomark), the modal reads as mostly-authored with one conspicuous copy-pasted seam.

**Deterministic scan**: `detect.mjs` on `AuthGate.tsx` returned exit code 2 with 7 advisory findings — 5 font-size deviations (lines 99, 112, 171, 178, 181, 184) and 2 flags on the undocumented color `#F0ECE4` (lines 100, 113). Cross-checked against DESIGN.md directly: **the color flag is a false positive** — `#F0ECE4` is explicitly documented as the inactive-tab fill color under "Tabs (documented exception)." Most of the font-size flags (13px/13.5px button and subtext sizes) also fall inside DESIGN.md's own disclaimed 10–16px practical range for DM Sans UI text and aren't real violations. The one that **is** real: the "Check your inbox" OTP-step heading renders at 22px against the system's 23px Title-scale norm for section/modal headings — a genuine, if minor, deviation. Separately, the amber `#FF8F00` OTP icon that Assessment A flagged as off-palette is actually the documented sitewide "Secondary/Warmth Amber" delight color — also a false positive once cross-checked against DESIGN.md.

**Visual overlays**: A live browser pass via the bundled detector's injected overlay script surfaced 20 anti-pattern findings — but all 20 trace to the underlying `/create` builder page (CouponCardHero, coupon text sizing, template swatches), none to the AuthGate dialog's own DOM. The overlay scans the whole page rather than scoping to the open modal, so none of that output is usable evidence about AuthGate itself — it's pre-existing signal about the builder screen, out of scope here.

## Overall Impression

The modal's mechanics are unusually solid — focus trap, Escape, ARIA roles, and copy-registry discipline are all confirmed correct through direct testing, not just code reading. But two things undercut it hard: the Log In tab doesn't actually work outside development, and every failure path (bad input, rate limiting, server error) collapses into one identical, non-actionable sentence at the single highest-stakes moment in the product — right after someone finishes personalizing a gift. The biggest opportunity is differentiating what's actually going wrong and giving the sender a real way through it, since right now "it kinda sucks" is coming from a very real, reproducible source: the error states, not the shell around them.

## What's Working

- **Accessibility mechanics are genuinely strong.** Confirmed via real keyboard input (not synthetic events): focus moves into the dialog on open, Tab/Shift+Tab traps correctly in both directions across all 7 focusable elements, Escape closes and returns focus to the exact trigger button, and `role="dialog"`/`aria-modal`/`aria-labelledby` all resolve correctly to a real heading. Many teams skip this entirely.
- **Copy discipline.** Every visible label traces to `ctaCopy.ts` with zero generic "Submit"/"Confirm" strings — the system's copy-registry rule is followed without exception here.
- **Correct adherence to two easy-to-violate system rules**: zero `box-shadow` anywhere (Sole Elevation Rule intact) and Playfair reserved exclusively for the heading while every button/tab/input stays DM Sans.

## Priority Issues

**[P0] Log In is non-functional in production.**
Why it matters: `mode === 'login'` always calls `devInstantLoginAction`, which unconditionally returns `{success:false, error:'Not available in production.'}` when `NODE_ENV === 'production'` (`AuthGate.tsx` calling `src/app/auth/actions.ts:17-18`) — confirmed by the fact that the existing test suite mocks this function as *the* login mechanism. Any real returning user who clicks "Log In" today gets a dead end with no real path to their account.
Fix: Build an actual production login flow (e.g. `signInWithOtp` gated to existing accounts, or an account-check + magic link), and keep the instant-login shortcut as a dev-only affordance rather than the default Log In action.
Suggested command: `$impeccable harden`

**[P1] One generic error message covers every distinct failure.**
Why it matters: Live-tested — submitting triggered a Supabase 400, and an immediate retry triggered a 429 (rate limited); both rendered the exact same "Something went wrong sending your link. Please try again." A rate-limited sender is told to retry, retries immediately, and hits the identical wall with zero indication of why or how long to wait.
Fix: Branch on the Supabase error and show a specific, actionable message per case (bad email vs. rate-limited vs. real outage).
Suggested command: `$impeccable clarify`

**[P1] No client-side email validation.**
Why it matters: Typing "notanemail" fires a real network request that comes back as a 400, shown through the same generic copy as every other failure — an instantly-catchable mistake is made to look like a server problem.
Fix: Validate email format before the request fires; reserve the network round-trip for things that actually need it.
Suggested command: `$impeccable harden`

**[P1] A second tabbed-UI pattern duplicates one DESIGN.md documents as exclusive.**
Why it matters: DESIGN.md names Profile's Sent/Received view as "the one place in the app with tabs" and explicitly says "don't reach for tabs elsewhere without a similarly good reason." AuthGate's Sign Up/Log In pill pair is a second, independent tab implementation — same visual language, different component, no cross-reference. This isn't just a style nit: it sets a precedent that any future modal can reach for tabs, eroding the one documented exception into a de facto pattern.
Fix: Either fold AuthGate's tabs into the same reusable tab pattern Profile uses (making the "one exception" true again), or make a deliberate, documented call that auth mode-switching is a second legitimate use and update DESIGN.md to say so.
Suggested command: `$impeccable document`

**[P2] Trust copy breaks the brand voice at the worst possible moment.**
Why it matters: "Your information is safe with us. We use bank-level encryption and will never share your details" is generic fintech reassurance, not gift-shop warmth — and it sits directly under "Almost there — save your coupons," the best-voiced line in the component, creating immediate tonal whiplash right when a sender is emotionally invested in a gift they just finished writing.
Fix: Rewrite in the product's own register — tie reassurance to keeping the recipient's gift a surprise, not to encryption standards.
Suggested command: `$impeccable clarify`

## Persona Red Flags

**Riley (Stress Tester)**: Directly reproduced a dead-end loop — first submit returned a Supabase 400, immediate retry returned a 429, both surfaced as the identical "please try again" text with no cooldown indicator and no way to tell the wait is time-based rather than input-based.

**Jordan (First-Timer)**: The "bank-level encryption" line is exactly the kind of copy that makes a first-time gifting-app user pause and wonder if they've landed on something transactional/financial rather than a warm personal-gift product — a trust signal that actively undermines trust in this specific context.

**Sam (Accessibility-Dependent)**: Error text (`role="alert"`, e.g. "Enter your email ♥") isn't wired to the email field via `aria-describedby`/`aria-invalid`, so a screen-reader user tabbing back to fix the field gets no field-level context beyond whatever they caught from the live-region announcement. Separately, the tab pills render at roughly 32px tall — under the ~44px touch-target guideline.

## Minor Observations

- The OTP-step "Check your inbox" heading renders at 22px against the system's 23px Title-scale norm for modal headings — small, but a real deviation (confirmed, not a false positive like the color findings above).
- Disabled submit button uses 60% opacity against the design system's documented 50% for the disabled state; form inputs use a 12px radius against the documented 14px minimum.
- "Continue with Google" has no G logomark — plain text next to what should be a recognizable OAuth button.
- Tapping the dimmed backdrop does not dismiss the modal — plausibly intentional (this is a high-stakes form, accidental loss would be bad), but undocumented either way.
- **Mobile viewport (390px) could not be verified in this pass** — browser tooling reported the resize as successful but the actual viewport never moved off ~2300px wide, across three attempts. Given the product's non-negotiable mobile-first requirement (every component must work at 390px first), this modal's mobile rendering is an open gap, not a confirmed pass.
- Similar font-scale deviations (13–13.5px against the documented ramp) also exist in sibling modals (`AgeGate.tsx`, `FeatureInterestModal.tsx`, `PINVerificationModal.tsx`) — out of scope for this critique, but worth knowing this isn't an AuthGate-only pattern if a typeset pass gets scheduled.

## Questions to Consider

- If Log In can't actually log anyone in today, has anyone tested this specific flow on a deployed (not local) environment — or has every real test session been running in dev mode, where the shortcut quietly works?
- Every error already routes through one catch-all string — is that an intentional "defer auth polish" decision, or just the first time anyone has actually hit the rate limiter during testing?
- Now that AuthGate has its own tab pattern, is "tabs live only in Profile" still the rule you want, or has that already quietly become two rules?
