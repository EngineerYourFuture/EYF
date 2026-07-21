# Known Issues

Live register of known defects, risks, and drift. Each entry: what, evidence, severity,
and status. Fixed items move to `CHANGELOG.md`. Last reviewed: 2026-07-21.

## Open

### KI-1 — Large unmerged branch drifting from `main` · High
`chore/sonar-coverage-hardening` is ~83 commits ahead of `main` and now contains major
product work (Proof Loop Phase 1 + 2, security + design fixes), not "chore/sonar." Risk:
merge conflicts, no PR review, single-branch failure loses a lot of work. **Action:** land as
a reviewed PR (or split into themed PRs); rename to reflect real content.

### KI-2 — Dependency advisories · triaged 2026-07-21 (partially resolved)
`pnpm audit` triage by production-vs-dev surface:
- **Fixed this pass (safe in-major overrides, verified green):** `form-data`→4.0.6 (CRLF),
  `@xmldom/xmldom`→0.8.13, `axios`→1.18.1. Highs dropped 34→27.
- **Accepted (not a production exposure; force-bump would be reckless):** the 4 "critical"
  advisories are **Vitest** (devDependency — the RCE is its dev UI server, which EYF never runs)
  and **node-tar** (pulled by `cacache`/build tooling, not exercised on untrusted archives at
  runtime). The fixes are risky majors — vitest is `^2.1.8` and latest is **4.x** (a double-major
  test-framework migration), and forcing tar 6→7 could break cacache. Trading real breakage risk
  for zero security gain is the wrong call, so these are consciously **accepted**, not forced.
  Revisit vitest 2→4 as its own planned migration if/when the framework is upgraded for other reasons.
- **Real production item → tracked separately as [KI-7](#ki-7--nextjs-14--15-security-upgrade--high).**

### KI-7 — Next.js 14 → 15 security upgrade · High
`apps/web` runs **Next 14.2.35**; multiple high-severity advisories (HTTP request
deserialization DoS, Server Components DoS, image-optimizer DoS/cache issues) are patched only
in **Next ≥15.x**. This is the one genuine production exposure among the audit findings, and
the fix is a **major-version migration** (async request APIs, caching-default changes), not a
bump. **Action:** scope as a dedicated upgrade project with its own review + regression pass.

### KI-3 — `PRODUCT-ROADMAP.md` status marks are stale · Medium
Some feature statuses predate recently shipped work (Offer Predictor engine, Proof Loop), so
⬜/🟡 marks understate reality. **Action:** reconcile each status against code (a verification
pass, tracked separately from routine roadmap edits).

### KI-4 — Test coverage ~64% · Medium · IN PROGRESS (roadmap below)
The shape is healthy: **business-logic services are ~100% covered**; the gap is thin HTTP route
handlers. Chase *risk*, not the percentage. Prioritized roadmap (integration tests, `app.inject`
+ DB pattern):

- **Tier 1 — trust / money / execution — ✅ COMPLETE:**
  - `score.ts` 17%→100% — public score verify (`score.integration.test.ts`).
  - `submissions.ts` 30%→100% — daily-cap + premium gate (402s) + ownership; judge queue mocked
    (`submissions.integration.test.ts`).
  - `me.ts` — GDPR/DPDP export + erasure (`me-privacy.integration.test.ts`) + referral/self-report.
  - `org.ts` routes 16%→84% — employer-portal auth boundary (`org-portal.integration.test.ts`).
- **Tier 2 — important product paths:** `resume.ts` 40%→81% ✅ (CRUD + ownership + ATS).
  `mcq.ts` + `leaderboard.ts` — public contracts + scope-resolution + param validation covered
  (`mcq`/`leaderboard.integration.test.ts`); the heavy auth'd flows (mcq start/submit, per-metric
  leaderboard building) are deferred — they need substantial data seeding for lower-risk code.
  Remaining: `mocks.ts` (31%), `mentors.ts` (32%), `roadmap.ts` (57%). **Diminishing returns from
  here** — the risk-worthy paths are covered; prioritize other work over chasing the percentage.
- **Tier 3 — low-risk display/utility (accept as-is or smoke-test only):** `fun.ts` (20%),
  `wrapped.ts` (24%), `missions.ts` (40%), `push.ts` (31%), `project-prep.ts` (27%).

Target: Tier 1 to ~90%, Tier 2 to ~75%; leave Tier 3 unless a bug surfaces. That lifts overall
coverage while spending effort only where a regression would actually hurt.

### KI-5 — `apps/mobile` in CI · RESOLVED (was a false finding)
The original finding grepped `.github/workflows/` for "mobile" and found nothing — but CI runs
`pnpm typecheck` / `pnpm lint`, which are `turbo run` aggregates, and `@eyf/mobile#typecheck` +
`#lint` ARE in the turbo graph (confirmed via `turbo run typecheck --dry`). CI's install provides
react-native, so mobile is genuinely typechecked + linted in CI. Only gap: it has no tests (none
exist) and isn't built in CI (experimental Expo app) — acceptable. No action.

### KI-6 — Flaky integration test under parallel DB load · MITIGATED
Already handled: `apps/api/vitest.config.ts` sets `fileParallelism: false`, which serializes the
DB-backed integration files (the documented cause). The one flake observed was a leftover-data
artifact from an interrupted run, not the parallel race, and isn't reproducible. No further change.

### Security pass (Phase 10 audit, 2026-07-21)
Overall posture is strong (dual Clerk+JWT auth with separate access/refresh secrets, two-layer
RLS tenant isolation, per-plan Redis rate limiting, verified Razorpay webhooks, no SQLi/secret
leakage). Findings, ranked:

- **S1 — Web CSP `script-src` allows any `https:` origin · Medium · IN PROGRESS (report-only shipped).**
  The enforced policy lets scripts load from any https host. A tightened `script-src` allowlist
  (self + jsdelivr/PostHog/Clerk/Turnstile, dropping bare `https:`) now ships as
  `Content-Security-Policy-Report-Only` — it blocks nothing, the browser just reports what *would*
  break. **To promote:** exercise the app on staging (esp. sign-in/Clerk, the Monaco editor, and
  analytics), confirm zero `report-only` CSP violations in the browser console, add any missing
  origin, then replace the enforced header value with `cspReportOnly` and delete the report-only one.
  `'unsafe-inline'`/`'unsafe-eval'` are intentionally kept — Monaco needs eval and Next hydration
  needs inline; removing them requires per-request nonces + dynamic rendering (71 static pages would
  go dynamic — a separate, larger task, deferred).
- **S2 — `/metrics` fail-open · Medium · FIXED (this PR).** Was unauthenticated when `METRICS_TOKEN`
  unset. Now fails closed in production (404) with a constant-time token compare.
- **S3 — No log redaction · Low-Med · FIXED (this PR).** Added pino `redact` for
  `authorization`/`cookie`/admin-gate/signature headers + password/token fields (defense-in-depth).
- **S4 — `API_CORS_ORIGINS` prod guard · Low · FIXED.** The env schema now `superRefine`s in
  production: a wildcard (`*`) or non-`https://` CORS origin fails boot (with `credentials:true`, a
  wildcard would let any site make authenticated cross-origin calls). Dev/test keep the localhost default.
- **S5 — File-upload constraints · Info · RESOLVED (no surface).** Inspection found **no
  object-storage upload path** in the request handlers (no `@aws-sdk`/`S3Client`/`getSignedUrl`/
  `PutObject` anywhere). The only binary intake is audio for Whisper transcription, capped by the
  global 1MB `bodyLimit`. Resume/certificate assets are generated server-side (React-PDF), not
  uploaded. No untrusted-upload vector exists; nothing to fix.

### UI/UX pass (Phase 9 audit, 2026-07-21)
Foundation is strong: 71 CSS-var design tokens, 11 shared `@eyf/ui` primitives, a written
DESIGN.md thesis, good a11y hygiene (proper buttons not div-onClick, alt text, `focus-visible`
across 43 files), consistent loading/empty states. Method: code-grounded (not pixel) — a
screenshot `/design-review` pass is the complement. Findings:

- **U1 — Inconsistent read-error handling · Medium · FIXED.** Fixed systemically in one place: the
  global `SwrProvider` now has an `onError` that toasts transient read failures (5xx/network),
  deduped per key, while leaving terminal 4xx states (404/402/403/400) to the pages that handle
  them inline. No more silent infinite skeleton on a degraded API — all 81 data pages covered
  without touching any of them.
- **U2 — Wrapped poster violated the no-decorative-gradient rule · Low-Med · FIXED.** `wrapped`
  ShareCard used two white radial "aurora" glows (DESIGN.md forbids them); replaced with the
  sanctioned neutral vignette.
- **Cleared on inspection (not findings):** the 41 hardcoded hex colors are legitimate
  (share-card export, canvas/WebGL, games, 3D viz, OG/theme meta — CSS vars don't apply there);
  the 2 raw tables handle mobile via progressive column-hiding, not overflow (a valid pattern).

### Performance pass (Phase 11 audit, 2026-07-21)
Baseline is strong: three.js + Monaco are code-split (`dynamic()`, landing is 161KB without three),
N+1 is near-zero, 93/93 models carry indexes, SWR caching is tuned. One real finding:

- **P1 — Talent search computes readiness for the whole consented pool · High (at scale) · MITIGATED.**
  `org-hire.ts` search ran `computeUserReadiness` (≈9 queries each) for every opted-in student before
  limiting to ≤50 → ≈N×9 queries per search, a scaling cliff. **Shipped mitigation:** the search path
  now uses `computeUserReadinessCached` — a scoped Redis cache (5-min TTL, keyed by algorithm version
  so a scoring change auto-invalidates), so repeated/overlapping searches hit cache instead of
  recomputing. Correctness-preserving (same values), best-effort (a Redis miss just computes), and
  scoped to search — a student's own live score stays uncached/fresh. **Still open for the full fix:**
  a cold first search of a large pool still computes N; the complete answer is the materialized
  Readiness Index (HARD-6) so search sorts/limits in SQL and computes live only for the top-N.

### DevOps pass (Phase 12 audit, 2026-07-21)
Strong baseline: split `/livez`+`/readyz` probes, Dockerfiles + compose healthchecks, a
health-gated rolling CD with immutable-SHA rollback tags (multi-platform), Sentry + Prometheus.
One Critical gap (the docs already flagged it):

- **D1 — No DB backup / restore / RTO-RPO · Critical · TOOLING SHIPPED, needs ops action.**
  `docs/DEVOPS.md` said "Restore from backup ⚠️ not configured" — for a SaaS holding PII + payments,
  a Postgres loss was unrecoverable. **Surfaced by testing:** a naive `pg_dump` also *fails* under
  HARD-1's `FORCE ROW LEVEL SECURITY` (needs a BYPASSRLS role) and on Prisma's `?schema` param.
  **Shipped:** tested `scripts/db-backup.sh` + `scripts/db-restore.sh` (both gotchas handled),
  RTO/RPO targets, and a quarterly restore drill in DEVOPS.md. **You must still:** create the
  `eyf_backup` BYPASSRLS role, enable the provider's PITR, schedule the backup, and run the drill —
  those are infra actions, not code.

## How to use this file

Add an entry the moment a known issue is discovered rather than losing it in a PR thread.
Reference the ID (e.g. "KI-2") in commits/PRs that address it. When resolved, remove it here
and note it in `CHANGELOG.md`.
