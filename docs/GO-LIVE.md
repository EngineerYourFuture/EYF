# EYF — Go-Live Runbook

EYF is code-complete for launch. What stands between it and a live product is **real API keys** and a **deploy**. Every integration is already wired and **no-ops safely without its key** — set the real value, restart the service, and the feature turns on. Nothing here needs new code.

> Env-file gotcha: locally the **API reads `apps/api/.env`** (not the repo-root `.env`), the **web reads `apps/web/.env.local`**, mobile reads `apps/mobile/.env`, and the root `.env` feeds `packages/db`. In prod, set vars in the platform's env UI, not files. Never commit real keys.

---

## 1. API keys

| Key(s) | Unlocks | Where to get it |
|--------|---------|-----------------|
| `DATABASE_URL` | Postgres (everything) | Neon / Railway / RDS |
| `REDIS_URL` | queues + peer signaling + guidance cache | Upstash / Railway |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | session signing (32+ chars, random) | `openssl rand -hex 32` |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` | **real signup/signin** (replaces dev-login). The API auto-detects a real key via `isRealClerkKey()` — placeholder `sk_test_replace` keeps dev-login mode. | dashboard.clerk.com |
| `ANTHROPIC_API_KEY` | AI mock interviewer + grader, guidance coach note, problem variants, career strategist, roaster | console.anthropic.com |
| `OPENAI_API_KEY` | Whisper voice-mock transcription | platform.openai.com |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` + `BILLING_ENABLED=true` | subscriptions + **paywall enforcement** (`requirePlan` gates go live) | dashboard.razorpay.com |
| `JUDGE0_URL`, `JUDGE0_TOKEN` | code submission → verdict | self-host (docker `--profile judge`) or Judge0 RapidAPI |
| `RESEND_API_KEY`, `RESEND_FROM` | **the retention loop** — streak alerts, daily digest, weekly leaderboard emails (cron already sends them) | resend.com |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | resume / certificate PDF hosting | Cloudflare R2 |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | product analytics on every pillar | posthog.com |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (mobile) | mobile auth | Clerk (same instance) |

**Minimum to be live and usable:** `DATABASE_URL`, `REDIS_URL`, JWT secrets, Clerk, Anthropic, Judge0. Add Razorpay + `BILLING_ENABLED=true` to charge. Add Resend to turn on retention emails.

### Activation notes per service

**Clerk** — dashboard: add a webhook → `https://<api>/v1/auth/clerk-webhook` (events `user.created/updated/deleted`), copy its signing secret into `CLERK_WEBHOOK_SECRET`. Gotcha: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is **build-time** — the web must be rebuilt for the dev-login→Clerk switch (`HAS_REAL_CLERK`) to flip. Verify: real sign-in page appears; dev-login disables; a new signup syncs into the DB via the webhook.

**Razorpay** — dashboard: webhook → `https://<api>/v1/payments/webhook` (payment + subscription events). Verify: a test checkout upgrades the plan; a webhook flips entitlements; invoice appears in `/admin/payments`.

**Anthropic** — the biggest unlock: AI mock interviewer + personas + tone analysis, daily coach note, Roast + Offer, interview-experience synthesis, resume bullet-rewriter. All currently return deterministic fallbacks. Verify: `POST /v1/mocks/ai/start` returns a live interviewer turn.

**Judge0** — real submit/run on Problems + blind mode + pressure mode, complexity analyzer, test-case generator, OA simulated coding. Verify: submitting a solution returns a real verdict.

**Not a single key (still needs a service/worker):**
- **Scrapers** — live jobs, OA fingerprint DB, interview experiences, placement calendars. Schema + UIs are ready to ingest; needs a scraping worker + sources.
- **Video peer mocks** — Daily.co / 100ms room token service.
- **TURN server (peer-mock NAT traversal)** — WebRTC is wired; set `NEXT_PUBLIC_TURN_URL/USERNAME/CREDENTIAL` in `apps/web/.env.local` (managed: Twilio/Metered, or self-host coturn). Without it, peer mocks are STUN-only and fail on strict NAT (the UI shows a clear "connection failed" state).

---

## 2. Deploy

Turborepo monorepo (pnpm), Node 20+.

**Services to stand up (6 — three are easy to forget):**
1. **web** — Next.js 14 (standalone/Docker → `apps/web/Dockerfile`) → Vercel or a container host. Set all `NEXT_PUBLIC_*` env (build-time).
2. **api** — Fastify 5 (Node 20, `apps/api/Dockerfile`). Start: `pnpm --filter @eyf/api start`. Set all server env.
3. **Postgres 16** (pooled `DATABASE_URL` + `DIRECT_DATABASE_URL`) + **Redis 7** — managed.
4. **Judge0 worker** — `start:worker` (dispatch + verdict polling). **Own long-lived process.**
5. **Cron worker** — `start:cron` (streak alerts 21:00 IST, digest 07:00 IST, leaderboard Mon 08:00 IST). **Own process — the retention loop.**
6. **Webhook worker** — `start:webhook` (durable outbound webhook delivery + retries). **Own process.**

Everything is containerised: `docker compose -f docker-compose.prod.yml up -d --build` brings up all six + datastores. Plus **Judge0 itself** (`docker compose --profile judge up`) or a hosted Judge0.

**DB on first deploy (migrations, not `db push`):**
```bash
pnpm db:generate                                    # generate Prisma client (gitignored)
pnpm --filter @eyf/db exec prisma migrate deploy    # apply versioned migrations (reviewed, reversible)
# Baselining an EXISTING prod DB created via the old db push? Run once:
#   pnpm --filter @eyf/db exec prisma migrate resolve --applied 0_init
pnpm --filter @eyf/db db:rls                         # tenant-isolation RLS policies (idempotent)
pnpm db:seed                                         # seed problems, tracks, jobs, seed users
```
See **`docs/OPERATIONS.md`** for the full runbook: rolling/rollback, health probes,
backups + PITR + restore drills, disaster recovery, and observability/SLOs.

**One-pass activation order (when keys arrive):**
1. Paste keys into the platform env (or the three local env files).
2. Configure the two dashboard webhooks (Clerk, Razorpay) + Judge0 host.
3. `pnpm --filter @eyf/api build` + restart api · `pnpm --filter @eyf/web build` + redeploy web.
4. Run the per-service verifications above.
5. Flip prod flags (`NODE_ENV`, secrets, CORS, admin gate — next section).

**Still to configure for full prod:** WebRTC TURN (above) · mobile EAS build (dev build, not Expo Go, so `FLAG_SECURE` takes effect).

---

## 3. Security — MUST verify before exposing to the internet

A `/cso` audit found the app solid (CORS restricted, rate-limited, IDOR-scoped, webhook signatures verified, no raw SQL) with one critical config trap, now fixed in code but still requiring correct deploy env:

- [ ] **`DEV_LOGIN_ENABLED` is UNSET in production.** dev-login (passwordless admin login by email) is fail-closed — off unless this flag is `true`. Never set it in prod; set it to `true` only in local `.env`. (Was: unauthenticated admin takeover if `NODE_ENV` wasn't `production`.)
- [ ] **`NODE_ENV=production`** on the deployed API (second guard on dev-login).
- [ ] **`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are 32+ chars**, generated with `openssl rand -hex 32` (enforced by env validation).
- [ ] **`API_CORS_ORIGINS`** set to your real web domain (not the localhost default).
- [ ] **`ADMIN_ACCESS_CODE`** set to a real staff gate code — do NOT ship a placeholder.
- [ ] **Enable MFA for staff (ADMIN / CONTENT_CREATOR) in Clerk** — admin access is a role claim; a second factor is the real gate on the back-office.

---

## 4. Go-live verification (after keys + deploy)

- [ ] Real Clerk signup → land on dashboard (dev-login disabled in prod)
- [ ] Solve a problem → Judge0 returns a verdict
- [ ] Subscribe via Razorpay (test mode) → plan gate lifts; invoice appears in `/admin/payments`
- [ ] Trigger the cron once → a real streak/digest email arrives (Resend)
- [ ] AI mock returns a graded rubric (Anthropic)
- [ ] PostHog receives events from a pillar
- [ ] Android dev build → screenshot is black (`FLAG_SECURE`)
