# Kindness Currency — UI/UX Brief
*Referenced in: Kindness_Currency_Master_Brief.txt (PRD), Section 4 & 6*

This document is the single source of truth for the coupon component's visual structure. It overrides any prior coupon shape descriptions in the PRD. Build to this spec exactly.

---

## 1. Coupon Anatomy (Fixed Structure — Locked)

The coupon is a horizontal ticket made of two zones inside a thick colored frame:

```
┌─────────────────────────────────────────────────────────┐
│  (thick solid color outer border, full rounded corners)  │
│  ┌───────────┐ ┊                              ┌────────┐│
│  │           │ ┊  GOOD FOR ONE                 │        ││
│  │  BARCODE  │ ┊                                │  ICON/ ││
│  │ (rotated  │ ●  SERVICE TITLE                 │  IMAGE ││
│  │  vertical)│ ┊  (large, bold headline)         │  SLOT  ││
│  │           │ ┊                                │        ││
│  │FINE PRINT │ ●  fine copy line                 │        ││
│  └───────────┘ ┊                              └────────┘│
│                 (dashed perforation, vertical)            │
└─────────────────────────────────────────────────────────┘
```

### Zone 1 — Barcode Stub (left, ~18% width)
- Decorative barcode graphic, vertical orientation
- Label "FINE PRINT" rotated 90°, running alongside the barcode
- Sits inside the cream inner panel, left-aligned

### Zone 2 — Perforation Divider
- Vertical dashed line separating the barcode stub from the content area
- **Two circular notches** cut into this divider — one at the top, one at the bottom — using the OUTER border color, positioned where the dashed line meets the top and bottom edges of the inner panel
- This is the single most important detail — it is what makes the shape read as a ticket, not a card

### Zone 3 — Content Area (center, ~55% width)
- Top: small label, uppercase, bold — "GOOD FOR ONE"
- Middle: large bold headline (the act of service) — this is the dominant visual element
- Bottom: fine copy line, smaller, secondary color

### Zone 4 — Decorative Image Slot (right, ~20% width)
- A small illustration or icon specific to the coupon set's theme
- This is the ONE element that changes per coupon set (see Section 3)
- Square or circular crop, sits inside the cream inner panel

### Frame
- Outer: thick solid color border (12-16px), full rounded corners (16-20px radius)
- Inner: cream/off-white panel, inset within the outer border, slightly rounded corners (10-12px radius)
- This two-tone frame (bold outer + soft inner) is what gives it a premium, tactile feel — not flat

---

## 2. Technical Implementation Notes

- Build with CSS (flexbox for the 3-zone layout) — do NOT use a flat image or single div with border-radius
- Notches: absolutely positioned circles using the PAGE/outer border color, placed precisely at the top and bottom intersection points of the perforation line and the inner panel edge
- Perforation: `border-left: dashed` or a repeating-linear-gradient for finer control
- Barcode: can be a simple SVG pattern of vertical bars, decorative only — does not need to be scannable
- Rotated text ("FINE PRINT"): `writing-mode: vertical-rl` or `transform: rotate(-90deg)`
- Component must be a single reusable React component accepting props: `outerColor`, `innerColor` (usually fixed cream), `label`, `title`, `fineCopy`, `decorativeImage`

---

## 3. What Varies Per Coupon Set (and what doesn't)

Per your direction: **only color and decorative icon/image change between the 5 templates. Shape, layout, and structure stay identical across all sets.**

| Template | Outer Border Color | Decorative Image/Icon |
|---|---|---|
| Mom's Promise Tokens | Soft rose (#E8A5BE or similar) | Flower / ribbon illustration |
| Valentine's Love Passes | Kindness Red (#C2185B) | Rose / sparkle illustration |
| Birthday Joy Tokens | Warmth Amber (#FF8F00) | Balloon / confetti illustration |
| Lover's Intimate Promises | Deep Ink (#1A1A2E) | Candle / moon illustration |
| Bestie's Surprise Passes | Bright Amber/Red mix | Star / lightning illustration |

The inner cream panel (#FFF8F0) stays constant across all 5 sets — it is the unifying brand element. Only the frame color and the image slot change. Text colors (headline, label) should match the outer border color of that set for consistency.

---

## 4. Per-Coupon Editable Fields (within the locked shape)

Recall from the PRD: shape is locked, content is editable.

- `label` → defaults to "GOOD FOR ONE", not user-editable (system constant)
- `title` → user-editable (the act of service, e.g. "Breakfast in Bed")
- `fineCopy` → user-editable (the fine print line)
- `decorativeImage` → fixed per template, not user-editable in MVP
- `font` → user-selectable between Playfair Display / DM Sans for the title

---

## 5. Reference

Source mockup: user-provided Canva layout (uploaded image, see project assets).
Key takeaway from reference: barcode-left orientation, vertical perforation with top/bottom notches, two-tone frame, dedicated image slot — this is the structure to replicate exactly, only swapping colors and imagery per template.
