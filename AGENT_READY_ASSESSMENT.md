# Agent-Ready Assessment: Kindness Currency

## Overall Agent-Ready Score: 19/100
**Rating: Not Agent-Ready**

This codebase is pre-implementation — zero source files exist, only planning documents. The score reflects the current state accurately: no test infrastructure, no CI, no CLAUDE.md, no tooling configuration of any kind. The PRD is unusually high-quality and contains everything needed to build an agent-ready foundation, but that foundation must be established before product code begins.

### Score Breakdown

| Dimension                 | Weight | Score   | Weighted |
|---------------------------|--------|---------|----------|
| Type Safety               | 20%    | 8/100   | 1.6      |
| Test Foundation           | 15%    | 5/100   | 0.75     |
| Documentation & Context   | 15%    | 28/100  | 4.2      |
| Code Clarity              | 15%    | 72/100  | 10.8     |
| Architecture Clarity      | 15%    | 5/100   | 0.75     |
| Feedback Loops            | 10%    | 3/100   | 0.3      |
| Consistency & Conventions | 5%     | 5/100   | 0.25     |
| Change Safety             | 5%     | 10/100  | 0.5      |
| **TOTAL**                 | 100%   |         | **19/100** |

---

## The Stripe Benchmark

Stripe's engineering team merged 1,000+ AI-generated pull requests in a single week. This is possible because Stripe's codebase satisfies what researchers call the **asymmetry of verification**: generating a PR is hard, but *verifying* one — with fast CI, strict types, and comprehensive tests — takes minutes. Every dimension in this assessment measures how well your codebase satisfies that asymmetry.

The goal is to make agent output cheaply verifiable: the cost of a wrong answer is low, the feedback loop is fast, and the automated verification layer catches mistakes before humans need to. A score of 70+ means that condition is largely met. Below 50 means the verification infrastructure needs to be built before agents can work reliably.

**The good news for Kindness Currency:** you have a clean slate. Building verification infrastructure before product code is the optimal sequence — the exact opposite of retrofitting it later.

---

## Critical Findings

**All 7 dimensions other than Code Clarity score below 40. None block agent work because there is no code yet — they are pre-implementation gaps, not accumulated technical debt.**

The four highest-stakes gaps, in order of consequence:

1. **No CLAUDE.md (Documentation: 28/100)** — The Master Brief file contains superseded instructions (PIN in URL, hardcoded template enum, "100% free always" copy) that directly contradict the PRD. An agent reading the Master Brief first will implement the wrong architecture. A CLAUDE.md that declares PRD.md canonical and lists the three resolved conflicts as explicit "DO NOT" rules prevents this.

2. **No tsconfig.json / TypeScript infrastructure (Type Safety: 8/100)** — No compiler, no strict mode, no Zod schemas. An agent writing code today has zero automated feedback on type correctness. The PRD correctly specifies Zod for all mutations but the file doesn't exist.

3. **No CI pipeline (Feedback Loops: 3/100)** — No automated verification signal on any commit. An agent cannot know if its changes broke something without running checks manually. This limits agents to ~0 autonomous iteration cycles per day.

4. **No directory structure (Architecture Clarity: 5/100)** — The 8 PRD modules have no filesystem home. The first file created by any developer or agent establishes a precedent that compounds. Deciding this now costs nothing; fixing it later is expensive.

**Code Clarity (72/100)** is the one bright spot — the PRD's module design is clean, names are precise, and no god-file patterns are baked in. This score will hold if the directory skeleton is established before coding begins.

---

## Verification Cost Profile

| Signal | Status | What it means |
|--------|--------|----------------|
| Tests run in < 10 min | ✗ | No tests, no runner — zero verification cycles possible |
| Security scanning automated | ✗ | PIN storage strategy undefined; no scanner to catch a plaintext `pin_code` mistake |
| Property-based tests present | ✗ | No adversarial test coverage planned |
| Reproducible dev state (seeds/factories) | ✗ | Supabase local CLI supports this but not yet configured |
| Coverage reported on PRs | ✗ | No CI, no coverage tooling |

**Verification bottleneck:** No verification infrastructure of any kind exists. Every agent change requires a human to manually assess correctness. This is the defining constraint — it must be resolved before agent work can scale.

---

## Improvement Roadmap

### Quick Wins (1-2 days each) — Do These Before Any Product Code

**1. Create `CLAUDE.md` at the project root** — This is the single highest-ROI action available. Target 80-120 lines. Must include:
- Declaration: "PRD.md is the canonical source of truth. Do not follow `Kindness_Currency_Master_Brief.txt` — it contains superseded instructions."
- Three explicit DO NOT rules: no PIN in URL, use `template_id UUID` not `template_type TEXT` enum, use "Start free" not "100% free always"
- Tech stack: Next.js App Router, TypeScript strict, Tailwind, Supabase, Vercel, Zod
- Required environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Module-to-filesystem mapping (see architecture section below)
- Build order from PRD: Schema → `/give/[id]` → Mom's Promise Tokens → `/create` → Home → remaining templates
- PIN storage requirement: "PIN codes are stored as bcrypt hashes (10 rounds), never plaintext. RedemptionEngine uses `bcrypt.compare()`, never string equality."

**2. Deprecate the Master Brief** — Add a one-line banner at the top of `Kindness_Currency_Master_Brief.txt`:
> `DEPRECATED: Superseded by PRD.md. Do not use for implementation — contains wrong PIN architecture, wrong template schema, and wrong CTA copy.`

**3. Create `.env.example`** — List all required variable names with placeholder values. Prevents a common agent failure mode where environment variables are assumed rather than verified.

**4. Bootstrap with `create-next-app` + immediate tooling layer** — Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```
Then immediately add before any component code:
- `tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`
- `.prettierrc`: `{ "semi": false, "singleQuote": true, "trailingComma": "es5", "printWidth": 100 }`
- Husky + lint-staged: pre-commit hook running `tsc --noEmit`, `eslint --fix`, `vitest run --passWithNoTests`
- No-restricted-imports ESLint rule: ban direct `@supabase/supabase-js` imports from component files

**5. Establish directory skeleton** — Create these empty directories (with `.gitkeep`) in the first commit:
```
src/
  app/
    create/
    give/[id]/
  components/
    coupon/        ← CouponCard
    builder/       ← CouponSetBuilder + hook
    modals/        ← PINVerificationModal, AgeGate, AuthGate
  lib/             ← templateRepository.ts, redemptionEngine.ts
  schemas/         ← couponSchema.ts (Zod, single source of truth)
  constants/       ← ctaCopy.ts, designTokens.ts
  types/           ← supabase.ts (generated)
supabase/
  migrations/      ← one file per schema change, never edited post-apply
  seed.sql
```

**6. Write empty test stubs** — Before implementing any module, create these empty test files with `it.todo()` per PRD test case:
- `src/lib/__tests__/redemptionEngine.test.ts`
- `src/components/coupon/__tests__/CouponCard.test.tsx`
- `src/components/modals/__tests__/PINVerificationModal.test.tsx`
- `src/components/modals/__tests__/AgeGate.test.tsx`
- `src/components/builder/__tests__/useCouponSetBuilder.test.ts`

### High-Value Investments (1-4 weeks each)

**1. GitHub Actions CI pipeline** — Three parallel jobs:
- `typecheck`: `tsc --noEmit`
- `test`: `vitest run --coverage` (with `coverageThreshold: { lines: 70, branches: 70 }`)
- `lint`: `eslint . --max-warnings 0`
- Plus: `npm audit --audit-level=high`
- Cache `node_modules` on `package-lock.json` hash. Target: under 4 minutes.

**2. Implement RedemptionEngine tests first** — PIN comparison (correct redeems, wrong returns error, already-redeemed is idempotent). Use Vitest + `supabase start` (local Postgres instance). These three tests are the change-safety floor for the entire product.

**3. Zod as single source of truth** — Derive all TypeScript types from `z.infer<>`. Never write a parallel `interface` that mirrors a Zod schema. Implement status enums as Zod literals: `z.enum(['sent', 'viewed', 'redeemed'])` and export `type CouponStatus = z.infer<typeof CouponStatusSchema>`.

**4. Playwright e2e for the two critical flows** — (1) sender: template selection → coupon editing → save → gift-ready screen with PIN, (2) recipient: open magic link → enter PIN → see redeemed stamp. Run against Vercel preview URL in CI after deploy.

**5. `ARCHITECTURE.md`** — Component dependency graph, data flow from template selection through coupon creation to redemption, and two non-negotiable invariants: PIN never in URL, `/give/[id]` never requires auth.

**6. Document Supabase RLS policies** — Add a `## Database Security` section to PRD or standalone `SUPABASE.md`: `coupon_sets` readable by owning `user_id`, `coupons` readable by anyone with parent `set_id` (for recipient page), redemption mutations scoped to sets matching PIN hash.

**7. `CouponSetBuilder` schema versioning** — Add `schemaVersion: 1` from day one. On hydration, check version and discard stale drafts rather than attempting to render them. Without this, changing the draft shape silently corrupts in-progress gifts.

### Long-Term Architecture (Ongoing)

- **Nested CLAUDE.md files** in `src/components/coupon/` (documenting locked visual invariants — shape, barcode, border, "Good for a ___" label — that must never be exposed as user-controlled props) and `src/lib/` (documenting that `templateRepository.ts` is read-only and `redemptionEngine.ts` is the only write path for coupon state)
- **Environment-variable feature flags** (`src/lib/flags.ts`) for Phase 2/3 features before those phases begin
- **Zod schema validation in CI** — script that parses all 40 seed data rows through the schema, catching drift before it reaches Supabase
- **Supabase type generation** — run `supabase gen types typescript` in CI and commit the output to `src/types/supabase.ts`, keeping DB types in sync automatically

---

## Start Fixing: agent-ready

If Documentation & Context scored below 60, the **agent-ready** companion plugin can close that gap now. It scaffolds CLAUDE.md, ARCHITECTURE.md, and a docs/ structure following progressive disclosure patterns, built on your actual codebase.

```
/plugin install agent-ready@dgalarza-workflows
```

It reads this assessment report and suggests which mode to run first based on your weakest dimensions.

---

## Want Help Moving the Needle?

This assessment was built by [Damian Galarza](https://www.damiangalarza.com?utm_source=codebase-readiness&utm_medium=report&utm_campaign=codebase-readiness) — a Claude Code specialist who helps engineering teams close the gap between having AI tools and actually using them well.

**[What each dimension means and how to interpret your score →](https://www.damiangalarza.com/codebase-readiness/?utm_source=codebase-readiness&utm_medium=report&utm_campaign=codebase-readiness)**

---

## Dimension Details

### Test Foundation & Feedback Loops

**Test Foundation — 5/100**

**Evidence:**
- Test-to-source file ratio: 0 / 0 — undefined; scored at floor
- Coverage configuration: absent (no `jest.config.*`, `vitest.config.*`, `package.json`)
- CI coverage enforcement: no
- Test pyramid: absent at all layers
- Flaky test signals: 0 (single commit)
- Mock/stub density: N/A
- Property-based testing: absent
- Mutation testing: absent

**Strengths:**
- PRD Testing Decisions section (lines 315–329) is behaviorally-framed and specific — names five modules with concrete test cases
- `PINVerificationModal`'s `onVerify(pin: string) => Promise<boolean>` callback design makes it trivially unit-testable with no Supabase mocking

**Gaps:**
- Zero infrastructure — no test runner, no coverage tool, no CI, no scripts
- No integration or e2e layer planned in the PRD testing strategy
- No coverage thresholds defined
- No `localStorage` test environment strategy for `CouponSetBuilder`

**Quick Wins (1-2 days):**
- Initialise with Vitest + `@testing-library/react` + `@testing-library/user-event` from day one; set `coverageThreshold: { lines: 70, branches: 70 }`
- Create empty test stubs (one per PRD test case) before writing any application code

**High-Value Investments (1-4 weeks):**
- Add Playwright for e2e: sender creation flow and recipient redemption flow
- Write RedemptionEngine tests first, before the UI, using a Supabase test client (`supabase start`) rather than mocks
- Configure `localStorage` mocking at the Vitest setup level before writing `CouponSetBuilder` tests

---

**Feedback Loops — 3/100**

**Evidence:**
- CI platform: none
- Estimated pipeline time: N/A
- Caching: absent
- Parallelization: absent
- Fail-fast: absent
- Pre-commit hooks: absent
- Coverage reporting: absent
- Security scanning: absent
- Dependency scanning: absent
- Ephemeral environments: absent (Vercel preview URLs available once connected — basis for 3 points)

**Strengths:**
- Vercel provides per-branch preview deployments at zero cost once connected to GitHub
- Supabase CLI (`supabase start`) provides fully isolated local Postgres per developer
- `/give/[id]` being unauthenticated means it can be tested against a preview URL directly without auth setup

**Gaps:**
- No pre-commit hooks (highest-leverage gap to close)
- No CI pipeline — no automated verification on any push
- No CLAUDE.md for agent orientation
- No `npm audit` baseline

**Quick Wins (1-2 days):**
- Create `CLAUDE.md` — how to run `npm run dev`, `npm test`, `supabase start`, and the five modules with their test file locations
- Set up Husky + lint-staged on the first `npm init`
- Connect GitHub repo to Vercel immediately for free preview deployments

**High-Value Investments (1-4 weeks):**
- GitHub Actions: three parallel jobs (typecheck, test, lint) + `npm audit --audit-level=high` + Dependabot config
- Playwright CI job running against the Vercel preview URL after deploy

---

### Documentation & Context — 28/100

**Evidence:**
- CLAUDE.md: absent
- ARCHITECTURE.md: absent
- ADRs: 0
- Topic docs: none (no CONVENTIONS.md, TESTING.md, DEPLOYMENT.md)
- README: absent
- Planning docs present: `PRD.md` (354 lines), `Kindness_Currency_Brief_Amendments_v1.md` (190 lines), `Kindness_Currency_Master_Brief.txt` (408 lines)
- Documentation CI: none

**Coherence:**
- 3 confirmed cross-document conflicts:
  1. PIN in URL (Master Brief allows it; PRD/Amendments forbid it)
  2. Template enum vs DB table (Master Brief mandates Zod enum; PRD/Amendments use `templates` + `template_coupons` tables)
  3. CTA copy ("100% free, always" vs "Start free")
- Precedence rule exists in prose but not enforced structurally
- Master Brief is not deprecated and contains implementable but wrong instructions
- Cross-document conflicts: 3 (all architecture-level)
- Source of truth clarity: ambiguous
- Broken references: none (no @-imports exist)
- CLAUDE.md role: N/A

**Strengths:**
- PRD.md contains implementation-ready SQL schemas, all 40 seed coupons with exact field values, exhaustive CTA copy registry (14 strings), design token hex values, explicit out-of-scope list, and behaviorally-framed testing decisions
- Amendments file uses explicit "Old → New" diff format with a declared precedence rule
- Module interfaces are described with actual signatures (`onVerify(pin: string) => Promise<boolean>`, `getActiveTemplates()`, `getTemplateWithCoupons(slug)`)

**Gaps:**
- No CLAUDE.md — highest-priority gap
- Master Brief is an active source of conflicting, wrong instructions
- No framework conventions documented (App Router rules, `'use client'` guidance, Supabase client pattern, env var names)
- No RLS policy documentation
- No test framework named (PRD says "unit test" but never names Vitest or Jest)
- Tailwind token config key structure unspecified (agent will invent key names)

**Quick Wins (1-2 days):**
- Create `CLAUDE.md` (80-120 lines) declaring PRD.md canonical and listing the 3 conflicts as explicit DO NOT rules
- Add deprecation banner to `Kindness_Currency_Master_Brief.txt`
- Create `.env.example` listing all required variable names

**High-Value Investments (1-4 weeks):**
- Add `## Framework Conventions` section to CLAUDE.md: App Router file conventions, when to add `'use client'`, Supabase client initialization pattern
- Create `ARCHITECTURE.md` with component dependency graph and two non-negotiable invariants
- Specify test framework and add `## Testing` section to CLAUDE.md referencing PRD testing decisions
- Document Supabase RLS policies in `SUPABASE.md`

---

### Code Clarity & Consistency

**Code Clarity — 72/100**

**Evidence:**
- Average file size: N/A (no source files)
- Files over 500 lines: 0 (modifier: +5 applied prospectively)
- God files: 0
- Catch-all directories: none exist yet
- Naming quality: excellent — 8 PRD modules have single-responsibility names; planned path `/src/schemas/couponSchema.ts` is specific

Score of 72 reflects sound PRD module design held back by an undecided directory structure. `CouponSetBuilder` and `AuthGate` are at risk of exceeding 300 lines without deliberate state/UI decomposition.

**Strengths:**
- PRD names every module with a single, unambiguous responsibility
- The 8-module breakdown maps naturally to ~8 component files — no god-file risk baked into the design
- CTA Copy Registry and Design System Tokens will naturally become separate constant files

**Gaps:**
- No directory structure decided yet — the first file created establishes a precedent
- `CouponSetBuilder` (state + localStorage + save mutation) and `AuthGate` (UI + OTP + post-auth save) are at risk of becoming large files without explicit hook extraction

**Quick Wins (1-2 days):**
- Create `CLAUDE.md` with module-to-filesystem mapping before any code is written
- Commit the directory skeleton (empty folders with `.gitkeep`) in the first PR

**High-Value Investments (1-4 weeks):**
- Extract `useCouponSetBuilder` as a custom hook (`hooks/useCouponSetBuilder.ts`) keeping state/localStorage logic separate from UI
- Extract `useShareGift` hook from `GiftReadyScreen` keeping sharing logic (WhatsApp URL, Web Share API) out of the component

---

**Consistency & Conventions — 5/100**

**Evidence:**
- Linter: absent (no `.eslintrc.*`, no `package.json`)
- Formatter: absent (no `.prettierrc*`)
- Pre-commit hooks: absent (only inactive `.sample` hooks in `.git/hooks/`)
- CI enforcement: none
- Custom/architectural linters: none

**Strengths:**
- `.gitignore` correctly excludes `node_modules/`, `dist/`, `build/`, `.env`, `.DS_Store`
- PRD mandates Zod validation for all mutations — a runtime consistency enforcer once implemented

**Gaps:**
- No `package.json` — no canonical entry point for any tooling
- No ESLint — every developer and agent styles by instinct
- No Prettier — code style will diverge immediately
- No pre-commit hook — violations reach the repo unchecked
- No `tsconfig.json` — TypeScript strict mode not enforced

**Quick Wins (1-2 days):**
- Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
- Set `"strict": true` in `tsconfig.json` immediately
- Add `.prettierrc` and configure Husky + lint-staged (auto-format on every commit)
- Add `no-restricted-imports` ESLint rule banning direct `@supabase/supabase-js` imports from components

**High-Value Investments (1-4 weeks):**
- Vercel CI lint gate via GitHub Actions: `npm run lint` + `tsc --noEmit` required before merge
- Zod schema validation script in CI: parse all 40 seed data rows through schema, catching drift

---

### Type Safety, Architecture & Change Safety

**Type Safety — 8/100**

**Evidence:**
- `tsconfig.json`: absent
- Runtime validation (Zod): planned in PRD at `/src/schemas/couponSchema.ts` — file does not exist
- `any` usage: N/A (no source files)
- CI enforcement: none
- DB constraints: strong design in PRD SQL (NOT NULL, REFERENCES ON DELETE CASCADE, UNIQUE on slug) — not yet applied

**Strengths:**
- PRD specifies Zod for all mutations — correct architecture for runtime boundary enforcement
- Status enums defined precisely: directly expressible as TypeScript union types and Zod literals
- PIN security model isolates the vulnerability surface: one server-side comparison point
- DB schema uses UUID PKs, CASCADE deletes, boolean guards — all enforceable at schema level

**Gaps:**
- Zero type infrastructure
- No runtime validation at any boundary
- No CI type enforcement
- `PINVerificationModal` callback signature (`onVerify(pin: string) => Promise<boolean>`) undeclared in any type file

**Quick Wins (1-2 days):**
- Create `tsconfig.json` with `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"noImplicitReturns": true`

**High-Value Investments (1-4 weeks):**
- Structure Zod as single source of truth: derive all TypeScript types from `z.infer<>`, never write parallel interfaces
- Add `tsc --noEmit` as a required CI check before any deployment

---

**Architecture Clarity — 5/100**

**Evidence:**
- Directory structure: flat (root-level planning docs only)
- Domain boundaries: none in filesystem
- Service layer: absent
- God files: 0
- Nested CLAUDE.md: 0
- Dependency explicitness: N/A

**Strengths:**
- PRD defines explicit module interfaces with clean dependency boundaries
- Two-route structure (`/create`, `/give/[id]`) is minimal and unambiguous
- Data flow direction is clear: CouponSetBuilder → AuthGate → save mutation → Supabase; RedemptionEngine is entirely server-side

**Gaps:**
- No `src/` or `app/` directory — no established home for any file
- No CLAUDE.md — no project-level instructions for any agent
- 8 PRD modules have no filesystem mapping yet

**Quick Wins (1-2 days):**
- Create `CLAUDE.md` with module-to-filesystem mapping
- Commit directory skeleton before writing any component

**Recommended directory structure:**
```
src/
  app/
    page.tsx                    # Home
    create/page.tsx             # /create
    give/[id]/page.tsx          # /give/[id]
  components/
    coupon/CouponCard.tsx       # Module 2
    builder/CouponSetBuilder.tsx + useCouponSetBuilder.ts  # Module 3
    modals/PINVerificationModal.tsx  # Module 4
    modals/AgeGate.tsx          # Module 7
    modals/AuthGate.tsx         # Module 6
    shared/GiftReadyScreen.tsx  # Module 8
  lib/
    templateRepository.ts       # Module 1 — read-only data access
    redemptionEngine.ts         # Module 5 — only write path for coupon state
  schemas/couponSchema.ts       # Zod (single source of truth)
  constants/ctaCopy.ts          # CTA Copy Registry as typed constants
  constants/designTokens.ts     # Tailwind token values
  types/supabase.ts             # Generated via supabase gen types
supabase/migrations/            # One file per schema change
supabase/seed.sql
```

**High-Value Investments (1-4 weeks):**
- Add nested CLAUDE.md in `src/components/coupon/` documenting locked visual invariants (shape, barcode, border, "Good for a ___" label — never exposed as props)
- Add nested CLAUDE.md in `src/lib/` documenting that `templateRepository.ts` is read-only and `redemptionEngine.ts` is the only write path

---

**Change Safety — 10/100**

**Evidence:**
- Co-change coupling: N/A (1 commit)
- Feature flags: absent
- Migration safety: SQL designed in PRD, no migrations directory exists
- Module boundaries: conventional (PRD) but not enforced
- `pin_code` storage: undefined in implementation — PRD permits plaintext string comparison (critical gap)
- `CouponSetBuilder` localStorage: no schema versioning strategy defined
- Rollback capability: unknown — no deployment pipeline

**Strengths:**
- `campaign_banners` DB-driven table avoids deploys for content changes — correct pattern
- PRD build order sequences highest-risk component (`/give/[id]`) first, in isolation
- `PINVerificationModal` callback inversion keeps blast radius of PIN verification implementation changes contained to `RedemptionEngine` only

**Gaps:**
- No tests — RedemptionEngine changes have no automated verification
- No CI — broken builds are invisible
- No feature flags for Phase 2/3 features
- `pin_code` storage strategy unspecified — plaintext storage is a security risk that is expensive to remediate post-launch
- `CouponSetBuilder` localStorage has no version field — schema changes will silently corrupt in-progress drafts

**Quick Wins (1-2 days):**
- Set up `supabase/migrations/` directory from the first schema change; never edit a migration post-apply
- Add to CLAUDE.md: "PIN codes stored as bcrypt hashes (10 rounds) using `bcryptjs`. Use `bcrypt.compare()`, never string equality."

**High-Value Investments (1-4 weeks):**
- Write three RedemptionEngine unit tests before implementing the engine (correct PIN redeems, wrong PIN errors, already-redeemed is idempotent)
- Add `schemaVersion: 1` to `CouponSetBuilder` localStorage schema from day one; discard stale drafts on version mismatch
- Add `src/lib/flags.ts` with typed environment-variable feature flags for Phase 2/3 before those phases begin:
  ```typescript
  export const flags = {
    phase2AnimatedReveals: process.env.NEXT_PUBLIC_FLAG_PHASE2 === 'true',
    phase3CorporateTier: process.env.NEXT_PUBLIC_FLAG_PHASE3 === 'true',
  } as const
  ```

---

## What "Agent-Ready" Means

AI agent work doesn't eliminate verification — it relocates it. Before agents, developers split time between writing, reading, and checking code. With agents, writing is offloaded. But every line an agent produces still needs to be verified against human intent, either by automated systems or by humans reading code.

An agent-ready codebase maximizes automated verification and minimizes the cost per change:

- **Tests are the oracle** — when an agent makes a change, the test suite tells it immediately whether that change matches intent. Without tests, every agent change requires a human to read and reason about correctness manually — which destroys scalability. A noisy oracle (flaky tests, heavily mocked suites) is nearly as bad as no tests.
- **Type systems reduce verifier noise** — a type-checked build that passes is a higher-confidence signal than an untyped build that passes. Types convert silent runtime failures into loud compile-time failures, so agent mistakes are caught before a human ever reviews them.
- **Documentation makes intent verifiable** — CLAUDE.md and ADRs give agents the context to produce changes that match business intent, not just syntactic correctness. Without documented intent, an agent's change can pass every automated check and still be wrong in ways only a human reviewer can catch.
- **Small files bound the verification surface** — when a change is contained to one focused file, a test failure is attributable and precise. Large files and high coupling produce noisy feedback.
- **Fast feedback enables iteration** — a 5-minute CI pipeline enables ~100 verification cycles per day. A 45-minute pipeline allows ~10. Pipeline speed is a structural prerequisite for agent work at scale.
- **Security and vulnerability scanning extends coverage** — functional tests verify behavior; security scanners verify a different correctness dimension that agents can silently violate.

**This project is at the ideal moment:** zero code means zero accumulated technical debt to undo. Spending Day 1 on CLAUDE.md, `create-next-app` with strict TypeScript, Husky hooks, and a two-job GitHub Actions workflow means every subsequent agent session operates with a complete verification loop. That investment costs one day; the alternative — retrofitting it across a growing codebase — costs weeks.

---

*Generated by codebase-readiness skill — claude-code-workflows*
*Assessment date: 2026-05-24*