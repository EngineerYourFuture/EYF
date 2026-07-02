# EYF — Go-Live Runbook

EYF is ~code-complete. What stands between it and a live product is **real API keys** (Bucket 2) and a **deploy** (Bucket 3). This is the checklist for both. Nothing here needs new code.

---

## Bucket 2 — API keys (activation)

Every integration is already wired and **no-ops safely without its key**. Set the real value and the feature turns on. Put these in the deploy platform's env (not committed).

| Key(s) | Unlocks | Where to get it |
|--------|---------|-----------------|
| `DATABASE_URL` | Postgres (everything) | Neon / Railway / RDS |
| `REDIS_URL` | queues + peer signaling + guidance cache | Upstash / Railway |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | session signing (≥16 chars, random) | `openssl rand -hex 32` |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` | **real signup/signin** (replaces dev-login). NOTE: the API auto-detects a real key via `isRealClerkKey()` — placeholder `sk_test_replace` keeps dev-login mode. | dashboard.clerk.com |
| `ANTHROPIC_API_KEY` | AI mock interviewer + grader, guidance coach note, problem variants, career strategist, roaster | console.anthropic.com |
| `OPENAI_API_KEY` | Whisper voice-mock transcription | platform.openai.com |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` + set `BILLING_ENABLED=true` | subscriptions + **paywall enforcement** (`requirePlan` gates go live) | dashboard.razorpay.com |
| `JUDGE0_URL`, `JUDGE0_TOKEN` | code submission → verdict | self-host (docker `--profile judge`) or judge0 RapidAPI |
| `RESEND_API_KEY`, `RESEND_FROM` | **activates the retention loop** — streak alerts, daily digest, weekly leaderboard emails (cron already sends them) | resend.com |
| `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_TEMPLATE_ID` | phone OTP + WhatsApp | msg91.com |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | resume / certificate PDF hosting | Cloudflare R2 |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | product analytics on every pillar | posthog.com |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (mobile) | mobile auth | Clerk (same instance) |

**Minimum to be "live and usable":** DATABASE_URL, REDIS_URL, JWT secrets, Clerk, Anthropic, Judge0. Add Razorpay + `BILLING_ENABLED=true` to charge. Add Resend to turn on retention emails.

---

## Bucket 3 — Deploy

Turborepo monorepo (pnpm). Node 20+.

**Services to stand up (5 — two are easy to forget):**
1. **web** — Next.js 14 → Vercel. Set all `NEXT_PUBLIC_*` env.
2. **api** — Fastify 5 (Node 20) → Railway/Render. Start: `pnpm --filter @eyf/api start` (build first). Set all server env.
3. **Postgres 16** + **Redis 7** — managed.
4. **Judge0 worker** — `pnpm --filter @eyf/api dev:worker` (dispatch + verdict polling). **Must run as its own long-lived process.**
5. **Cron worker** — `pnpm --filter @eyf/api dev:cron` (streak alerts 21:00 IST, digest 07:00 IST, leaderboard Mon 08:00 IST). **Own process too — this is what fires the retention loop.**

Plus **Judge0 itself** (`docker compose --profile judge up`) or a hosted Judge0.

**DB on first deploy:**
```bash
pnpm db:generate          # generate Prisma client (gitignored)
cd packages/db && npx prisma db push   # this repo uses db push, not migrations
pnpm db:seed              # seed problems, tracks, jobs, seed users
```

**Still to configure for full prod:**
- **WebRTC TURN (coturn)** — peer mocks are STUN-only today; NAT-strict users need a TURN server.
- **CI** — Lighthouse/perf budget (SonarQube Cloud is already wired).
- **Mobile** — EAS build (dev build, not Expo Go) so `FLAG_SECURE` takes effect; `cd apps/mobile && pnpm install` first.

---

## Bucket 1 — remaining code (small)

Almost nothing genuinely left; the pillars, retention loop, guidance, admin, and protection are built. Optional polish:
- **EYF Daily audio** — the spec's 2-min daily audio briefing is unbuilt (needs a TTS provider key).
- **Cognitive ELO/percentile** — games are all built; a cross-user rating is a "nice to have".
- **Test coverage** — ~5%; add tests on billing/auth/Judge0 before scaling.

---

## Security — MUST verify before exposing to the internet

A `/cso` audit found the app solid (CORS restricted, rate-limited, IDOR-scoped, webhook
signatures verified, no raw SQL) with one critical config trap, now fixed in code but
still requiring correct deploy env:

- [ ] **`DEV_LOGIN_ENABLED` is UNSET in production.** dev-login (passwordless admin login
  by email) is now fail-closed — off unless this flag is `true`. Never set it in prod.
  Set it to `true` only in local `.env`. (Was: exposed unauthenticated admin takeover if
  `NODE_ENV` wasn't `production`.)
- [ ] **`NODE_ENV=production`** on the deployed API (second guard on dev-login).
- [ ] **`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are 32+ chars**, generated with
  `openssl rand -hex 32` (enforced by env validation now).
- [ ] **`API_CORS_ORIGINS`** set to your real web domain (not the localhost default).
- [ ] **Enable MFA for staff (ADMIN / CONTENT_CREATOR) in Clerk** — admin access is a
  role claim; a second factor is the real gate on the back-office.
- [ ] Note: env lives in TWO files locally (`apps/api/.env` for the API, root `.env`
  symlinked into `packages/db`). In prod, set vars in the platform's env UI, not files.

## Go-live verification (after keys + deploy)
- [ ] Real Clerk signup → land on dashboard (dev-login disabled in prod)
- [ ] Solve a problem → Judge0 returns a verdict
- [ ] Subscribe via Razorpay (test mode) → plan gate lifts; invoice appears in `/admin/payments`
- [ ] Trigger the cron once → a real streak/digest email arrives (Resend)
- [ ] AI mock returns a graded rubric (Anthropic)
- [ ] PostHog receives events from a pillar
- [ ] Android dev build → screenshot is black (FLAG_SECURE)
