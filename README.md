# EYF — Engineer Your Future

> India's end-to-end placement operating system — from your first DSA concept to your first offer letter.

This is a green-field rebuild (May 2026) following [specs/EYF_Master_Docs_Final.md](specs/EYF_Master_Docs_Final.md) and [specs/EYF_Complete_SaaS_Build_Guide.md](specs/EYF_Complete_SaaS_Build_Guide.md).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind, Framer Motion |
| Backend | Fastify on Node 20, TypeScript |
| Database | PostgreSQL 16 + Prisma 5 |
| Cache / queues | Redis 7 + BullMQ |
| Auth | Clerk (Google OAuth + phone OTP via MSG91) |
| Payments | Razorpay (subscriptions + Connect for mentor payouts) |
| Code judge | Judge0 (self-hosted) |
| LLM | Anthropic Claude (Sonnet for analysis, Haiku for hints) |
| Storage | Cloudflare R2 |
| Email | Resend (transactional), Customer.io (marketing) |
| SMS | MSG91 |
| Monorepo | Turborepo + pnpm workspaces |

## Layout

```
apps/
  web/        Next.js 14 — eyf.in
  api/        Fastify — api.eyf.in
  judge/      Judge0 deploy config (separate host in prod)
packages/
  db/         Prisma schema + generated client
  ui/         Shared React component library
  types/      Shared TypeScript types
  config/     Shared ESLint / Tailwind / TS bases
specs/        Source-of-truth product docs
PLAN.md       Build phases + what's done vs next
```

## Quick start

```bash
# 1. Install deps
pnpm install

# 2. Copy env
cp .env.example .env

# 3. Start Postgres + Redis
pnpm docker:up

# 4. Generate Prisma client + run migrations
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Run everything (web on :3000, api on :4000)
pnpm dev
```

Optional: start Judge0 locally with `docker compose --profile judge up -d` (heavy).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run `web` + `api` in parallel |
| `pnpm build` | Build all packages + apps |
| `pnpm typecheck` | TS check everything |
| `pnpm lint` | Lint everything |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:studio` | Prisma Studio GUI |
| `pnpm db:seed` | Seed dev data (problems, dev users) |

## Project status

See [PLAN.md](PLAN.md) for what's built, what's next, and how the work maps to the 36-week roadmap in the build guide.
