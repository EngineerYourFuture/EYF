# EYF Activation Runbook — "drop the keys, start the services"

Everything gated on a key is already wired: each key is an **optional** env var
(`apps/api/src/env.ts`) and the feature checks for it, falling back cleanly when
it's absent. So activation = **set the key → restart the service → verify**.

> Env-file gotcha: the **API reads `apps/api/.env`** (not the repo-root `.env`).
> The **web reads `apps/web/.env.local`**. Mobile reads `apps/mobile/.env`.
> Never commit real keys. See `GO-LIVE.md` for the security checklist.

Provide the keys and I will fill these in and start the services in one pass.

---

## 1. Anthropic — the AI half (biggest unlock)

**Set** in `apps/api/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```
**Lights up:** AI mock interviewer + personas + tone analysis, the daily coach
note (guidance), Roast + Offer, interview-experience synthesis, resume
bullet-rewriter, adaptive AI content. (All currently return their deterministic
fallback.)
**Verify:** `POST /v1/mocks/ai/start` returns a live interviewer turn; the
dashboard coach note becomes LLM-phrased.

## 2. Clerk — real auth (replaces dev-login)

**Set** in `apps/api/.env`:
```
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...        # from the Clerk dashboard webhook
```
**Set** in `apps/web/.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```
**Set** in `apps/mobile/.env`: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`
**Dashboard step:** add a webhook → `https://<api>/v1/auth/clerk-webhook`,
events `user.created/updated/deleted`, copy its signing secret into
`CLERK_WEBHOOK_SECRET`.
**Gotcha:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is **build-time** — the web must
be **rebuilt** for the dev-login→Clerk switch (`HAS_REAL_CLERK`) to flip.
**Verify:** real sign-in page appears; dev-login disables; a new signup syncs
into the DB via the webhook.

## 3. Razorpay — payments + subscription tiers

**Set** in `apps/api/.env`:
```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...           # from the Razorpay dashboard webhook
```
**Dashboard step:** webhook → `https://<api>/v1/payments/webhook` (payment +
subscription events).
**Lights up:** Core/Pro/Elite tiers, the paywalls (already gated by plan), the
Placement-Guarantee plan.
**Verify:** a test checkout upgrades the plan; a webhook flips entitlements.

## 4. Judge0 — real code execution + IDE analysis

**Set** in `apps/api/.env`:
```
JUDGE0_URL=https://<your-judge0-host>
JUDGE0_TOKEN=...                      # if self-hosted with auth / RapidAPI
```
**Lights up:** real submit/run on Problems + blind mode + pressure mode,
complexity analyzer, test-case generator, OA simulated coding.
**Verify:** submitting a solution returns real pass/fail from Judge0.

## 5. Email — transactional (optional but recommended)

`apps/api/.env`: `RESEND_API_KEY=re_...` (and `RESEND_FROM`).
**Lights up:** deadline nudges, streak reminders, mentor-session emails.

## 6. Still needs data/services (not a single key)

- **Scrapers** — live jobs, OA fingerprint DB, interview-experiences, placement
  calendars. Needs a scraping worker + sources; the schema + UIs are ready to
  ingest.
- **Video peer mocks** — Daily.co / 100ms room token service.
- **TURN server (peer mocks NAT traversal)** — the WebRTC code is wired; set in
  `apps/web/.env.local`:
  `NEXT_PUBLIC_TURN_URL=turn:…` `NEXT_PUBLIC_TURN_USERNAME=…` `NEXT_PUBLIC_TURN_CREDENTIAL=…`
  (managed: Twilio/Metered, or self-host coturn). Without it, peer mocks are
  STUN-only and fail on strict NAT — the UI shows a clear "connection failed" state.

---

## Production env (do NOT skip — see GO-LIVE.md)
```
NODE_ENV=production
JWT_ACCESS_SECRET=<32+ char random>   JWT_REFRESH_SECRET=<32+ char random>
API_CORS_ORIGINS=https://<your-domain>
ADMIN_ACCESS_CODE=<staff gate code>   # do NOT set a placeholder
# NEVER set DEV_LOGIN_ENABLED in prod
```

## One-pass activation order (when keys arrive)
1. Paste keys into the three env files (above).
2. Configure the two dashboard webhooks (Clerk, Razorpay) + Judge0 host.
3. `pnpm --filter @eyf/api build && restart api` · `pnpm --filter @eyf/web build && redeploy web`.
4. Run the per-service verifications above.
5. Flip prod flags (NODE_ENV, secrets, CORS, admin gate).

**Status:** all wiring is in place today. Hand me the keys and this becomes a
single execution pass.
