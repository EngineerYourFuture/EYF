# EYF — Hardening Backlog

Backlog-ready specs surfaced by the gstack review pass (2026-07-20:
health / review / cso / devex / plan-eng-review / qa / plan-ceo-review).
Each item is scoped enough to pick up and implement. Priority order.

---

## HARD-1 — Make RLS tenant isolation live for all org routes  `[P1 · security · S]`

**Context.** Tenant isolation has three layers: (1) `requireOrgMember`/`requireOrgCapability`
authz middleware, (2) hand-written `where: { orgId }` filters, (3) a Postgres RLS
backstop (`org_isolation` policy, `packages/db/scripts/apply-rls.ts`). The RLS policy is
an escape-hatch tripwire: it only isolates when the request has run
`SET LOCAL app.org_id = …`, which today happens **only** inside
`withOrgContext()` (`apps/api/src/lib/org-scoped.ts`).

**Problem.** `withOrgContext` is imported by exactly **1 of 10** org route files
(`apps/api/src/routes/orgs.ts`). The other nine (`org-learn`, `org-hire`, `org-assess`,
`org-certificates`, `org-paths`, `org-skills`, `org-ai`, `org-settings`, `org.ts`) hit the
raw `prisma` client, so `app.org_id` is never set and RLS passes every row. The
`requireOrgMember`/`requireOrgCapability` middleware sets `req.orgCtx` (a JS object) but
NOT the DB session var. Net: for 90% of org data access, isolation rests entirely on the
manual `where` filter — one forgotten filter is a cross-tenant leak with no backstop.
The `orgDb()` repository that would inject `orgId` automatically has zero route adoption.

**Why it matters.** The B2B LMS gates Elite-tier internship access; a cross-tenant leak is
a deal-ending incident. Cheapest to close now, before B2B pilots. One-way door.

**Proposed change.** Set the RLS context once, at the org-authz middleware boundary, so
every org route is covered regardless of which client it uses. In
`apps/api/src/middleware/org.ts`, after resolving an ACTIVE member, run
`SET LOCAL app.org_id = <orgId>` on the request-scoped connection (or route org requests
through a transaction that does). Keep `withOrgContext` for the explicit-transaction cases.

**Acceptance criteria.**
- An integration test proves an org-scoped request with a mismatched `app.org_id` returns
  zero rows for each of the 16 `ORG_TABLES` (extend `org-scoped.integration.test.ts`).
- All 10 org route files exercise a path where RLS is active (context set), verified by a
  test that unsets the manual `where` and confirms RLS still blocks cross-tenant reads.
- No regression: existing 401 tests stay green.

**Files.** `apps/api/src/middleware/org.ts`, `apps/api/src/lib/org-scoped.ts`,
`apps/api/src/lib/org-scoped.integration.test.ts`.
**Effort.** human ~1 day / CC ~30 min.

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

## HARD-4 — Graceful WebGL-unavailable fallback for the 3D background  `[P3 · resilience · S]`

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

## HARD-5 — Gate test-only security bypasses on an explicit flag, not NODE_ENV  `[P4 · hardening · XS]`

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

## HARD-6 — Materialize a Readiness Index for internship ranking  `[P2 · flywheel · M]`

**Context.** The internship merit-gate (`GET /internships/standing`,
`services/internship-ranking.ts`) ranks the consented talent pool to decide who
clears the open-Elite-seat cutoff. v1 ranks on stored `UserProfile.currentXp` (a
cheap single indexed read) because the real Readiness Index is computed per-user
(`computeUserReadiness`) and recomputing it for the whole cohort per request would
be O(N) heavy.

**Problem.** XP is a proxy, not the Readiness Index the flywheel narrative sells
("grind readiness to climb"). Ranking should be on the real, moat metric.

**Proposed change.** Add a cron job (`apps/api/src/jobs/`) that periodically computes
each consented student's Readiness Index and writes it to a materialized column
(e.g. `UserProfile.readinessIndex Int`) plus a `rankedAt` timestamp. Point the
`standingFor` cohort at that column. The pure engine is signal-agnostic — swapping
`score: currentXp` → `score: readinessIndex` is a one-line change in the route.

**Acceptance criteria.**
- Consented students carry a materialized readiness score refreshed on a schedule.
- `GET /internships/standing` ranks on it; no per-request O(N) readiness recompute.
- `internship-ranking.ts` tests unchanged (engine is signal-agnostic).

**Files.** `packages/db/prisma/schema.prisma` (UserProfile column + migration),
`apps/api/src/jobs/*`, `apps/api/src/routes/internships.ts`.
**Effort.** human ~1 day / CC ~30 min.
