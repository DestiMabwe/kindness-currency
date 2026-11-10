# QA Report (report-only): Payment user experience

- **Date:** 2026-11-09
- **Target:** http://localhost:3100 (Next.js 16.2.6 dev, `kindness-currency/`, started for this run with `next dev -p 3100`)
- **Mode:** qa-only, scoped to the payment UX (create > cart > checkout > Pay > return page > webhook)
- **Payments:** Paystack, **test key only** (`sk_test_`). No real money, no card details entered.
- **Browser:** Claude-in-Chrome (the gstack `browse` binary is broken on Windows: `server-node.mjs not found`)
- **Health score:** 94/100, **provisional**. See "What was NOT tested". The score only covers what was reachable.

## Follow-up: corrections and status (after reading the code)

Two findings below were **wrong or overstated**; I checked them against the source after the run.

| Issue | Status |
|---|---|
| ISSUE-001 sign-up wall at Pay | **Kept the timing** (deliberate design: auth opens only where Paystack needs it). **Fixed the surprise**: logged-out buyers now see a sign-in heads-up on the checkout screen. Moving the gate earlier is a one-line change if wanted. |
| ISSUE-002 silent add to cart | **Mostly wrong.** The gesture card already shows "Added ✓" for 1.3s; my screenshots were taken 2-3s later and missed it. The "Design My Gift" label is an approved CTA; left as is. |
| ISSUE-003 swallowed "+" | **Misdiagnosed.** `PromoScrollPopup` auto-opens after 3.5s or 200px of scroll and covered the button; the "+" itself works. Whether it should fire mid-shopping is a product call. |
| ISSUE-004 banner for gestures-only cart | **Fixed.** Cart banner now adds "One-time gestures don't count toward this." when the cart holds gestures. |
| ISSUE-005 pricing page incomplete | **Fixed.** `/pricing` now lists all nine gestures with regional prices; `PRICING.md` updated (it was stale: "not yet implemented", "no free tier"). |
| ISSUE-006 desktop stretch | **Not fixed.** App-wide (pricing, create, cart all lack a container), not cart-specific. Needs one decision. |
| ISSUE-007 discount stacking | **Not fixed.** Needs a product decision; now recorded in `PRICING.md` open questions. |

## What was NOT tested (read this first)

The happy path of paying was not exercised. Pressing **Pay** opens a sign-up gate (Google or emailed magic link). I do not create accounts or sign in via Google/real email, so everything after that point is untested:

- Redirect to the Paystack hosted checkout, and whether Paystack accepts the currency being charged ($ amounts)
- Paystack test-card payment, the success return page, the "come back here to personalize each one" step
- Webhook with a valid signature (only invalid/missing signatures were tested)
- Receipt/email, double-click on Pay, abandoned/pending payment states
- Phone-width layout (the browser window would not resize below ~2304px)
- Accessibility audit (not systematic)

To cover these: sign in yourself in the test browser, then re-run `/qa-only` and I'll continue from the cart.

## What works well

- **Discount math is correct to the cent in every case tried:**
  - Gestures excluded from 3-for-2 (3.98 + 2.99 + 4.99 + 6.99 = 18.95, minus 2.99, total 15.96).
  - Couple's bundle: 6.99 + 6.99 - 9.99 = 3.99 off; total 18.96 reconciles.
  - Mom's x3 gives exactly one free unit; subtotal 31.92 reconciles.
  - Dropping below 3 sets removes all discounts and brings back "Add 1 more coupon book...".
- Cart badge count matches items (2, 5, 6, 8, 4 across steps).
- Cart survives navigation and reload.
- `/cart/complete` with no or bogus reference shows a calm failure state ("That didn't go through... Back to Cart") with a clear next action.
- Webhook `/api/webhooks/paystack`: 401 `Invalid signature` with no signature and with a bad signature; 405 on GET.
- Pricing copy on `/pricing` matches `PRICING.md` ($2.99 / $4.99 / $6.99 / $9.99 bundle).

## Issues

### ISSUE-001 (Medium, UX): Sign-up wall appears only after pressing Pay
Flow: Cart > Checkout summary > **Pay $3.98** > sign-up sheet. The buyer has already built a cart, reviewed totals and committed to paying before learning an account is required. Headline reads "Almost there — save your coupons", which does not fit a payment moment (they are paying, not saving).
Repro: add any item, `/cart` > Checkout > Pay.
Evidence: sign-up sheet screenshot taken in-session.

### ISSUE-002 (Medium, UX): "Design My Gift · $x" silently adds to cart
The button label promises a design step. It actually adds to cart: the page stays put, the quantity stepper resets to 1, and the only feedback is a tiny badge in the header. No toast, no "View cart". Checkout then says "pay securely via Paystack, then come back here to personalize", so the real order is pay first, design later, which the label never signals.
Repro: `/create`, press any priced "Design My Gift · $".

### ISSUE-003 (Medium, Functional): First "+" on a priced gesture is swallowed by a promo modal
Pressing "+" on Night Out ($1.99) opened "Buy 3, Get the Cheapest Free", whose own text says "Not valid for one-time gestures". The quantity stayed at 1 after dismissing it. A second "+" press worked (qty 2, button $3.98, no modal). The buyer sees a discount pitch for something they are explicitly excluded from, and their first tap does nothing. Reproduced once; not retried a second time.
Repro: `/create`, press "+" on Night Out.

### ISSUE-004 (Low, Content): 3-for-2 messaging contradicts itself for gestures
The cart banner "Add 3 more coupon books and the cheapest one is free" shows on a gestures-only cart. Gestures never qualify, and that exclusion is stated only inside the modal, not in the cart or on `/pricing`.

### ISSUE-005 (Low, Content): Price list is incomplete and docs drift
`/pricing` ("One-time, per coupon set") lists sets only. The $1.99 gestures and the five "Free" gestures on `/create` appear nowhere on it. `PRICING.md` says "no permanently free tier" while five gestures are free, and the home page still says "Customize the perfect coupons. Start free." Probably intended (free gestures as the try-before-buy), but the pricing page and doc should agree.

### ISSUE-006 (Low, Visual): Cart and checkout have no max-width on desktop
At desktop width the Checkout and Pay buttons stretch edge to edge (~1500px wide) and line items sit far from their prices. Mobile-first is the stated rule, so this is only a desktop polish issue.

### ISSUE-007 (Info): Discount rules worth a decision
- Couple's bundle and 3-for-2 **stack** (both applied in the $18.96 cart). `PRICING.md` doesn't say whether they should.
- 3-for-2 gives only **one** free item regardless of quantity (6 sets, 1 free), consistent with `PRICING.md`, but not what shoppers expect from "3 for 2".
- The free line shows "FREE (3-for-2)" and hides its original price (no strikethrough).

### Risk to verify manually (not a confirmed bug)
`/cart/complete` says "nothing was charged" on any non-success result, including a missing reference. If Paystack returns a *pending* or verification fails transiently for a real paid transaction, the buyer may be told they weren't charged when they were. Needs a real test transaction to confirm.

## Console health
One hydration warning on `/pricing`, caused by the Grammarly browser extension injecting attributes into `<body>` (`data-gr-ext-installed`). Environmental, not an app bug. No app errors.

## Score breakdown (provisional)
Console 100, Links 100, Visual 97, Functional 92, UX 78, Performance 100 (dev server, not measured), Content 94, Accessibility 100 (not audited). Weighted: 94.5.

## Notes
- Screenshots were reviewed in-session; none were saved to disk.
- No test framework check needed (project has Vitest).
- Port 3000 on this machine is a different Express app (`src/server.js`), not Kindness Currency.
