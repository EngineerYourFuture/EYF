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
- **Not a production exposure (deferred, low real risk):** the 4 "critical" advisories are
  **Vitest** (devDependency — RCE is a developer-machine surface, never shipped) and
  **node-tar** (pulled by `cacache`/build tooling, not exercised on untrusted archives at
  runtime). Both need *major* bumps (vitest 2→3, tar 6→7); do them as maintenance, not urgent.
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

- **Tier 1 — trust / money / execution (do first):**
  - `score.ts` (was 17%) — public score verify. ✅ **DONE** (`score.integration.test.ts`).
  - `submissions.ts` (30%) — code submission/judging (execution surface).
  - `me.ts` — self-service incl. financial/PII. ✅ **GDPR/DPDP export + erasure covered**
    (`me-privacy.integration.test.ts`); referral/self-report already covered. Remaining: a couple
    of minor placements-endpoint branches.
  - `org.ts` (16%) — org creation/membership (tenant boundary).
- **Tier 2 — important product paths:** `mocks.ts` (31%), `mcq.ts` (37%), `mentors.ts` (32%),
  `resume.ts` (40%), `roadmap.ts` (57%), `leaderboard.ts` (50%).
- **Tier 3 — low-risk display/utility (accept as-is or smoke-test only):** `fun.ts` (20%),
  `wrapped.ts` (24%), `missions.ts` (40%), `push.ts` (31%), `project-prep.ts` (27%).

Target: Tier 1 to ~90%, Tier 2 to ~75%; leave Tier 3 unless a bug surfaces. That lifts overall
coverage while spending effort only where a regression would actually hurt.

### KI-5 — `apps/mobile` is outside the CI health stack · Medium
The Expo app is real but not referenced by any workflow in `.github/workflows/`, so its
typecheck/lint/build are never enforced in CI. It is labelled experimental in its README.
**Action:** decide active vs paused; if active, add it to CI.

### KI-6 — Flaky integration test under heavy parallel DB load · Low
A full `apps/api` suite run intermittently failed once with a transient "unique constraint on
id" collision under high concurrency; a clean re-run passed (46 files, 365+ tests green).
**Action:** investigate whether integration tests need DB isolation (per-worker schema) or
serialization to remove the flake.

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

## How to use this file

Add an entry the moment a known issue is discovered rather than losing it in a PR thread.
Reference the ID (e.g. "KI-2") in commits/PRs that address it. When resolved, remove it here
and note it in `CHANGELOG.md`.
