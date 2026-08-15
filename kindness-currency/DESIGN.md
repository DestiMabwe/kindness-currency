---
name: Kindness Currency
description: Act-of-service gift coupons, delivered as a redeemable ticket via a single link.
colors:
  deep-ink: "#1A1A2E"
  kindness-red: "#C2185B"
  warmth-amber: "#FF8F00"
  cream: "#FFF8F0"
  near-black: "#2C2C2C"
  neutral-white: "#FFFFFF"
  mothers-periwinkle: "rgb(131, 131, 228)"
  lovers-plum: "#7B3F61"
  besties-teal: "#2E7D6B"
  mothers-tint: "#FBE7EE"
  valentines-tint: "#FBDCE6"
  birthday-tint: "#FFEAC9"
  lovers-tint: "#EFE0EA"
  besties-tint: "#DCEEE8"
  confetti-rose: "#D4658A"
  stub-label-gray: "#6b6b6b"
typography:
  display:
    fontFamily: "var(--font-playfair), Georgia, serif"
    fontSize: "clamp(19px, 5.9vw, 40px)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "0.5px"
  title:
    fontFamily: "var(--font-playfair), Georgia, serif"
    fontSize: "23px"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "normal"
  body:
    fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(9px, 1.78vw, 12px)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "1.5px"
rounded:
  sm: "14px"
  md: "16px"
  lg: "26px"
  xl: "36px"
  full: "999px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "18px"
  lg: "24px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.kindness-red}"
    textColor: "{colors.neutral-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-primary-disabled:
    backgroundColor: "{colors.kindness-red}"
    textColor: "{colors.neutral-white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.deep-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "6px"
  coupon-redeem-button:
    backgroundColor: "{colors.kindness-red}"
    textColor: "{colors.neutral-white}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "10px 18px"
  card-generic:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.deep-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px"
  input-pin:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.deep-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.sm}"
    padding: "15px"
---

# Design System: Kindness Currency

## Overview

**Creative North Star: "The Promise Ticket"**

Kindness Currency's whole visual system exists to make one object convincing: a redeemable ticket for a kept promise. Every recurring device — the barcode stub, the dashed perforation with its two punch-hole notches, the "GOOD FOR ONE" eyebrow, the two-tone bold-outer/soft-inner frame — exists to make the coupon read as a real, physical, tearable ticket rather than a generic card or a text message dressed up. That ticket is the single hero object of the entire product; every other surface (navigation, modals, list views) is deliberately quieter so the ticket is the one thing that ever competes for attention.

Outside the ticket itself, the system is warm and unpretentious: a cream page, near-black body text, rounded corners everywhere, no sharp edges, no dark chrome. The five gift templates (Mom's, Valentine's, Birthday, Lovers, Besties) never change the ticket's shape or structure — only its accent color, tint, and decorative motif change, because the shape is what makes every gift feel premium and the color/motif is what makes each one feel personal to its occasion.

**Key Characteristics:**
- One hero object (the coupon ticket), one elevation language: it is the only shadowed, "lifted" surface in the product.
- Rounded everywhere — no unrounded corners anywhere in the system, from 14px inputs to fully circular pill buttons.
- Five template identities expressed purely through accent color + tint + motif; shape and layout are always identical.
- Playfair Display marks anything that is "the promise" (coupon titles, modal confirmation headings, page headings); DM Sans marks everything functional (buttons, labels, body copy, forms).

## Colors

Cream and near-black carry the page; five jewel-toned template accents carry personality, one at a time, never mixed on screen.

### Primary
- **Kindness Red** (`#C2185B`): the one color used sitewide regardless of template — primary CTAs ("Send with Love," "Yes, redeem with love ♥"), the Valentine's template accent, error/wrong-PIN states, and any destructive or "leave" action (Log Out) in the nav drawer.

### Secondary
- **Warmth Amber** (`#FF8F00`): highlight/celebration color — the Birthday template accent, confetti and sparkle background-effect pieces, and the visual "note of delight" color across effects regardless of which template is active.

### Neutral
- **Deep Ink** (`#1A1A2E`): near-universal text and structural color — body headings, nav text, the coupon barcode bars, the coupon outer-frame color used as a CSS variable name (`--hero-accent`) even when a template overrides it.
- **Cream** (`#FFF8F0`): the page background and the default coupon inner-panel color everywhere; the constant that unifies all five templates.
- **Near Black** (`#2C2C2C`): body text color, set once on `<body>`, used at reduced opacity (55–85%) for secondary copy throughout rather than switching to a separate gray token.
- **Neutral White** (`#FFFFFF`): background for generic content cards (Profile's coupon-set list) and form inputs — the one place true white appears instead of cream.

### Template Accents (one active at a time, never combined)
- **Mother's Periwinkle** (`rgb(131, 131, 228)`): Mom's Promise Tokens — the one template accent that is not a warm/red hue, deliberately softer and cooler for a "tender, reverent" tone.
- **Lovers Plum** (`#7B3F61`): Lover's Intimate Promises — a muted, dark, private tone distinct from Valentine's bright red.
- **Besties Teal** (`#2E7D6B`): Bestie's Surprise Passes — the one green in the system, signaling "different energy" (loud/joyful) from the romantic templates.
- Valentine's and Birthday reuse Kindness Red and Warmth Amber directly rather than getting distinct accents — see Primary/Secondary above.

### Template Tints (pale backgrounds for template-selection previews only)
- **Mother's Tint** (`#FBE7EE`), **Valentine's Tint** (`#FBDCE6`), **Birthday Tint** (`#FFEAC9`), **Lover's Tint** (`#EFE0EA`), **Bestie's Tint** (`#DCEEE8`): used only behind template-picker cards on `/create`, never on the coupon or elsewhere.

### Decorative Micro-Colors
- **Confetti Rose** (`#D4658A`): one of the five confetti-piece colors on the `confetti` background effect, alongside Kindness Red and Warmth Amber. Decorative only, not a UI color.
- **Stub Label Gray** (`#6b6b6b`): the coupon's rotated expiry-date stub text — the one piece of coupon copy that intentionally sits outside the Deep Ink / Near Black text pair, since it reads as printed-ticket fine print rather than product UI.

### Named Rules
**The One Accent Rule.** Exactly one template accent is visible on screen at a time — the moment a sender picks a template, that color becomes the coupon frame, notch, and default text-accent color for the whole flow. Two template accents never appear together.

## Typography

**Display Font:** Playfair Display (with Georgia, serif fallback)
**Body Font:** DM Sans (with ui-sans-serif, system-ui, sans-serif fallback)

**Character:** Playfair Display is reserved for anything that carries the emotional weight of "a promise" — it never appears on a button or a form label. DM Sans handles everything functional, so the two fonts read as "the gift" vs. "the interface around the gift."

### Hierarchy
- **Display** (700, `clamp(19px, 5.9vw, 40px)`, line-height 1.02, uppercase): the coupon's act-of-service headline — the single largest, most dominant text in the product. Also reused, unscaled, for the numeric PIN entry field, tying the redemption ritual back to the same voice as the coupon title.
- **Title** (800 italic, 23px, line-height 1.18): section and modal headings — "Redeem this right now?", "About Kindness Currency," "Your Coupons," "Almost there — save your coupons." Always italic Playfair; this is the system's second-most emotional register, one step down from the coupon headline itself.
- **Body** (700, 15px): button labels and primary interactive text (DM Sans bold, never Playfair).
- **Label** (800, `clamp(9px, 1.78vw, 12px)`, letter-spacing 1.5px, uppercase): the coupon's "GOOD FOR ONE" eyebrow and equivalent small-caps eyebrow text — always uppercase, always wide-tracked, always at reduced opacity (~55–60%) against its background.

### Named Rules
**The No-Promise-Without-Serif Rule.** Playfair Display only ever labels a promise or a moment of consequence (a coupon title, a confirmation heading, a page's identity heading). It never appears on a button, a nav link, or a form field label — those stay DM Sans, no exceptions.

### Honest Note on Scale Coverage
The four named steps above (Display / Title / Body / Label) are the system's *voice* register — which font, weight, and emotional register a piece of text carries — not a claim that only four pixel sizes exist anywhere in the app. In practice, DM Sans body/UI text spans a wider practical range (roughly 10px–16px) across captions, form inputs, list metadata, and nav links that are all clearly "Body" or "Label" in voice but not pinned to exactly 15px or the Label clamp. Page-level marketing headlines (the homepage hero, `GiftReadyScreen`'s "Your gift is ready") are Display-voice but deliberately larger/smaller than the coupon's own Display size, since they're a different physical context, not the ticket itself. Treat the two headings the system names explicitly by copy — "About Kindness Currency" and "Your Coupons" — as normative Title-scale (23px) usage; a full audit of the remaining practical range against a consolidated scale is `$impeccable typeset` follow-up work, not assumed already done by this document.

## Layout

Everything is built mobile-first at a 390px baseline and scales up with `clamp()` rather than snapping at fixed breakpoints — the coupon card in particular scales every internal dimension (stub width, barcode size, font sizes) proportionally from a single formula tied to its own rendered width, so it never "jumps" at a breakpoint. Page content uses generous horizontal padding (`px-4.5` to `px-5.5`, ~18–22px) and stacks in a single column; there is no multi-column desktop layout distinct from mobile — the product is designed to be opened on a phone from a shared link first, and content only widens up to a `max-width` cap (the coupon caps at 620px) rather than reflowing into columns.

## Elevation & Depth

This system uses shadows exactly once, on purpose: **the coupon ticket is the only elevated surface in the product.** Its `box-shadow: 0 12px 30px rgba(0,0,0,0.18)` is what makes it read as a physical object resting on the page rather than a flat rectangle. Every other surface — generic content cards, the nav drawer, modals — is flat, using only a hairline border (`border-[#1A1A2E]/8` to `/18`, i.e. 8–18% opacity) or no border at all to separate it from the background. This is a deliberate hierarchy signal, not an oversight: if any other surface were also shadowed, the coupon would stop reading as the singular hero object the whole product exists to deliver.

### Shadow Vocabulary
- **Ticket elevation** (`box-shadow: 0 12px 30px rgba(0,0,0,0.18)`): the coupon card only. Never applied elsewhere.
- **Colored action shadow** (`box-shadow: 0 8px 18px -8px rgba(194,24,91,0.7)`): a tight, saturated Kindness-Red glow under the coupon's own "Redeem This ♥" button — reinforces that the button belongs to the elevated object it sits on, not the flat page around it.
- **Stamp shadow** (`box-shadow: 0 4px 14px -6px rgba(194,24,91,0.5)`): the "Redeemed ♥" stamp overlay, a lighter version of the same red glow.

### Named Rules
**The Sole Elevation Rule.** Only the coupon ticket ever receives a `box-shadow`. Every other card, list item, and container stays flat with at most a hairline border. Adding a shadow anywhere else is a violation of this rule, not a style choice.

## Shapes

Rounded corners are universal — there is no sharp corner anywhere in the system, from a 14px input field up to a fully circular button. The coupon ticket is the clearest expression of the system's form language: a thick solid-color outer frame (14px padding, 26px corner radius) wrapping a softer cream inner panel (16px corner radius) — a two-tone, bold-outer/soft-inner shape repeated at smaller scale in the confirmation modal's bottom sheet (26px top corners, 36px bottom corners). Two circular notches (34px) are cut into the ticket's perforation line, the one non-rectangular, non-simple-round detail in the system, and the detail that makes the ticket read as a ticket rather than a generic card. Primary action buttons alternate between a 14px "soft rectangle" radius (form/modal buttons) and a fully circular pill (999px, the coupon's own "Redeem This ♥" button and the hamburger menu trigger).

## Components

### Buttons
- **Shape:** 14px radius for form/modal buttons (`button-primary`, `button-ghost`); fully circular pill (999px) for the coupon's own redeem action and the nav hamburger trigger.
- **Primary:** Kindness Red (`#C2185B`) fill, white DM Sans bold (15px) text, uniform ~14px padding. Disabled state drops to 50% opacity rather than changing color.
- **Hover / Focus:** no distinct hover treatment is currently implemented beyond native browser default; disabled state is the only state variation observed.
- **Ghost / Secondary:** no fill, no border — Deep Ink or muted (opacity ~70%) DM Sans semibold text only, used for dismiss/secondary actions ("Not yet," "Go Back").
- **Coupon Redeem Button:** the one button that lives on an elevated surface — pill-shaped, Kindness Red, with its own colored shadow (see Elevation & Depth) so it reads as part of the ticket, not the page.

### Cards
- **Signature — Coupon Ticket:** see Elevation & Depth and Shapes. The only card in the system with a shadow. Background is the per-set custom color (defaults to Cream) inside an accent-colored frame.
- **Generic — Content Cards** (e.g. Profile's coupon-set list): white background, 16px rounded corners, hairline border (`border-[#1A1A2E]/8`), ~16px internal padding, no shadow. Deliberately quieter than the ticket (see The Sole Elevation Rule).

### Inputs / Fields
- **Style:** white background, 14px radius, 1.5px border at 14% Deep Ink opacity by default.
- **Focus / Error:** border color switches to Kindness Red on a validation error rather than gaining a focus ring; no distinct focus-only treatment beyond the browser default outline being suppressed.
- **Signature variant — PIN entry:** center-aligned, large (26px) bold Playfair Display digits with wide (0.5em) letter-spacing — the one form input that borrows the display typeface, deliberately tying the redemption moment back to the same voice as the coupon title itself.

### Navigation
- **Style:** a light (Cream/white) header, not a dark bar — logo mark + wordmark left-aligned, linking home; a single circular outline hamburger trigger right-aligned opens a right-side slide-out drawer.
- **Drawer:** Cream background, ~78% viewport width (max 300px), semi-transparent Deep-Ink backdrop with blur behind it. Nav links are Deep Ink DM Sans semibold; the auth-related action (Log In / Log Out) is set apart in Kindness Red.
- **Mobile:** this drawer pattern is the only navigation pattern — there is no separate desktop nav treatment.

### Confirmation Modal (signature component)
The redemption confirmation ("Redeem this right now?") is a bottom-sheet, not a centered dialog: it's pinned to the bottom edge, full width, with the two-tone-echoing 26px-top/36px-bottom rounded corners described in Shapes, over a blurred dark backdrop. Heading is italic Playfair Title-scale; body copy is muted DM Sans; the PIN input and its primary/ghost button pair sit below. This bottom-sheet pattern is the template for any future "are you sure" or data-entry moment tied to a coupon.

## Do's and Don'ts

### Do:
- **Do** keep the coupon ticket as the only surface in the product that receives a `box-shadow` (The Sole Elevation Rule).
- **Do** express template identity (Mom's / Valentine's / Birthday / Lovers / Besties) only through accent color, tint, and motif — the coupon's shape and layout never change between templates.
- **Do** use Playfair Display only for promises and moments of consequence (coupon titles, confirmation headings, page identity headings); DM Sans for everything functional.
- **Do** keep every corner in the system rounded — 14px minimum, up to fully circular for pill buttons and the hamburger trigger. **Exception:** the `confetti` background effect's square confetti piece (7×7px, `border-radius: 2px`, rotated 20°) is deliberately barely-rounded to stay visually distinct from its circular sibling piece — at that scale, 14px would render as a full circle and erase the square/dot variety the effect depends on.
- **Do** use the exact CTA copy registry (`src/constants/ctaCopy.ts`) — no generic labels like "Submit" or "Confirm" anywhere.

### Don't:
- **Don't** add a shadow to any card, list item, or container other than the coupon ticket.
- **Don't** set the coupon title in italic — it is Playfair Display **Bold**, not Bold Italic, despite older project drafts saying otherwise; the current implementation is normative.
- **Don't** put the PIN anywhere in the URL — it is entered through the PIN input component only, never a query parameter.
- **Don't** use "100% free, always" anywhere in copy — the approved phrase is "Start free."
- **Don't** mix two template accent colors on screen at once (The One Accent Rule).
