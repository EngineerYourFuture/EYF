# EYF — Engineer Your Future

> India's end-to-end placement operating system — from your first DSA concept to your first offer letter.

Two products in one platform:

- **Student app** — the integrated placement OS: practice (DSA + judge, cognitive games, pressure mode), learn (core subjects with SRS, adaptive assessment, personalized roadmap), interview (AI mocks, peer mocks, company prep, OA fingerprints), career (resume ATS, pipeline, mentors, jobs) — all feeding one **Placement Readiness score**.
- **B2B LMS** — a white-label course platform for companies and colleges, tied to Elite-tier internship access.

## Stack

| Layer | Tech |
|---|---|
| Web | Next.js 14 (App Router), React 18, Tailwind, Framer Motion |
| API | Fastify 5 on Node 20, TypeScript, Zod |
| Mobile | Expo SDK 52, expo-router |
| Database | PostgreSQL 16 + Prisma (versioned migrations via `prisma migrate`) |
| Cache / queues | Redis 7 + BullMQ (judge + cron workers) |
| Auth | Clerk (dev-login fallback without keys) |
| Payments | Razorpay (subscriptions + Connect payouts) |
| Code judge | Judge0 (self-hosted, docker `--profile judge`) |
| AI | Anthropic Claude (interviewer, grader, coach, variants) + Whisper (voice) |
| Infra | Turborepo + pnpm · GitHub Actions → Vercel (web) + Railway (api) |

## Layout

```
apps/
  web/        Next.js — student app, admin back-office, org (LMS) portal
  api/        Fastify — REST API under /v1, BullMQ workers (judge, cron)
  mobile/     Expo — daily challenge, flashcards, streak
packages/
  db/         Prisma schema + seed
  ui/         Shared React primitives
  types/      Shared types + pure logic (readiness, plans, permissions)
  config/     Shared ESLint / Tailwind / TS bases
docs/         STATUS (current state), PRODUCT-ROADMAP, GO-LIVE, DESIGN, visions
specs/        Source-of-truth product specs
```

## Quick start

```bash
pnpm install
cp .env.example .env

pnpm docker:up            # Postgres 16 + Redis 7 (Judge0: --profile judge)
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm --filter @eyf/db db:rls          # tenant-isolation RLS policies (idempotent)

pnpm dev                  # web :3000 + api :4000
```

Optional long-running workers (own terminals):

```bash
pnpm --filter @eyf/api dev:worker   # Judge0 dispatch + verdicts
pnpm --filter @eyf/api dev:cron    # streaks, digests, leaderboard
```

Runs fully without external keys — integrations no-op safely and auth falls back to dev-login. To activate real services, see [docs/GO-LIVE.md](docs/GO-LIVE.md).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run `web` + `api` in parallel |
| `pnpm build` | Build all packages + apps |
| `pnpm typecheck` | TS check everything |
| `pnpm lint` | Lint everything |
| `pnpm test` | Unit tests (vitest) |
| `pnpm --filter @eyf/web test:e2e` | Playwright smoke |
| `pnpm db:migrate` | Create + apply a dev migration (`prisma migrate dev`) |
| `pnpm --filter @eyf/db prisma:deploy` | Apply pending migrations (`prisma migrate deploy`) |
| `pnpm --filter @eyf/db db:rls` | Apply tenant-isolation RLS policies (idempotent) |
| `pnpm --filter @eyf/db db:rls:verify` | Verify RLS is present + enforced (`RLS_STRICT=true` to hard-fail) |
| `pnpm db:studio` | Prisma Studio GUI |

## Database & migrations

Schema changes go through **versioned Prisma migrations** (`packages/db/prisma/migrations`), not `db push`. Runtime uses the pooled `DATABASE_URL`; migrations use the unpooled `DIRECT_DATABASE_URL`.

Tenant isolation has a Postgres **Row-Level Security** backstop that is *not* part of Prisma migrations — reapply it after every migration with `pnpm --filter @eyf/db db:rls`, then `db:rls:verify`. CI applies + verifies (advisory); production applies + verifies with `RLS_STRICT=true` so a deploy fails if isolation is not enforced.

## Deployment

`.github/workflows/cd.yml` runs on push to `main`:

1. **migrate** — `prisma migrate deploy`, then `db:rls`, then `db:rls:verify` (`RLS_STRICT=true`).
2. **images** — build + push `api` and `web` containers to GHCR, tagged `:<sha>` and `:latest`.
3. **deploy** — auto-detects the platform from a configured secret (Railway / Fly.io / Render / Vercel), performs a rolling deploy, then a hard `/readyz` health gate. With no platform secret set, it fails loudly rather than reporting a false success. See [docs/GO-LIVE.md](docs/GO-LIVE.md).

## Docs

- [docs/README.md](docs/README.md) — documentation hub (architecture, API, database, security, deployment, …)
- [docs/STATUS.md](docs/STATUS.md) — what's built, current state
- [docs/PRODUCT-ROADMAP.md](docs/PRODUCT-ROADMAP.md) — spec ↔ status per feature
- [docs/GO-LIVE.md](docs/GO-LIVE.md) — keys, deploy, security checklist
- [docs/DESIGN.md](docs/DESIGN.md) — design system rules + tokens
- [specs/](specs/) — the founding product specs
