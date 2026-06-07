# Kindness Currency — Agent Handbook

## Purpose
This repository builds Kindness Currency: a Next.js + Supabase app for creating and redeeming digital coupons.
The implementation must stay aligned with PRD.md and the current architecture.

## Source of truth
PRD.md is the canonical source of truth.
Do not follow Kindness_Currency_Master_Brief.txt — it contains superseded instructions.

## Absolute rules
- Do not put the PIN in the URL.
- Do not use `template_type` as a TEXT enum.
- Do not use “100% free, always”; use “Start free”.

## Working principles
Build the smallest correct solution that satisfies the PRD.
Prefer clarity over cleverness.
Prefer existing modules over new abstractions.
Do not invent new flows, states, or data models unless the PRD explicitly requires them.

## Stack
- Next.js App Router, using `app/` only.
- TypeScript in strict mode.
- Tailwind CSS with PRD design tokens.
- Supabase for Postgres and Auth.
- Vercel deployment with environment-aware magic links.
- Zod as the source of truth for types and mutations.
- Fonts: Playfair Display for coupon titles, DM Sans for all UI text.

## Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Security
- PIN codes are stored as bcrypt hashes (10 rounds), never plaintext.
- `RedemptionEngine` must use `bcrypt.compare()`, never string equality.
- The magic link is always `/give/[uuid]` with no query parameters.
- Never expose PINs in logs, UI text, seed data, or test snapshots.
- Use `bcryptjs` for hashing and verification.

## Type safety
- Keep `strict: true`.
- Derive types with `z.infer<>`.
- Do not mirror Zod schemas with separate interfaces.
- No `@ts-ignore`.
- No `as any`.
- Prefer explicit narrowing to unsafe assertions.

## Supabase boundaries
- Do not import `@supabase/supabase-js` directly in component files.
- Use `src/lib/supabase/client.ts` for browser code.
- Use `src/lib/supabase/server.ts` for server components and route handlers.
- `templateRepository.ts` is read-only.
- `redemptionEngine.ts` is the only write path for coupon status changes.
- Keep database writes inside server-side modules.

## UI rules
- Mobile-first: every component must work at 390px first.
- CouponCard locked elements are never user-controlled:
  - ticket/coupon shape,
  - scalloped clip-path,
  - “Good for a ___” framing label,
  - Kindness Red border,
  - barcode graphic,
  - template decorative motif.
- Add `'use client'` only when state, effects, refs, localStorage, or event handlers require it.
- Do not add `'use client'` to layouts, server components, or data-fetching modules.

## Copy rules
- Use the exact CTA copy from `src/constants/ctaCopy.ts`.
- Do not replace approved CTA labels with generic words like “Submit”, “Click here”, or “Confirm”.
- Keep public-facing copy aligned with PRD tone and naming.

## Build order
1. Database schema + seed migrations (`supabase/migrations/`).
2. `/give/[id]` redemption page.
3. Mom’s Promise Tokens template UI.
4. `/create` coupon creation flow.
5. Home page.
6. Remaining templates: Valentine’s, Birthday, Lovers, Besties.

## Module map
- TemplateRepository — `src/lib/templateRepository.ts`
- CouponCard — `src/components/coupon/CouponCard.tsx`
- CouponSetBuilder UI — `src/components/builder/CouponSetBuilder.tsx`
- CouponSetBuilder state — `src/hooks/useCouponSetBuilder.ts`
- PINVerificationModal — `src/components/modals/PINVerificationModal.tsx`
- RedemptionEngine — `src/lib/redemptionEngine.ts`
- AuthGate — `src/components/modals/AuthGate.tsx`
- AgeGate — `src/components/modals/AgeGate.tsx`
- GiftReadyScreen — `src/components/shared/GiftReadyScreen.tsx`
- Zod schemas — `src/schemas/couponSchema.ts`
- CTA copy — `src/constants/ctaCopy.ts`
- Design tokens — `src/constants/designTokens.ts`
- Supabase browser client — `src/lib/supabase/client.ts`
- Supabase server client — `src/lib/supabase/server.ts`
- Feature flags — `src/lib/flags.ts`

## Scope control
- Do not build Phase 2 or Phase 3 features.
- Gate any out-of-scope work behind flags in `src/lib/flags.ts`.
- If a feature is not in Phase 1 of the PRD, treat it as out of scope until explicitly approved.

## Implementation guidance
- Keep business logic in reusable server-side helpers.
- Keep components focused on rendering and user interaction.
- Keep validation at the boundary with Zod.
- Keep data access in dedicated lib modules.
- Avoid duplicate sources of truth for templates, CTA copy, or design tokens.
- Check the existing module map before creating new files.
- Make the smallest change that solves the problem.

## Testing priorities
Test external behavior, not implementation details.
Priority test files:
- `src/lib/__tests__/redemptionEngine.test.ts`
- `src/components/coupon/__tests__/CouponCard.test.tsx`
- `src/components/modals/__tests__/PINVerificationModal.test.tsx`
- `src/components/modals/__tests__/AgeGate.test.tsx`
- `src/hooks/__tests__/useCouponSetBuilder.test.ts`

Required behaviors:
- Correct PIN redeems.
- Wrong PIN returns a soft error.
- Already-redeemed remains idempotent.
- Locked CouponCard elements always appear.
- Age gate blocks restricted templates until confirmation.
- Draft state persists to localStorage and rehydrates on reload.

## Workflow
1. Read PRD before coding any feature.
2. Inspect the relevant existing module before introducing new abstractions.
3. Implement the smallest correct change.
4. Run type checks and tests for the touched surface area.
5. Prefer deterministic tools over manual checking when available.

## Commands
```bash
bun dev              # start Next.js dev server
bun test             # run Vitest
bun run typecheck    # tsc --noEmit
bun run lint         # eslint
supabase start       # start local Supabase (Postgres + Auth + Studio)
supabase db reset    # reset local DB and re-run migrations + seed
```

---

## Final reminder
PRD.md overrides everything else.
Kindness_Currency_Master_Brief.txt is deprecated and must not be followed.