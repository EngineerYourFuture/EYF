# Code Cleanup Report

_Generated 2026-07-17 · branch `develop` · baseline commit `0042e48`_

## Executive Summary

| Metric | Value |
| --- | --- |
| Files analyzed | 379 hand-written source files (~35.7k LOC, excluding generated Prisma client, `node_modules`, `.next`, `dist`, coverage) |
| Files modified | 19 |
| Files removed | 9 |
| Files added | 1 (`_field.tsx`, shared component extraction) |
| Net line change | **−1,291** (29 insertions, 1,320 deletions) |
| Code duplication | **0.80% → 0.47%** (26 → 14 clones) |
| Orphaned modules | **10 → 1** (the 1 remaining is a false positive) |

**The headline finding is that this codebase was already in very good shape.** It entered the audit with ESLint at zero warnings, TypeScript clean across all 6 packages, no circular dependencies, no commented-out code, and **zero `: any` in hand-written code**. The usual cleanup wins (unused imports, unused variables, `any` creep) were already enforced by CI and had nothing left to collect.

The real debt was in places lint cannot see: a **1,116-line orphaned dependency cluster** left behind by a landing-page redesign, and a component copy-pasted into **13 files**. Those two items account for essentially the entire line reduction.

### Verification (behavior preservation)

Every change was validated against a baseline captured **before** any edit:

| Check | Baseline | After cleanup |
| --- | --- | --- |
| `pnpm typecheck` | 6/6 pass | **6/6 pass** |
| `pnpm lint` | 0 warnings | **0 warnings** |
| `@eyf/types` tests | 46/46 pass | **46/46 pass** |
| `@eyf/api` tests | 134 pass / 1 fail | **134 pass / 1 fail** (identical, pre-existing — see Risk Assessment) |
| `apps/web` production build | exit 0 | **exit 0, 95 routes** |

To obtain a real test signal I started the Docker dev database, applied migrations and RLS. Integration tests went from **66 skipped** (no DB) to **134 passing**. No product source was changed to achieve this.

---

## Changes Made

### 1. Removed an orphaned landing-page cluster (9 files, 1,116 lines)

The landing page was rebuilt around new sections (`hero`, `fracture`, `ascent`, `proof`, `pillars`, `pricing`). The previous "Antigravity scroll-film" implementation was never deleted. These 9 files formed a closed subgraph that **only imported each other** — nothing outside referenced the root component.

**Files removed:**

| File | Lines |
| --- | --- |
| `apps/web/components/landing/scroll-film.tsx` | 477 |
| `apps/web/components/landing/video-hero.tsx` | 150 |
| `apps/web/components/landing/roadmap-3d.tsx` | 135 |
| `apps/web/components/landing/particle-field.tsx` | 121 |
| `apps/web/components/brand/eyf-animated-logo.module.css` | 73 |
| `apps/web/components/landing/landing-background.tsx` | 59 |
| `apps/web/components/landing/scroll-nav.tsx` | 37 |
| `apps/web/components/brand/eyf-animated-logo.tsx` | 33 |
| `apps/web/components/brand/eyf-mark.tsx` | 31 |

**How this was proven safe before deletion:**
- No static import of the cluster root (`ScrollFilm`) exists anywhere.
- No `next/dynamic`, `React.lazy`, or string-based import references them (checked explicitly — the only dynamic imports inside them were `await import("three")`, i.e. self-contained).
- No Playwright/e2e test references them.
- `git log -S` confirms `apps/web/app/page.tsx` **previously** imported `scroll-film` and no longer does — a supersession, not an unused-but-planned feature.
- Verified by a full production build afterwards (95 routes, exit 0).

> **Note:** `apps/web/components/AntigravityBackground.tsx` (467 lines) looks related and was **kept** — it is live, loaded via `next/dynamic` from `landing/ring-backdrop.tsx`. Deleting it would have broken the current landing page. This is the main trap in this area.

### 2. Extracted a component duplicated across 13 files

**Added:** `apps/web/app/(admin)/admin/content/_field.tsx`

A `Field` form-label wrapper was copy-pasted into all 13 admin content pages. I hashed every definition and confirmed all 13 were **byte-identical** before consolidating, so the rendered output is unchanged.

**Files modified** (each: removed the local `Field`, added `import { Field } from "../_field";`, normalized the trailing newline):

`assessment`, `career-tracks`, `communication`, `experiences`, `flashcards`, `internships`, `jobs`, `knowledge`, `mcq`, `problems`, `project-ideas`, `sims`, `theory-notes` — all under `apps/web/app/(admin)/admin/content/*/page.tsx`.

Placement follows the existing convention in that directory (`_tabs.tsx` already holds the shared sub-nav), keeping the blast radius inside the folder that uses it.

> **Deliberately NOT consolidated:** 5 other files define their own `Field` with **different** implementations — `app/(app)/mocks/page.tsx`, `app/(app)/roadmap/page.tsx`, `app/(app)/settings/page.tsx`, `app/org/page.tsx`, `app/(app)/mentors/apply/page.tsx`. They only share a name, not markup. Merging them would have changed the UI. See Risk Assessment.

### 3. `apps/api/src/lib/assessment-bank.ts`

- Removed `pickQuestions()` (legacy selector), `BY_AREA`, and the private `mulberry32()` PRNG it depended on — ~35 lines, zero references.
- **Why safe:** superseded by `pickQuestionsSource()` in `assessment-source.ts` (DB-first, identical 12/4/4 defaults), which every route now uses. `ASSESSMENT_BANK` (the data) is still the fallback pool and was **kept**.
- Rewrote the misleading file header, which still advertised an "adaptive picker" that no longer exists and didn't mention the file is now the DB fallback. It now describes reality: data only, selection lives in `assessment-source.ts`.

### 4. `apps/api/src/lib/communication-bank.ts`

- Removed `promptsByKind()` (3 lines, zero references) — superseded by `promptsSource()` in `communication-source.ts`.
- `COMMUNICATION_BANK`, `COMMUNICATION_KINDS`, `getPrompt`, and both types are used elsewhere and were kept.

### 5. `apps/web/components/motion.tsx`

- Removed `Stagger` and `StaggerItem` (31 lines) — a matched pair with zero references anywhere.
- `Reveal` is used by 4+ pages and was kept.

### 6. `apps/web/lib/readiness.ts`

- Removed the `rankActions` re-export wrapper and its now-unused `rankActionsShared` import.
- **Why safe:** it was an unused wrapper whose only purpose was a type assertion. The API imports `rankActions` from `@eyf/types` directly. The `GuidanceAction` type it referenced is still used by `use-guidance.ts` and was kept, as was the `computeReadiness` wrapper (used by `use-readiness.ts`).
- This removes one unnecessary abstraction **and** one unnecessary type assertion.

### 7. `apps/web/lib/score-memory.ts`

- Un-exported `lastSeenScore()` and `rememberScore()` — they are only used internally by `takeScoreDelta()`, which remains the module's single public entry point. Tightens the module boundary; zero behavior change.

---

## Potential Issues Found

### Security

**1. `orgDb()` — a documented tenant-isolation layer that is 100% unused. (High)**

`apps/api/src/lib/org-scoped.ts` states an explicit **"CODE-REVIEW RULE"**: org-scoped tables are *"NEVER queried with bare `prisma.x` inside org request handlers — always through `orgDb(orgId)`"*. In reality **`orgDb` has zero references** in the entire API. Every org route queries `prisma.*` directly.

I verified this is **not currently a data leak** — routes do isolate tenants, but by hand (e.g. `where: { id, orgId: req.orgCtx!.orgId }`) or via ad-hoc per-file guards like `courseInOrg()` in `org-learn.ts`, which correctly does check-then-update. The exposure is that layer 1 of a documented 3-layer defense **exists only as dead code**, and the invariant is enforced by nothing but reviewer memory. One forgotten `where` clause is a cross-tenant leak.

**I deliberately did not delete it.** Deleting the abstraction would erase the evidence of the intended architecture and silently cement the weaker hand-filtered pattern. The correct fix is arguably the opposite — adopt `orgDb()` in routes, per the rule the file already documents. That is an architectural decision for the owner, not a mechanical cleanup.

**2. The RLS tenant-isolation test cannot pass locally, and is a false negative. (High — test infrastructure)**

`orgs.integration.test.ts > "RLS backstop: an UNFILTERED query inside org A's context cannot see org B"` fails against the dev database. This is **not** a code defect and **not** caused by this cleanup — it fails identically on the untouched baseline.

Root cause: `docker-compose.yml` sets `POSTGRES_USER: eyf`, and the Postgres image makes that role a **superuser** (`rolsuper = t`, `rolbypassrls = t`). **Superusers bypass RLS unconditionally**, even with `FORCE ROW LEVEL SECURITY` (which `apply-rls.ts` correctly sets).

I proved the policy itself is sound by inserting two orgs' rows and querying under `SET LOCAL app.org_id = 'ORG_A'`:

| Connecting role | Rows visible (unfiltered query) | Verdict |
| --- | --- | --- |
| `eyf` (superuser — what tests use) | ORG_A **and ORG_B** | RLS bypassed → test fails |
| non-superuser (production-like) | **ORG_A only** | Policy works correctly |

So the security control is correct; the test guarding it is structurally unable to pass in this environment. The danger is that someone "fixes" the red test by weakening the assertion, destroying a genuine tenant-isolation guard. **Recommendation:** have the integration suite connect as a dedicated non-superuser role (grant `SELECT/INSERT/UPDATE/DELETE`, no `BYPASSRLS`) so the test exercises production-like conditions. _(All probe rows and the temporary role I created were removed; the database is back to its prior state.)_

**3. No exposed secrets found.** `.env` is git-ignored and contains only local placeholder credentials. `.env.example` carries no real values. `apply-rls.ts` uses `$executeRawUnsafe` for `SET LOCAL app.org_id`, but correctly guards the value with a `/^[a-zA-Z0-9_-]{1,64}$/` regex first (GUC values cannot be parameterized) — this is sound.

### Local environment hazards (not code)

**4. Two Postgres servers compete for port 5432 — tests can silently hit the wrong database. (High, DX)**

A Homebrew `postgresql@16` service binds `127.0.0.1:5432`/`[::1]:5432` while Docker binds the wildcard `*:5432`. **The more specific bind wins**, so `localhost:5432` resolves to Homebrew Postgres — even though `docker compose up -d` reports healthy containers. I hit this live mid-audit: the suite abruptly began failing with `permission denied for schema public`, and `SELECT version()` over the app's own connection string returned `PostgreSQL 16.13 (Homebrew)` instead of the container's `16.14`.

This is a silent-wrong-database failure mode: migrations, `db:rls`, and tests can all land on an unintended server. **Recommendation:** map the container to a non-conflicting host port (e.g. `5433:5432`) or stop the Homebrew service during development. _(I stopped the service only to verify tests, then restored it to `started` exactly as found.)_

**5. Local `.env` files have drifted from `.env.example`. (Medium, DX)**

- `.env`, `apps/api/.env`, and `packages/db/.env` all set `DATABASE_URL=postgresql://user:password@...`, but `docker-compose.yml` provisions `eyf:eyf`. The committed `.env.example` is **correct** (`eyf:eyf`) — the working copies are stale.
- `packages/db/.env` is missing `DIRECT_DATABASE_URL`, which `prisma/schema.prisma:19` requires, so `pnpm db:migrate`/`db:deploy` fail with `P1012` out of the box. `.env.example:11` defines it correctly.

I did **not** modify any `.env` (that would be a config/behavior change); I passed correct values inline for verification only. Re-syncing local `.env` files from `.env.example` would fix the out-of-box migration path.

**6. Integration tests leak fixture rows.** Three `@test.eyf` users (`path_idle_*`) persisted in the database after the suite ran. Minor, but it accumulates and can cause cross-run interference — the suite already disables parallelism (`fileParallelism: false`) because of shared-fixture races.

### Performance

**7. `judgeQueueEvents` is unused but has runtime side effects — do not "clean" it. (Medium)**

`apps/api/src/jobs/queue.ts:16` exports `new QueueEvents("judge", { connection: redis })`, referenced nowhere. It looks like textbook dead code, **but instantiating it opens a Redis subscriber connection at import time**. Removing it would change runtime behavior (one fewer Redis connection and no job-lifecycle subscription), so I left it. Worth an explicit decision: either it is needed, or it is an idle Redis subscriber consuming a connection on every boot.

**8. Performance posture is otherwise healthy.** The heavy 3D work (`three`) is already correctly code-split behind `next/dynamic` with `ssr: false`, and `roadmap-3d` degraded gracefully without WebGL. I found no unnecessary re-render/effect/state patterns worth changing that wouldn't risk behavior. No redundant API calls found — data fetching goes through SWR (`use-api.ts`), which dedupes by design.

### Maintainability

**9. Large files.** See "Files That Need Future Refactoring" below.

**10. High volume of non-null assertions in the API (271 occurrences).** Overwhelmingly `req.orgCtx!` and `req.session!` — a consequence of Fastify request decoration not being reflected in the type. This is a consistent, intentional pattern, not sloppiness. Fixing it properly means typing the decorated request (e.g. module augmentation in `augment.d.ts`, which already exists). I left it: 271 mechanical edits carry real regression risk for zero runtime benefit.

**11. Remaining "unused" exports/types (14 exports, 57 types) were left intentionally.** Nearly all are types used *within their own file* — knip flags exports not imported *elsewhere*. Stripping `export` from a types-heavy codebase is churn with no runtime effect and a real chance of breaking a future import. The genuinely dead *runtime* ones I removed are listed above.

**12. Unwired product features (report-only).** These have zero references and are dead by strict definition, but each represents product capability that appears staged rather than abandoned. Deleting them is a product decision, not cleanup:

- `services/email.ts` → `welcomeEmail` (an email template that is never sent)
- `services/anthropic.ts` → `generateHint` (AI hint generation, never called)

### Confirmed clean

- **No circular dependencies** (madge, `apps/web` and `apps/api`).
- **No commented-out code** (the only matches were legitimate prose).
- **No `: any` in hand-written code** (all 242 occurrences are in the generated Prisma client). Only 2 `as any` exist, both at justified third-party SDK boundaries (`auth.ts` Clerk webhook payload, `payouts.ts` Razorpay SDK).

---

## Dependency Recommendations

**Not uninstalled — recommendations only, per instructions.**

### Unused packages

- **`clsx` in `apps/web/package.json`** — the only genuine one. Zero imports in `apps/web`. `packages/ui` correctly declares its own `clsx` dependency for `cn.ts`, so removing it from the web app is safe.

### Duplicate packages

- None found. `pnpm.overrides` already pins `ioredis@5.10.1` to prevent duplication.

### Packages to review (flagged by tooling, but **false positives — do not remove**)

| Package | Why it looks unused | Why it must stay |
| --- | --- | --- |
| `@prisma/client` (`packages/db`) | No direct import in `src` | Required at runtime by the generated client, which `src/index.ts` re-exports. Removing it breaks every query. |
| `pino`, `pino-pretty` (`apps/api`) | Never `import`ed | Referenced as a **transport target string** in `app.ts:26` (`{ target: "pino-pretty" }`), resolved at runtime by Fastify's logger. |
| `three`, `@react-three/fiber` (`apps/web`) | — | Still used by the live `AntigravityBackground.tsx` and `viz/*`. I checked this specifically, since deleting the landing cluster removed several `three` consumers. |

### Outdated patterns

- **Prisma 5.22 → 7** is available; the CLI prints a major-version upgrade notice on every command. Given the RLS/`directUrl` setup and the generated-client re-export pattern, this warrants a deliberate migration rather than a bump.
- `load/k6-smoke.js` is reported as an orphan by knip but is **not** dead — it is executed externally (`k6 run load/k6-smoke.js`, documented in its own header). No action.

---

## Files That Need Future Refactoring

### High

- **`apps/web/app/(app)/orgs/page.tsx` (787 lines)** — by far the largest file, ~2× the next. A single route file this size almost certainly mixes several org surfaces with data fetching and local state. Prime candidate for splitting into section components.
- **`apps/api/src/lib/org-scoped.ts` — adopt or retire `orgDb()`.** Not a size problem but the highest-value structural work: a documented security invariant currently enforced by nothing. See Security #1.
- **The RLS test's database role.** See Security #2 — a permanently-red isolation test invites someone to weaken the assertion.

### Medium

- **`apps/web/components/AntigravityBackground.tsx` (467 lines)** — a self-contained WebGL scene. Cohesive, but it mixes scene setup, animation, and the React wrapper; the dead `roadmap-3d`/`particle-field` files that duplicated its patterns are now gone, so this is the single remaining place that logic lives.
- **`apps/web/app/(app)/dashboard/page.tsx` (393)**, **`today/page.tsx` (375)**, **`mcq/page.tsx` (351)**, **`communication/page.tsx` (293)** — large client route files. The `assessment`/`mcq` pair still shares two clones (17 and 22 lines) that jscpd flags; a shared quiz-runner hook is the obvious extraction, but the two flows differ enough that I did not attempt it blind.
- **`apps/api/src/routes/org-learn.ts` (274)**, **`admin-content.ts` (272)**, **`orgs.ts` (271)** — long route modules; splitting by resource would help, though they read cleanly today.

### Low

- **`apps/web/app/(app)/games/spatial|stroop`** — 2 small clones (16 and 13 lines) of game-loop scaffolding.
- **`apps/web/app/(auth)/sign-in|sign-up`** — a 15-line clone. This is Clerk boilerplate; the duplication is idiomatic and I would leave it.
- **`apps/api/src/middleware/org.ts`** — a 13-line self-clone (lines 29–41 vs 60–72), two similar guard paths that could share a helper.
- **Integration test fixture setup** — `mkUser` is repeated across ~11 integration test files (a 15-line clone). A shared test factory would help, but test duplication is low-risk and often deliberate.

---

## Metrics

| Metric | Value |
| --- | --- |
| Lines removed | **1,320** (29 added → **net −1,291**) |
| Duplicate code removed | 151 lines of clones; duplication **0.80% → 0.47%**, clones **26 → 14** |
| Unused imports removed | 1 (`rankActionsShared`) — the repo was already lint-clean, so there were no others to find |
| Unused variables removed | 0 (already enforced at zero by `--max-warnings 0`) |
| Unused functions/components removed | **17** — `Stagger`, `StaggerItem`, `rankActions`, `pickQuestions`, `mulberry32`, `BY_AREA`, `promptsByKind`, and 10 of the 13 duplicate `Field` copies' worth of dead definitions |
| Orphaned files removed | **9** (1,116 lines) |
| Files improved | 19 modified + 1 added |
| Functions simplified | 2 (`assessment-bank`, `communication-bank` reduced to data + used accessors) |
| Components simplified | **13** admin pages (local `Field` → shared import) |
| Type assertions removed | 1 (`rankActions as (…)`) |
| Misleading comments fixed | 1 (`assessment-bank.ts` header) |
| Module boundaries tightened | 3 exports un-exported (`lastSeenScore`, `rememberScore`, plus removed re-export) |
| `any` types eliminated | 0 — **none existed** in hand-written code |
| Circular dependencies removed | 0 — **none existed** |

---

## Risk Assessment

Areas where cleanup was **intentionally skipped** because it could alter behavior:

1. **`judgeQueueEvents` (`jobs/queue.ts`)** — unused export, but a module-level `new QueueEvents(...)` that opens a Redis subscriber on import. Removing it is a runtime behavior change disguised as dead-code removal. **Left intact.**

2. **`orgDb()` (`lib/org-scoped.ts`, ~46 lines)** — genuinely unreferenced, but it is a security abstraction whose disuse is itself the finding. Deleting it would cement the weaker pattern and hide the gap. **Left intact; escalated as the top finding.**

3. **The 5 divergent `Field` components** (`mocks`, `roadmap`, `settings`, `org`, `mentors/apply`) — same name, **different markup** (verified by hashing). Consolidating them would change the UI. **Left intact.**

4. **`welcomeEmail`, `generateHint`** — zero references, but they are unwired *product features*, not accidental dead code. Removing them deletes capability someone likely intends to ship. **Left intact; reported.**

5. **271 non-null assertions in the API** — a deliberate, consistent pattern around Fastify request decoration. Rewriting them is a large mechanical diff with real regression risk and no runtime benefit. **Left intact.**

6. **57 unused exported types / 14 unused exports** — mostly used within their own files. Removing `export` is churn with no runtime effect. **Left intact.**

7. **`ASSESSMENT_BANK` and `COMMUNICATION_BANK` data** — flagged as legacy but still the live fallback when the DB has no staff-authored rows. **Kept**, while removing only the superseded *selector* logic around them.

8. **All `.env` files, `docker-compose.yml`, and DB roles** — the credential drift, missing `DIRECT_DATABASE_URL`, superuser RLS bypass, and port conflict are all real problems, but fixing them means changing configuration and authentication/DB-role behavior, which is out of scope. **Reported, not changed.** The one service I stopped (Homebrew Postgres, to verify tests) was **restored to `started`**, and all temporary DB probe rows and roles were removed.

9. **`load/k6-smoke.js`** — reported as orphaned by tooling, but invoked externally by the `k6` binary. **Left intact.**

**No business logic, API contract, database schema, authentication flow, UI behavior, or route was changed.** Every removal was either provably unreferenced (verified via static imports, dynamic/lazy imports, string references, e2e tests, and git history) or provably identical to the code it was consolidated into (verified by hashing).

---

## Final Summary

**Overall assessment: this is a well-maintained, genuinely high-quality codebase** — noticeably better than typical for its size and velocity. The evidence is objective rather than impressionistic: zero ESLint warnings under `--max-warnings 0`, TypeScript clean across 6 packages, **no `any` in hand-written code**, no circular dependencies, no commented-out code, and duplication under 1% before this pass. The comments that exist are unusually good: they explain *why* (the `trustProxy` hop-count rationale, the `SET LOCAL` pooling note, the RLS `ORG_TABLES` invariant), which is the hard kind to write.

The debt that existed was almost entirely **one shape: things left behind after a rewrite.** The landing redesign shipped without deleting its predecessor (1,116 lines), and the DB-backed content "source" layer superseded the in-memory "bank" selectors without removing them. Both are the natural residue of moving fast, and both were mechanically safe to remove once verified. The `Field` duplication is the same story at component scale.

### Remaining technical debt, in priority order

1. **`orgDb()` is dead code, and its documented "CODE-REVIEW RULE" is enforced by nothing.** Tenant isolation currently rests on every route author remembering to hand-write `orgId` filters. It is correct *today* — I checked — but it is one forgotten `where` clause away from a cross-tenant leak, and the safety net built for exactly this is unused. **This is the most valuable thing to fix in the repo.**
2. **The RLS test is a false negative and permanently red locally.** The policy is provably correct, but the dev superuser bypasses it. A red test that "everyone knows is fine" is how a real regression eventually ships. Point the suite at a non-superuser role.
3. **Local dev environment is booby-trapped**: two Postgres servers fight over port 5432 (silently routing to the wrong database), `.env` credentials don't match `docker-compose`, and `DIRECT_DATABASE_URL` is absent so migrations fail out of the box. None of this is production risk, but it costs every developer — and me, mid-audit — real time.
4. **`orgs/page.tsx` at 787 lines** is the clearest structural outlier.

### Recommended next priorities

1. Decide `orgDb()`: **adopt it** in org routes (my recommendation — it makes the documented rule real and is mechanical, route by route), or delete it and rewrite the comment to describe what the code actually does. The current state is the worst of both.
2. Give the integration suite a non-superuser DB role so the RLS test does real work.
3. Re-sync local `.env` from `.env.example` and move the container to port `5433`.
4. Remove `clsx` from `apps/web/package.json`.
5. Split `orgs/page.tsx`, then look at the `assessment`/`mcq` shared quiz-runner.
6. Plan the Prisma 5 → 7 migration deliberately.

**Bottom line:** the cleanup removed ~1,300 lines of genuinely dead code and halved duplication without touching a single line of business logic — verified by an unchanged test baseline (134 passing) and a clean 95-route production build. The most important output of this audit is not the deleted code, though; it is finding **`orgDb()`** — a security abstraction the codebase documents, relies on rhetorically, and never actually calls.
