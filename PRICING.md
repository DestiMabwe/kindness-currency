# Pricing

Status: proposed, not yet implemented. No billing infrastructure exists yet (no Stripe/Paddle/etc. in `package.json`). This document records the pricing model as discussed and agreed with the product owner on 2026-08-27, superseding the "monetisation explicitly undecided" note in `PRODUCT.md`.

## Model

All templates are paid — there is no permanently free tier. This is a deliberate departure from a freemium model, made viable by the existing preview flow (`See a Coupon Sample`, `Preview All Coupons`) which already lets a sender experience the full message → instructions → coupon-list flow before paying, doing the "try before you buy" trust-building a free tier would otherwise provide.

Pricing is one-time, per coupon set — not a subscription. Rationale: this is an occasion-driven product (a birthday, an anniversary), not a daily-use tool, so recurring billing would see high churn and resentment rather than sustained value. One-time purchase matches the mental model people already have for buying a nice card or gift.

## Bundle mechanic: 3 for 2

Modeled on Clicks' well-known "3 for 2" promotion, so the mechanic needs zero explanation for anyone who's shopped there: buy 3 templates, get the cheapest one completely free. At checkout, once a cart contains 3 or more coupon sets, the cheapest one is automatically discounted to $0. The discount always applies to the lowest-priced item in the cart, so it can't be gamed by adding two cheap templates and picking the most expensive one as the freebie.

Example: a Tier 3 ($6.99) + Tier 2 ($4.99) + Tier 1 ($2.99) cart nets ~20% off — $11.98 for $14.97 of value — without discounting the highest-value items.

## Per-template prices

### Tier 1 — Everyday ($2.99)

Broad, evergreen appeal; lowest friction, highest expected volume.

| Template | Slug |
|---|---|
| Mom's Promise Tokens | `mothers_day` |
| Birthday Joy Tokens | `birthday` |
| Bestie's Surprise Passes | `besties` |
| Dad's Promise Tokens | `dads` |
| Sibling Adventure Tokens | `siblings` |
| Good Food Tokens | `meal-coupons` |
| Movie Night Passes | `movie-marathon` |

### Tier 2 — Occasion ($4.99)

Tied to a specific date or moment (a holiday, a trip, a shopping trip) — higher purchase intent than an evergreen template.

| Template | Slug |
|---|---|
| Valentine's Love Passes | `valentines` |
| Christmas Joy Tokens | `christmas` |
| Travel Buddy Passes | `travel-buddies` |
| Shop Till We Drop Passes | `shopping-spree` |
| Always Close Promises *(long-distance partners)* | `long-distance-lovers` |

### Tier 3 — Romance / Premium ($6.99)

Consistently the highest willingness-to-pay category in gifting (anniversaries, romance). `lovers` is 18+ intimate content and age-gated; `requested-by-him`/`requested-by-her` are not age-restricted.

| Template | Slug |
|---|---|
| Lover's Intimate Promises (18+) | `lovers` |
| Requested By Him: Lover's Wishes | `requested-by-him` |
| Requested By Her: Lover's Wishes | `requested-by-her` |

`requested-by-him` and `requested-by-her` are designed as a pair — sell them together as a $9.99 couple's bundle at checkout when both are in the cart, rather than $6.99 + $6.99 separately.

### Flagship — Custom Coupon Book ($9.99)

Fully custom titles/text, not template defaults. Priced above every template since it replaces the sender's entire creative effort, not just a design choice. Currently early-access/"launching soon" (`src/lib/comingSoonTemplateRepository.ts`).

## Open questions / not yet decided

- Payment provider (Stripe, Paddle, LemonSqueezy, etc.) — nothing is integrated yet.
- Whether the "3 for 2" bundle discount is per-checkout (any 3 in one cart) or needs to track cumulative purchases per account. Per-checkout is far simpler to implement and is the current assumption.
- Whether/when to revisit an optional "Kindness+" annual pass (unlimited templates + no branding + unlimited custom books) for repeat power users — deliberately deferred until there's real purchase data, not a v1 concern.
- Whether the existing "Made with Kindness Currency" footer watermark stays on all paid coupon sets, or becomes a removable extra on top of the per-template price.
