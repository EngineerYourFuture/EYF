# Known Issues

Live register of known defects, risks, and drift. Each entry: what, evidence, severity,
and status. Fixed items move to `CHANGELOG.md`. Last reviewed: 2026-07-21.

## Open

### KI-1 — Large unmerged branch drifting from `main` · High
`chore/sonar-coverage-hardening` is ~83 commits ahead of `main` and now contains major
product work (Proof Loop Phase 1 + 2, security + design fixes), not "chore/sonar." Risk:
merge conflicts, no PR review, single-branch failure loses a lot of work. **Action:** land as
a reviewed PR (or split into themed PRs); rename to reflect real content.

### KI-2 — Critical advisories in the dependency tree · High (dev-surface)
`pnpm audit` flags critical items: **Vitest RCE / UI-server file read** and **node-tar
decompression DoS**. Vitest is a devDependency (not shipped) so the RCE is a developer-machine
surface, not production; node-tar may be transitive. **Action:** verify blast radius, bump,
re-run `pnpm test:ci`.

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

## How to use this file

Add an entry the moment a known issue is discovered rather than losing it in a PR thread.
Reference the ID (e.g. "KI-2") in commits/PRs that address it. When resolved, remove it here
and note it in `CHANGELOG.md`.
