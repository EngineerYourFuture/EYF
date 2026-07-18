# Changelog

All notable changes to EYF are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project intends to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Related:** [ROADMAP](ROADMAP.md) · [STATUS](STATUS.md) · [PRODUCT-ROADMAP](PRODUCT-ROADMAP.md)

---

> [!WARNING]
> **No release process exists yet.** There are no git tags, no `VERSION` file, and no `CHANGELOG` was maintained before this document. The root `package.json` reads `"version": "0.1.0"` and has never been bumped across **410 commits**.
>
> This changelog was **reconstructed from git history** and is therefore organised by **development phase**, not by released version. Entries below are grouped from real commits; dates are commit dates, not release dates.
>
> See [Establishing releases](#establishing-releases) for how to move to real versioning.

---

## Table of Contents

- [Unreleased](#unreleased)
- [Phase 5 — Production hardening & design](#phase-5--production-hardening--design-2026-07)
- [Phase 4 — Enterprise platform](#phase-4--enterprise-platform-2026-07)
- [Phase 3 — The differentiators](#phase-3--the-differentiators-2026-06)
- [Phase 2 — Monorepo rebuild](#phase-2--monorepo-rebuild-2026-06)
- [Phase 1 — Backend rebuild](#phase-1--backend-rebuild-2026-05)
- [Phase 0 — Initial platform](#phase-0--initial-platform-2026-04)
- [Commit statistics](#commit-statistics)
- [Establishing releases](#establishing-releases)

---

## [Unreleased]

### Added
- **Documentation set** — 24 reference documents under `docs/`, cross-linked from [docs/README.md](README.md).
- `apps/web/app/(admin)/admin/content/_field.tsx` — shared `Field` form-field wrapper.

### Changed
- `assessment-bank.ts` — header comment corrected; it described an "adaptive picker" that no longer existed and omitted that the bank is now a DB fallback.
- `score-memory.ts` — `lastSeenScore`/`rememberScore` un-exported (internal-only), tightening the module boundary.

### Removed
- **1,116 lines of orphaned landing code** — 9 files from the superseded "Antigravity scroll-film" landing (`scroll-film`, `video-hero`, `roadmap-3d`, `particle-field`, `landing-background`, `scroll-nav`, `eyf-mark`, `eyf-animated-logo` + its CSS module).
- **13 duplicate `Field` components** consolidated into one shared module.
- Dead legacy selectors superseded by the `*-source.ts` layer: `pickQuestions`, `BY_AREA`, `mulberry32` (`assessment-bank.ts`); `promptsByKind` (`communication-bank.ts`).
- Unused motion primitives `Stagger` / `StaggerItem`.
- Unused `rankActions` re-export wrapper and its type assertion (`lib/readiness.ts`).

### Fixed
- Nothing — the cleanup was explicitly behaviour-preserving. Baseline verified unchanged: typecheck 6/6, lint 0 warnings, 134 API tests + 46 `@eyf/types` tests passing, 95-route production build.

Detail: [CODE_CLEANUP_REPORT.md](../CODE_CLEANUP_REPORT.md).

### Known issues
- RLS isolation test is a **false negative** — the dev/CI Postgres role is a superuser and bypasses RLS. ([TESTING](TESTING.md#the-rls-false-negative))
- `orgDb()` — the documented tenant-isolation repository layer — has **zero call sites**. ([SECURITY](SECURITY.md#open-findings))
- `db:rls` runs in CI but **not** in CD.
- `cd.yml`'s deploy job is an **echo-only stub**.
- No `LICENSE` file.

---

## Phase 5 — Production hardening & design (2026-07)

_182 commits in 2026-07 (across Phases 4 and 5)._

### Added
- Real Clerk authentication with a dev-aware CSP (`feat(auth)`).
- Legal and policy pages; Razorpay receipt fix (`feat`).
- Scroll-driven "Antigravity" landing redesign (`feat(web)`) — later superseded.
- Landing showcase: pillars grid + how-it-works.
- Live EYF Score card in the hero.
- Installable PWA — manifest, icons, OG card (`feat(pwa)`).

### Changed
- Production-readiness hardening + design/UX polish.
- Light-theme artifacts fixed; app defaults to light with a smooth theme switch.
- `AntigravityBackground` naming/coupling clarified (`refactor(web)`, explicitly *no behaviour change*).
- 3D roadmap degrades gracefully without WebGL; tube colour de-limed to neutral dark.

### Fixed
- **Security + correctness fixes from a `/cso` + `/review` audit** (`fix(api)`).
- Footer readability on the landing (`FINDING-F1`).
- Duplicate Pricing link removed from the footer Company column (`FINDING-F2`).
- Pinned-scene heights cut to reduce empty scroll gaps.
- 5 `no-unused-vars` lint errors cleared.

### Removed
- **MSG91 / WhatsApp bot integration** (`chore`) — no SMS provider remains.

---

## Phase 4 — Enterprise platform (2026-07)

The B2B multi-tenant platform, built in phased EPICs against `specs/EYF_Enterprise_Learning_Platform_PRD.md`.

### Added — Phase 0 (foundations)
- **Org membership, RBAC + ABAC choke point, departments/teams** (`EPIC-01/03`) — `packages/types/src/org-permissions.ts`: 21 capabilities × 11 roles × 5 scopes.
- **RLS backstop, `orgScoped` layer, usage metering** (`EPIC-02/04`) — three-layer tenant isolation.
- Canonical Enterprise PRD & architecture v1.0 (`docs(specs)`).

### Added — Phase 1 (learning)
- Course builder API, member learning, org console seed.
- Course builder (block editor) + course player.
- **Learning paths, cohorts, funnel + stuck detector** (`EPIC-07`).

### Added — Phase 2 (assessment & skills)
- **The Skill Ledger — "the moat"** (`EPIC-13`) — `SkillEvidence` with per-source `weight` and a 180-day decay half-life.
- **Assessment engine feeding the Skill Ledger** (`EPIC-10`).
- **Org certificates — auto-issue, revoke, verify** (`EPIC-12`).

### Added — Phase 3 (hiring)
- **Evidence-based hiring from the talent pool** (`EPIC-16/17`) — consent-gated talent search.
- **Offers, two-person chain, profile carry-over** (`EPIC-18`, `F10`).

### Added — Phase 4 (white-label)
- White-label branding, API keys, webhooks.

---

## Phase 3 — The differentiators (2026-06)

_38 commits. The integration thesis made real._

### Added
- **Placement Readiness Score** — *"EYF's flagship differentiator"* (`feat(web)`).
- **Per-company Placement Readiness** — *"the spec's headline moat"*.
- **Today planner** — the daily-habit home screen.
- **Application Pipeline** — Kanban funnel for every role pursued.
- **Company Prep** — targeted, coverage-tracked interview prep.
- **Engineering Skill Graph** — mastery across all 9 placement dimensions.
- **Personalized Roadmap Engine** (spec PROBLEM #1).
- **Persona journeys** — Student / Job-Switcher / Developer (spec PROBLEM #9).
- **Daily Mission system** with bonus-XP claim.
- **Rejection Recovery — the comeback engine** (`feat(pipeline)`).
- Global command palette (⌘K).
- Live application deadlines surfaced on the daily screen.
- Internship detail page; job detail polish.
- Premium video-first hero (video-ready, aurora fallback).

### Changed
- Placement Readiness strip unified onto the home screen.
- Company Prep + Pipeline featured in dashboard quick actions.

---

## Phase 2 — Monorepo rebuild (2026-06)

### Added
- **Rebuilt EYF as a Turborepo monorepo + full UI/UX overhaul** — the current `apps/` + `packages/` structure.
- Branded 404 + global error pages.
- Sidebar navigation icons.

### Changed
- Assessment flow UX overhauled.
- Problem solver polished — theme-aware editor + light-mode fixes.
- AI mock session feedback + chat polished.
- Admin moderation area polished.

---

## Phase 1 — Backend rebuild (2026-05)

_189 commits — the single largest month._

### Added
- **Complete backend rebuild — Prisma + PostgreSQL, full API, Monaco editor.**
- SonarCloud quality gate (`feat(ci)`).
- `render.yaml` blueprint for Render deployment.

### Fixed
- `prisma generate` step added before typecheck in CI.
- Render build installs devDeps to obtain TypeScript + `@types`.
- Extensive SonarQube remediation — nested ternaries, array-index keys, and *"all remaining 19 SonarCloud issues"*.

### Changed
- Backend deploy wired to the Render API (replacing a placeholder deploy hook).

> [!NOTE]
> Render was the original deploy target. The current README describes **Vercel (web) + Railway (api)**, and `cd.yml` publishes images to **GHCR**. `render.yaml` may be a historical artifact — verify before relying on it.

---

## Phase 0 — Initial platform (2026-04)

### Added
- `2026-04-20` — **Initial EYF platform** — full-stack TypeScript/React app.

---

## Commit statistics

| Metric | Value |
| --- | --- |
| Total commits | **410** |
| First commit | 2026-04-20 |
| Latest commit | 2026-07-13 |
| Span | ~3 months |

### By month

| Month | Commits | Phase |
| --- | --- | --- |
| 2026-04 | 1 | Initial platform |
| 2026-05 | **189** | Backend rebuild + quality gates |
| 2026-06 | 38 | Monorepo rebuild + differentiators |
| 2026-07 | **182** | Enterprise platform + hardening |

### By type

| Type | Count | Share |
| --- | --- | --- |
| `feat` | 221 | 54% |
| `fix` | 86 | 21% |
| `style` | 11 | 3% |
| `chore` | 10 | 2% |
| `polish` | 7 | 2% |
| `docs` | 5 | 1% |
| `design` | 3 | <1% |
| `test`, `redesign`, `perf`, `ci`, `revert` | 9 | 2% |

> [!NOTE]
> `feat` at 54% and `test` at 2 commits reflects a product in rapid build-out. Tests exist (135 API + 46 types) but were largely added alongside features rather than in dedicated commits.

---

## Establishing releases

The project has no versioning discipline yet. To adopt it:

### 1. Choose a scheme

SemVer against the **public API contract** (`/v1`) and the database schema:

| Bump | When |
| --- | --- |
| **major** | Breaking `/v1` change, or a contract-breaking (contract-phase) migration |
| **minor** | New endpoint/feature, additive (expand-phase) migration |
| **patch** | Bug fix, no contract change |

### 2. Tag releases

```bash
git tag -a v0.2.0 -m "Enterprise platform Phase 4"
git push origin v0.2.0
```

### 3. Bump `package.json`

`"version": "0.1.0"` has been unchanged for 410 commits. Consider Changesets or `release-please` — the repo already uses Conventional Commits, so generation is nearly free.

### 4. Wire `RELEASE`

`cd.yml` already tags images with `$GITHUB_SHA`. Set `RELEASE=$GITHUB_SHA` (or the tag) in the API env so Sentry attributes regressions to a deploy — the variable already exists in `env.ts` (default `dev`).

### 5. Maintain this file

Add an `## [Unreleased]` entry with every PR; move it under a version heading on release.

> [!TIP]
> Because 100% of commits follow Conventional Commits, `release-please` could generate both the version bump and this changelog automatically from history. That is the lowest-effort path to real releases.

---

**Next:** [ROADMAP.md](ROADMAP.md) · [STATUS.md](STATUS.md) · [CONTRIBUTING.md](CONTRIBUTING.md)
