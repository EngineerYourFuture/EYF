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

### KI-4 — Test coverage 61.1% is below a mature-org bar · Medium
Pure-function core is well covered; the gap is concentrated in routes/web. **Action:** produce
a targeted testing roadmap (untested critical paths first), not a blanket coverage chase.

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

- **S1 — Web CSP `script-src` is `'unsafe-inline' 'unsafe-eval' https:` · Medium · OPEN.**
  Largely defeats CSP's XSS mitigation. XSS *surface* is small (one safe `dangerouslySetInnerHTML`,
  React escaping elsewhere), so Medium not High. **Fix:** per-request nonces + drop `https:` to an
  allowlist (its own scoped task — touches middleware + layout).
- **S2 — `/metrics` fail-open · Medium · FIXED (this PR).** Was unauthenticated when `METRICS_TOKEN`
  unset. Now fails closed in production (404) with a constant-time token compare.
- **S3 — No log redaction · Low-Med · FIXED (this PR).** Added pino `redact` for
  `authorization`/`cookie`/admin-gate/signature headers + password/token fields (defense-in-depth).
- **S4 — `API_CORS_ORIGINS` has no prod guard · Low · OPEN.** Defaults to localhost; nothing stops a
  misconfigured `*`. **Fix:** assert non-wildcard HTTPS origins at boot in production.
- **S5 — File-upload constraints unverified · Info · OPEN.** No upload route found (likely presigned
  R2). **Fix:** confirm presigned URLs constrain content-type + size; check image `remotePatterns` for SSRF.

## How to use this file

Add an entry the moment a known issue is discovered rather than losing it in a PR thread.
Reference the ID (e.g. "KI-2") in commits/PRs that address it. When resolved, remove it here
and note it in `CHANGELOG.md`.
