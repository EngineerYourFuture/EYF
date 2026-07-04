# EYF — Build Plan + Spec Coverage

> Living doc. This is the current state of the EYF rebuild as of the latest round.
>
> ⚠️ **Staleness note (2026-07-04):** this doc predates a large build + hardening
> round. Trust the code over this doc. Known-stale below: test counts (now 82
> unit); cognitive games (all 5 built + Complexity Blitz, not "3 of 5 unbuilt");
> and much is unlisted (Offer Predictor, LMS wedge, adaptive assessment, etc.).
> See `STATUS.md`. Lines below are being corrected as each area is re-verified.

## Stack (locked)

| Layer | Tech |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Web | Next.js 14.2.25 (App Router) + React 18 + Tailwind + Framer Motion + Sonner |
| API | Fastify 5 + Node 20 + TypeScript + Zod |
| Mobile | Expo SDK 52 + expo-router + Clerk Expo |
| DB | PostgreSQL 16 + Prisma 5 |
| Cache / Queues | Redis 7 + BullMQ (workers: judge, cron) |
| Auth | Clerk (Google OAuth + phone OTP via MSG91) |
| Payments | Razorpay (subscriptions + Connect for mentor payouts) |
| Code judge | Judge0 self-hosted (docker compose `judge` profile) |
| LLM | Anthropic Claude — Sonnet 4.6 (analysis), Haiku 4.5 (hints) |
| Speech | OpenAI Whisper (voice mock transcription) |
| Storage | Cloudflare R2 |
| Email | Resend (transactional) + Customer.io (marketing) |
| SMS / WhatsApp | MSG91 + Twilio WhatsApp |
| 3D / Viz | Three.js (recursion tree + force-graph), pure-SVG 2D |
| Analytics | PostHog |
| CI/CD | GitHub Actions → Vercel (web) + Railway (api) |
| E2E | Playwright (chromium) |

## Spec §43 build-order coverage

### Phase 1 — MVP (Weeks 1–8)
| Slice | Status |
|---|---|
| Next.js scaffold + Postgres + Prisma + Clerk + Razorpay + Docker | ✅ |
| User service: signup, profile, subscription, plan-gating middleware | ✅ |
| DSA service: problem CRUD, Monaco editor, Judge0 dispatch + BullMQ worker, submission history, **2D D3-style visualizer (sort + BST)** | ✅ |
| Skill assessment: 32-question bank, adaptive picker, gap report, sigmoid placement-probability | ✅ |
| Roadmap templates (30/60/12-week) + daily challenge + streaks | ✅ |
| Razorpay subscriptions + webhook + plan gating + certificate PDF | ✅ webhook sig ✓ (HMAC + timingSafeEqual). **Plan-gating was BROKEN** (ignored `status`/`endsAt` → paid plans never expired, canceled kept access) — **fixed**: expiry + cancel-at-period-end aware, webhook idempotent (event-id dedup) + order-safe (`lastEventAt`). Verified by `apps/api/src/lib/subscription.test.ts` (14 tests: expiry denial, cancel-period-end, duplicate + out-of-order delivery). Branch `hardening/billing-gating`. |

### Phase 2 — Differentiation (Weeks 9–16)
| Slice | Status |
|---|---|
| Core Subjects (OS/DBMS/CN/OOP) — theory + SRS flashcards (SM-2) | ✅ |
| Cognitive Games — reaction + 2-back + anti-cheat tab-blur | ✅ (3 of 5 game variants, ELO TODO) |
| AI Mock Interview — Claude as interviewer + JSON-rubric grader + voice via Whisper | ✅ |
| Resume Builder — JSON schema editor + ATS scorer + react-pdf export | ✅ |
| Company Tracks + OA Fingerprint (community-submitted) | ✅ |
| Career Tracks "Choose Your Path" — 12 roles, salary band, demand, curriculum | ✅ |
| Gamification — XP/level curve + streak + 8 badges + leaderboard + heatmap | ✅ |
| BTech Projects — idea catalog (8 seeded) + start + status tracker | ✅ |

### Phase 3 — Monetisation & Scale (Weeks 17–24)
| Slice | Status |
|---|---|
| Mentor Marketplace — verified profiles + slot booking | ✅ |
| Razorpay Connect mentor payouts (80/20 split) | ✅ |
| Peer Mock Interviews — FIFO matching + WebRTC signaling (long-poll over Redis) + video UI | ✅ |
| Internship Module — board + Kanban tracker + PPO conversion % | ✅ |
| Job Board + Application Tracker | ✅ |
| Community — threads/posts/reactions, 8 categories | ✅ |
| Certifications — issue + verify-by-code + PDF | ✅ |
| Admin + Analytics — moderation dashboards + PostHog instrumentation | ✅ |

### Phase 4 — Intelligence & Growth (Weeks 25–36)
| Slice | Status |
|---|---|
| Code DNA — submission fingerprint (language mix, pattern strengths, habits) | ✅ |
| Pressure Training — timed sessions + anxiety index trend | ✅ |
| AI Career Strategist — monthly Claude playbook | ✅ |
| Interview Question Predictor — OA Fingerprint serves this | ✅ |
| Variant Generator — Claude-driven `generateProblemVariant` + UI panel | ✅ |
| 3D Algorithm Visualizer — Three.js recursion tree + force-graph BFS | ✅ |
| Mobile App (Expo) — daily, flashcards, streak | ✅ scaffold |
| Get Roasted + EYF Daily audio + Mock Offer Letter | ✅ (audio TODO) |
| WhatsApp Bot (/daily /streak /due) | ✅ |
| Production polish — CI/CD, E2E smoke, rate-limit by plan, toast UX | ✅ |

## Operational

```bash
pnpm install
cp .env.example .env

# Postgres + Redis (Judge0 optional behind --profile judge)
pnpm docker:up

pnpm db:generate && pnpm db:migrate && pnpm db:seed

# Three terminals in dev:
pnpm dev                                    # web :3000 + api :4000
pnpm --filter @eyf/api dev:worker           # Judge0 worker
pnpm --filter @eyf/api dev:cron             # cron worker (streak/digest/leaderboard)

# Mobile (separate)
cd apps/mobile && pnpm install
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... pnpm start

# CI commands
pnpm typecheck   # 6/6 packages
pnpm test        # unit tests (vitest)
pnpm --filter @eyf/web test:e2e   # playwright smoke
```

## Tests

| Suite | Count | What |
|---|---|---|
| `@eyf/types` vitest | 23 | XP curve, plan limits, **goal-adaptive readiness** (differentiator) |
| `@eyf/api` vitest | 59 | ATS scorer, SRS (SM-2), assessment, pressure, WhatsApp parser, **plan-gating expiry/cancel + webhook idempotency/ordering** (`lib/subscription.test.ts`) |
| `@eyf/web` playwright | 4 | Landing renders, pricing tiers, nav, auth gating redirects (sign-in→solve E2E still TODO) |

## Real keys needed for full functionality

The repo runs without any of these (graceful 503s or dev-login fallbacks), but for full prod behavior:

- Clerk (publishable + secret + webhook)
- Razorpay (key id + secret + webhook + Connect for mentor payouts)
- Anthropic API (variants, hints, mock interviewer, grader, strategist, roaster)
- OpenAI (Whisper transcription)
- Judge0 self-hosted (docker compose --profile judge)
- MSG91 (SMS / WhatsApp via Twilio also works)
- Resend (transactional email)
- Cloudflare R2 (resume/cert PDFs)
- PostHog (analytics)

## Out of scope / honest gaps

- **WebSocket transport for peer signaling** — currently long-poll over Redis, fine for tens of peers, swap for ws at scale.
- **3 of 5 cognitive games unbuilt** — Pattern Recall, Spatial, Stroop.
- **WebRTC TURN server** — code now reads TURN creds from `NEXT_PUBLIC_TURN_URL/
  USERNAME/CREDENTIAL` (falls back to STUN) via `buildIceServers`
  (`packages/types/src/webrtc.test.ts`), and a failed P2P now shows a distinct
  "connection failed — retry" UX instead of looking like a normal hangup. **Still
  need YOU to provision the TURN server** (managed e.g. Twilio/Metered, or self-host
  coturn) and set those env vars — until then it's STUN-only and fails on strict NAT.
- **Real Resend integration** — cron worker logs intended sends; wire actual email push in a small later round.
- **EYF Daily audio** — spec calls for a daily-podcast-style 2-min audio. Not built.
- **Mobile app deep production polish** — push notifications registered but no remote push pipeline wired; offline caching for flashcards not done.
- **E2E sign-in flow** — current Playwright only covers public surfaces; full signin→solve flow needs Clerk test-mode + Judge0 container in CI.
- **Sonar / Lighthouse CI** — ✅ both set up. `sonar.yml` (SonarCloud + API
  coverage; needs the `SONAR_TOKEN` repo secret to run). `lighthouse.yml` +
  `lighthouserc.json` added — audits the landing on PRs, **a11y < 0.9 fails the
  build**; perf/best-practices/SEO warn. (PLAN.md previously said "neither set up"
  — Sonar already existed; Lighthouse was the real gap.)
- **Keyless/failure fail-safety (hardened #4):** AI-mock start path already 503s
  (no 500). Grader response now **validated** (`lib/mock-feedback.ts` — Zod +
  clamp) instead of an unchecked `as MockFeedback` cast, so malformed / wrong-shape
  LLM output throws cleanly instead of poisoning downstream (composure trend etc.).
  Judge0 worker `failed` handler now marks the submission `INTERNAL_ERROR` once
  retries are exhausted (`lib/judge-retry.ts`) instead of leaving it PENDING
  forever. Tests: `mock-feedback.test.ts`, `judge-retry.test.ts`.
- **Employer/LMS portal auth (post-PLAN.md feature)** — access-code login. `/org/verify`
  now has a tight per-IP rate limit (5/min) guarding brute-force
  (`apps/api/src/lib/rate-limits.test.ts`). **Still owed:** the raw code is sent
  as a bearer header on every org request (long-lived static credential + per-
  request DB lookup) — the proper fix is a short-lived org session token issued
  at `/verify`, and/or Clerk orgs. Codes should also be long/random by generation.

If a sentence above says ✅, the code exists and typechecks. If it says ✅ scaffold, the routes/UI exist but rely on a real service key to fully exercise. If it says TODO, it's deliberately unbuilt and listed here.
