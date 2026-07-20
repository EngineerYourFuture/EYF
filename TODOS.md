# EYF — Hardening Backlog

Backlog-ready specs surfaced by the gstack review pass (2026-07-20:
health / review / cso / devex / plan-eng-review / qa / plan-ceo-review).
Each item is scoped enough to pick up and implement. Priority order.

---

## HARD-1 — Make RLS tenant isolation live for all org routes  `[PARTIAL 2026-07-20 · remaining: route adoption]`

**DONE (2026-07-20): the backstop mechanism is fixed and proven.** `orgDb()` now runs
every query through `withOrgContext` (a transaction with `SET LOCAL app.org_id`), so the
sanctioned repository path provides BOTH the `orgId` filter AND a live RLS backstop —
previously it was filter-only and RLS stayed dormant (context never set). Proven by
`apps/api/src/lib/rls-isolation.integration.test.ts` (4 tests, live DB, non-superuser
role): a wrong-tenant read by exact id inside `withOrgContext(A)` returns null, a
no-filter `findMany` returns only org-A rows, and the same row IS visible with no context
(proving RLS — not the app filter — does the blocking). The earlier "SET LOCAL in
middleware" idea was rejected: `SET LOCAL` needs a transaction, and Prisma's pool would
scatter the context across connections — it would look fixed while isolating nothing.

**REMAINING (the real exposure): route adoption.** `withOrgContext`/`orgDb` is still
imported by only ~1-2 of 10 org route files; the rest (`org-learn`, `org-hire`,
`org-assess`, `org-certificates`, `org-paths`, `org-skills`, `org-ai`, `org-settings`,
`org.ts`) hit raw `prisma` on org tables, so RLS stays dormant for them and isolation
rests on the manual `where`. Now that the backstop is proven, this is mechanical: route
org-table access through `orgDb()` (extend `orgDb` to cover the tables those routes use —
courses, requisitions, slots, blueprints, etc.). Ties into HARD-3.

**Why it matters.** The B2B LMS gates Elite-tier internship access; a cross-tenant leak is
a deal-ending incident. One-way door — close before B2B pilots.

**Acceptance criteria (remaining).**
- `orgDb` covers every org-scoped table the 9 raw-prisma routes touch; those routes adopt it.
- The isolation test is extended to the newly-covered tables.
- No regression: full suite stays green.

**Files.** `apps/api/src/lib/org-scoped.ts` (extend coverage), the 9 org route files,
`apps/api/src/lib/rls-isolation.integration.test.ts`.
**Effort remaining.** human ~1 day / CC ~30-45 min (mechanical, backstop already proven).

---

## HARD-2 — Close the RLS gap on nullable-orgId tables  `[P2 · security · S]`

**Context.** `apply-rls.ts` applies the `org_isolation` policy to 16 tables listed in
`packages/db/scripts/rls-tables.ts`, all of which have a non-null `orgId`.

**Problem.** Two tables carry a **real but nullable** `orgId` and are excluded because the
simple equality policy would break their B2C (null-orgId) rows:
`certificates` (`Certificate.orgId String?`) and `skill_evidence`
(`SkillEvidence.orgId String?`). When those rows ARE org-scoped they have only route-level
filtering — and `certificates` is reachable through the public `/verify/[code]` route.

**Proposed change.** Add a null-aware policy variant for these two tables:
`USING (current_setting('app.org_id', true) IS NULL OR current_setting('app.org_id', true) = ''
OR "orgId" IS NULL OR "orgId" = current_setting('app.org_id', true))`.
B2C (null) rows always pass; org rows isolate under an org context. If route-level
filtering is intentionally the only guard, document that decision inline in `rls-tables.ts`
instead so the next reader doesn't assume RLS covers them.

**Acceptance criteria.**
- `certificates` and `skill_evidence` either get the null-aware policy (with a test proving
  a null-orgId row is visible with no context AND an org row is hidden under a foreign
  context) OR an explicit documented exclusion.
- `db:rls:verify` still passes.

**Files.** `packages/db/scripts/apply-rls.ts`, `packages/db/scripts/rls-tables.ts`,
`packages/db/scripts/verify-rls.ts`.
**Effort.** human ~2 hr / CC ~15 min.

---

## HARD-3 — Extract business logic out of fat routes into services  `[P3 · maintainability · incremental]`

**Context.** 55 of 61 route files call `prisma` directly; `orgs.ts` has 24 inline prisma
calls in 272 lines. Business logic, data access, and validation are colocated in routes.
The `services/` layer (31 files) exists but routes bypass it. This is why the coverage work
had to extract pure functions out of DB wrappers to make them testable.

**Problem.** Not a bug — a testability and change-safety tax. Route-embedded logic can't be
unit-tested without standing up HTTP + auth + DB, and duplicated query shapes drift.

**Proposed change (incremental, NOT a big-bang refactor).** Adopt the "make the change easy,
then make the change" rule: when you next touch an org/route handler, first extract its
data-access + logic into a `services/` function (pure where possible, `orgDb()`-scoped for
org data), then change it. No standalone refactor PR — fold it into feature work.

**Acceptance criteria (per touched route, ongoing).**
- New/modified handler logic lives in a `services/` function with its own unit test.
- Org data access goes through `orgDb()` (ties into HARD-1).

**Files.** `apps/api/src/routes/*.ts` → `apps/api/src/services/*.ts` (incremental).
**Effort.** amortized across future feature work; no dedicated estimate.

---

## HARD-4 — Graceful WebGL-unavailable fallback for the 3D background  `[DONE 2026-07-20]`

**Context.** `apps/web/components/AntigravityBackground.tsx` renders a Three.js /
react-three-fiber Canvas. QA (headless, no GPU) hit
`THREE.WebGLRenderer: Error creating WebGL context`, which propagated to a React error
boundary and crashed the Canvas subtree.

**Problem.** Real users on WebGL-blocked browsers, locked-down enterprise machines, or old
hardware would hit the error boundary instead of graceful degradation. Pre-existing (not a
regression), low frequency, but a poor first impression on the landing/pricing pages.

**Proposed change.** Detect WebGL support before mounting the Canvas (a small
`isWebGLAvailable()` check) and render a static gradient/CSS fallback when it's absent, so
the page degrades instead of erroring.

**Acceptance criteria.**
- With WebGL unavailable, the page renders a styled fallback and logs nothing to the error
  boundary.
- A test (or Storybook/story) covers the no-WebGL branch.

**Files.** `apps/web/components/AntigravityBackground.tsx`.
**Effort.** human ~2 hr / CC ~15 min.

---

## HARD-5 — Gate test-only security bypasses on an explicit flag, not NODE_ENV  `[DONE 2026-07-20]`

**Context.** Two controls short-circuit on `NODE_ENV === "test"`: the SSRF guard
(`apps/api/src/lib/ssrf.ts:41`) and the rate limiter
(`apps/api/src/app.ts:74-78`, `max` returns `1_000_000`).

**Problem.** Correct for the suite and safe in prod (`NODE_ENV=production`), but coupling a
security control's off-switch to the env-name means a deploy misconfigured with
`NODE_ENV=test` silently disables both. Not attacker-triggerable; purely operational risk.

**Proposed change.** Gate the bypass on a dedicated boolean env var (e.g.
`DISABLE_SSRF_GUARD`, `DISABLE_RATE_LIMIT`), default `false`, set only in the test env, so
no production value of `NODE_ENV` can turn the control off.

**Acceptance criteria.**
- Bypasses read the dedicated flag; `NODE_ENV` no longer controls them.
- Tests set the flag explicitly; suite stays green.

**Files.** `apps/api/src/lib/ssrf.ts`, `apps/api/src/app.ts`, `apps/api/src/env.ts`.
**Effort.** human ~1 hr / CC ~10 min.

## HARD-6 — Rank the internship flywheel on a materialized Readiness Index (not XP)  `[P2 · flywheel · M]`

**Context.** The internship merit-gate already exists: `GET /org/student/internships`
(`apps/api/src/routes/org.ts:128`, rendered by `components/internship-exchange.tsx`)
ranks Elite members and sets `inContention = eliteRank <= slot.seats` with a
`spotsFromCutoff` gap. It ranks on stored `UserProfile.currentXp` (`orderBy currentXp
desc`) — cheap, but XP is a proxy.

**Problem.** XP is not the Readiness Index the flywheel narrative sells ("grind
readiness to climb"). The ranking that gates scarce internship seats should be on the
real, moat metric — otherwise a student can top the ranking on activity volume without
being the most placement-ready.

**Proposed change.** Add a cron (`apps/api/src/jobs/`) that periodically computes each
Elite member's Readiness Index (`computeUserReadiness`) and writes it to a materialized
column (`UserProfile.readinessIndex Int` + `rankedAt`). Change `org.ts:128`'s ranking
`orderBy` from `currentXp` to the materialized column — no per-request O(N) recompute.
While there, extract the inline ranking (`orderBy` + `findIndex` + `inContention`) into
a small **tested** pure helper, since it is currently untested inline logic.

**Acceptance criteria.**
- Elite members carry a materialized readiness score refreshed on a schedule.
- `/org/student/internships` ranks on it; the extracted ranking helper has unit tests.
- No regression in `internship-exchange` rendering.

**Files.** `packages/db/prisma/schema.prisma` (UserProfile column + migration),
`apps/api/src/jobs/*`, `apps/api/src/routes/org.ts`, a new tested ranking helper.
**Effort.** human ~1 day / CC ~30 min.

## HARD-7 — Self-host Monaco instead of the jsdelivr CDN  `[P3 · resilience · M]`

**Context.** The code editor (`@monaco-editor/react`, `apps/web/app/(app)/problems/[slug]/page.tsx`)
loads Monaco (JS + `editor.main.css`) from `cdn.jsdelivr.net` at runtime. CSP now
allows it (fixed), but the editor still depends on a third-party CDN being reachable.

**Problem.** EYF's users are on Indian college/campus networks that sometimes block
or throttle public CDNs. If jsdelivr is unreachable, the core practice editor breaks
entirely — the single worst place for a hard dependency.

**Proposed change.** Bundle `monaco-editor` locally (it's already a transitive dep):
configure `@monaco-editor/react`'s loader to use the local package (`loader.config({ monaco })`)
with the Next.js webpack setup (e.g. `monaco-editor-webpack-plugin` or serving `vs/` from
`public/`). Removes the runtime CDN dependency; editor works offline / on locked-down
networks. Also lets CSP drop the jsdelivr allowance.

**Acceptance criteria.**
- The editor loads with the network's CDN access blocked (verify with jsdelivr blocked).
- `style-src`/`script-src` no longer need `cdn.jsdelivr.net` / broad `https:` for Monaco.

**Files.** `apps/web/app/(app)/problems/[slug]/page.tsx`, `apps/web/next.config.mjs`.
**Effort.** human ~half day / CC ~30 min.
