# KINDNESS CURRENCY — BRIEF AMENDMENTS v1
# Generated from post-brief review session | 2026-05-24
# These amendments override conflicting instructions in Kindness_Currency_Master_Brief.txt

---

## AMENDMENT 1 — PIN SECURITY (replaces Section 5, Magic Link URL Structure)

### Old (REMOVE THIS):
> Magic Link URL Structure: `kindnesscurrency.app/give/[uuid]?pin=[4-digit-pin]`
> Verification Logic: If the `pin` parameter in the URL matches the `pin_code` stored in the database...

### New:
The PIN must NOT be embedded in the URL. It is a security token and must be kept separate from the shareable link.

**Magic Link URL Structure:**
```
kindnesscurrency.app/give/[uuid]
```
No PIN in the URL. Ever.

**PIN Delivery:**
- After the sender completes "Send with Love", they land on a "Your gift is ready" screen
- This screen displays: the shareable link + the 4-digit PIN separately
- Copy on screen: *"Share the link via WhatsApp. Send the PIN separately — or whisper it in person."*
- The PIN becomes part of the gift ritual, not a technical afterthought

**Updated Verification Logic on /give/[id]:**
1. Recipient opens the link — no PIN in the URL
2. They tap "Redeem This ♥"
3. A warm confirmation modal appears asking them to enter the 4-digit PIN
4. If PIN matches `pin_code` in the database → coupon redeems
5. If PIN is wrong → soft error: *"That PIN doesn't match. Check your message from [Sender Name]."*
6. No brute-force fallback needed — the UUID alone is unguessable (128-bit)

---

## AMENDMENT 2 — TEMPLATES TABLE (replaces Section 3 Zod enum + Section 7 Priority 1)

### Old (REMOVE THIS):
> `template_type` enum must strictly be: `'mothers_day' | 'valentines' | 'birthday' | 'lovers' | 'besties'`
> All backend API routines must parse through this schema first.

### New:
Templates are stored in the database, not hardcoded in Zod. This allows new templates to be added without code changes or redeployment.

**New Database Tables:**

```sql
-- Table: templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,           -- e.g. 'mothers_day'
  name TEXT NOT NULL,                  -- e.g. "Mom's Promise Tokens"
  theme TEXT,                          -- e.g. "Promise"
  color_mood TEXT,
  decorative_element TEXT,
  emotional_tone TEXT,
  is_age_restricted BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Table: template_coupons
-- Purpose: Default coupon content for each template
CREATE TABLE template_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  service_title TEXT NOT NULL,
  micro_copy TEXT,
  fine_print TEXT
);
```

**Updated coupon_sets table:**
- Remove: `template_type TEXT`
- Add: `template_id UUID REFERENCES templates(id)`

**Zod Schema Update:**
Zod no longer validates `template_type` as an enum. Instead, validate that `template_id` is a valid UUID and verify it exists in the `templates` table at runtime.

**Seeding:**
Seed all 5 templates and their default coupons (from Section 6 of the original brief) into the database on first deploy via a migration seed file, not hardcoded application logic.

---

## AMENDMENT 3 — AGE GATE FOR LOVERS TEMPLATE (new, not in original brief)

The "Lover's Intimate Promises" template (`slug: 'lovers'`, `is_age_restricted: true`) requires an age gate.

**Template Card (on /create template selector):**
- Display an "18+" badge on the Lover's Intimate Promises card
- Badge styling: small pill, Kindness Red background, white DM Sans text

**Age Gate Modal (triggers on template selection):**
- Appears immediately when the user clicks the Lover's Intimate Promises card
- Must be dismissed before the template is selected

Modal copy:
```
┌──────────────────────────────────────────────┐
│                                              │
│   This template contains intimate content    │
│   intended for adults (18+).                 │
│                                              │
│   By continuing, you confirm that you and    │
│   your recipient are 18 years or older.      │
│                                              │
│   [Go Back]          [I'm 18+, Continue →]   │
│                                              │
└──────────────────────────────────────────────┘
```

**Implementation:**
- Check `templates.is_age_restricted` when rendering template cards
- If `true`, wrap the card click in an age gate modal
- The modal is a local React state gate — no server-side verification required
- If user clicks "Go Back", template is not selected and modal closes

---

## AMENDMENT 4 — RECIPIENT CONVERSION CTA (new, not in original brief)

Add a conversion CTA at the bottom of the /give/[id] page, below all coupons.

This is the primary organic acquisition channel and must not be omitted.

**Placement:** Below the last coupon card, above the page footer
**Style:** Subtle, warm — does not compete with the coupon experience

```
─────────────────────────────────
  Loved this gift?

  "Create your own — it's free."

  [ Create My Coupons → ]
─────────────────────────────────
```

- Button routes to: `/create`
- Button style: ghost button, Kindness Red border, Kindness Red text
- No tracking or forced sign-up — just a clean CTA

---

## AMENDMENT 5 — MONETISATION PLAN (replaces "100% free, always")

### Old (REMOVE THIS):
> "Customize the perfect coupons. 100% free, always."

### New copy:
> "Customize the perfect coupons. Start free."

**Monetisation Ladder (build in phases, not all at once):**

**Phase 1 — Free Tier (current):**
- All 5 templates free
- Full coupon creation and sending
- "Made with Kindness Currency" watermark on the /give/[id] page footer

**Phase 2 — Premium Send (~R60 or $3 one-time per set):**
- Remove watermark
- Animated coupon reveals (envelope opening, confetti drop on load)
- Scheduled delivery (choose a date and time to send the magic link)

**Phase 3 — Corporate Tier (~R400/$20 per month):**
- Bulk coupon set creation for teams
- Custom branding (company logo replaces Kindness Currency logo)
- Redemption analytics dashboard
- Ideal for: HR teams, employee appreciation, client gifting

**Do not build Phase 2 or Phase 3 yet.** Validate with real users first.

---

## SUMMARY OF CHANGES

| # | Section | Change |
|---|---------|--------|
| 1 | PIN Security | PIN removed from URL; delivered separately to sender; modal entry on redeem |
| 2 | Templates | Moved from Zod enum to `templates` + `template_coupons` DB tables |
| 3 | Age Gate | New modal for Lovers template; 18+ badge on card |
| 4 | Conversion | "Create My Coupons" CTA added to /give/[id] page |
| 5 | Monetisation | "100% free, always" removed; phased monetisation plan added |

---

*Use this file alongside Kindness_Currency_Master_Brief.txt. Where they conflict, this file wins.*
