# Environment Variables

**Audience:** DevOps, backend engineers.
**Related:** [CONFIGURATION](CONFIGURATION.md) · [DEPLOYMENT](DEPLOYMENT.md) · [SECURITY](SECURITY.md) · [THIRD_PARTY_SERVICES](THIRD_PARTY_SERVICES.md)

---

## Table of Contents

- [How configuration works](#how-configuration-works)
- [The dual-.env gotcha](#the-dual-env-gotcha)
- [Core](#core)
- [Database](#database)
- [Cache](#cache)
- [API](#api)
- [Observability](#observability)
- [Secrets & auth](#secrets--auth)
- [Clerk](#clerk)
- [Razorpay](#razorpay)
- [Judge0](#judge0)
- [AI](#ai)
- [Email](#email)
- [Storage](#storage)
- [Web (Next.js)](#web-nextjs)
- [CI-only](#ci-only)
- [Validation behaviour](#validation-behaviour)
- [Generating secrets](#generating-secrets)

---

## How configuration works

The API's environment is a **Zod contract** (`apps/api/src/env.ts`) parsed at import time:

```ts
export const env = schema.parse(process.env);   // invalid → process refuses to boot
export type Env = z.infer<typeof schema>;
```

```mermaid
flowchart LR
    F[".env files"] --> D["dotenv/config<br/>(env.ts line 1)"]
    P["Platform env"] --> Z["Zod schema.parse"]
    D --> Z
    Z -->|valid| E["typed env object"]
    Z -->|invalid| X["throw → boot fails"]
```

> [!TIP]
> Fail-fast is deliberate: a missing `DATABASE_URL` or a 20-character JWT secret stops the process at startup rather than surfacing as a runtime 500 hours later.

Two classes of variable:

| Class | Read | Changing requires |
| --- | --- | --- |
| API runtime | At boot from `process.env` | Restart |
| `NEXT_PUBLIC_*` | **Inlined at build time** | **Rebuild** |

> [!WARNING]
> `NEXT_PUBLIC_*` values are baked into the client bundle. They are Docker **build args** (see `docker-compose.prod.yml`), not runtime config — and they are **public**. Never put a secret behind a `NEXT_PUBLIC_` prefix.

---

## The dual-.env gotcha

There are **three** `.env` files:

| File | Read by |
| --- | --- |
| `.env` (root) | `docker-compose*.yml`, tooling |
| `apps/api/.env` | **The API** — `dotenv/config` resolves from the API's cwd |
| `packages/db/.env` | Prisma CLI (`migrate`, `studio`, `seed`) |

> [!WARNING]
> **Editing the root `.env` alone does not change API behaviour.** The API reads `apps/api/.env`. This has caused real confusion. Keep them in sync, or consolidate on a single root file with explicit `dotenv` paths.

### Known drift (as of this writing)

| Issue | Detail |
| --- | --- |
| Stale credentials | `.env`, `apps/api/.env`, `packages/db/.env` use `user:password`; `docker-compose.yml` provisions `eyf:eyf`. `.env.example` is **correct**. |
| Missing var | `packages/db/.env` omits `DIRECT_DATABASE_URL`, which `schema.prisma:19` requires → `prisma migrate` fails with `P1012` out of the box. |

**Fix:** re-copy from `.env.example`.

---

## Core

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `NODE_ENV` | Runtime mode | No | `development` | `production` | Gates dev-login, pretty logs, error verbosity, Prisma query logging |
| `DEV_LOGIN_ENABLED` | Enable password-less dev login | No | **`false`** | `true` | 🔴 **Never `true` in production.** Mints admin sessions from an email alone. Fail-closed by default; also blocked when `NODE_ENV=production` |
| `BILLING_ENABLED` | Master switch for paywalls | No | **`false`** | `true` | ⚠️ While `false`, `requirePlan` is a no-op — **every authenticated user gets full access** |

> [!WARNING]
> `DEV_LOGIN_ENABLED` and `BILLING_ENABLED` are string-to-boolean transforms (`v === "true"`). Any other value — `1`, `yes`, `TRUE` — evaluates to **false**. That is fail-closed for dev-login (safe) and fail-closed for billing (paywalls stay off).

---

## Database

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `DATABASE_URL` | **Pooled** runtime connection | ✅ | — | `postgresql://eyf:eyf@localhost:5432/eyf?schema=public` | Must be a valid URL. Use the pooled endpoint in production |
| `DIRECT_DATABASE_URL` | **Unpooled** connection for migrations/DDL | No* | falls back to `DATABASE_URL` | `postgresql://…:5432/eyf` | *Required by `schema.prisma`; without it Prisma CLI fails `P1012` |

> [!WARNING]
> Transaction pooling **cannot run DDL**. In production set `DATABASE_URL` to the pooled endpoint and `DIRECT_DATABASE_URL` to the direct one. Getting this backwards exhausts connections or breaks migrations.

> [!WARNING]
> The database role must **not** be a superuser. Superusers bypass Row-Level Security unconditionally, silently disabling tenant isolation. See [SECURITY](SECURITY.md).

---

## Cache

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `REDIS_URL` | Cache, queues, rate-limit counters | No | `redis://localhost:6379` | `rediss://user:pass@host:6379` | Use `rediss://` (TLS) in production. Shared store makes rate limits global across instances |

---

## API

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `API_PORT` | Listen port | No | `4000` | `4000` | — |
| `API_HOST` | Bind address | No | `0.0.0.0` | `0.0.0.0` | `0.0.0.0` in containers; ensure the edge is the only ingress |
| `API_CORS_ORIGINS` | Comma-separated origin allowlist | No | `http://localhost:3000` | `https://app.eyf.in,https://eyf.in` | 🔴 **Never `*`** — used with `credentials: true` |
| `API_LOG_LEVEL` | Pino level | No | `info` | `warn` | `debug`/`trace` may log sensitive request data |
| `TRUST_PROXY_HOPS` | Exact count of trusted proxies | No | `1` | `2` | 🔴 Wrong value lets clients spoof `X-Forwarded-For` and defeat IP rate limiting. `1` behind one LB; raise if Cloudflare fronts it |

---

## Observability

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `SENTRY_DSN` | Error tracking | No | — | `https://…@…ingest.sentry.io/…` | No-ops when unset |
| `SENTRY_TRACES_SAMPLE_RATE` | Trace sampling (0–1) | No | `0.1` | `0.1` | Validated `min(0).max(1)` |
| `RELEASE` | Version/commit for Sentry + `/metrics` | No | `dev` | `$GITHUB_SHA` | Set to the commit SHA for release tracking |
| `METRICS_TOKEN` | Bearer token for `/metrics` | No | — | `<random>` | ⚠️ **Unset = `/metrics` is world-readable.** Set it, or restrict by network policy |

---

## Secrets & auth

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `JWT_ACCESS_SECRET` | Signs 15-minute access tokens | ✅ | — | `openssl rand -hex 32` | 🔴 **min 32 chars, enforced.** A short secret makes HS256 tokens offline-forgeable — including admin tokens |
| `JWT_REFRESH_SECRET` | Signs 30-day refresh tokens | ✅ | — | `openssl rand -hex 32` | 🔴 **Must differ from the access secret** — separation is what stops a refresh token being replayed as an access token |
| `ADMIN_ACCESS_CODE` | Second factor for `/admin` | No | — | `<strong value>` | Unset = gate disabled. Set in production |

---

## Clerk

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `CLERK_SECRET_KEY` | Server-side Clerk API | No | — | `sk_live_…` | 🔴 Secret. Absent ⇒ internal-JWT fallback |
| `CLERK_PUBLISHABLE_KEY` | Clerk key (API side) | No | — | `pk_live_…` | Public |
| `CLERK_WEBHOOK_SECRET` | svix signature verification | No | — | `whsec_…` | 🔴 Secret. Without it the webhook cannot be verified |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk in the browser | No | — | `pk_live_…` | Public; **build-time** |

> [!NOTE]
> `apps/web/middleware.ts` treats `pk_test_replace` and a specific base64 placeholder as "no real Clerk" and skips `clerkMiddleware` entirely — otherwise Clerk 404s app routes when it cannot reach a fake host.

---

## Razorpay

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `RAZORPAY_KEY_ID` | Public key id | No | — | `rzp_live_…` | Public |
| `RAZORPAY_KEY_SECRET` | API secret | No | — | — | 🔴 Secret |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC verification | No | — | — | 🔴 Secret. Without it webhooks cannot be trusted |

---

## Judge0

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `JUDGE0_URL` | Judge0 base URL | No | `http://localhost:2358` | `https://judge.internal` | Should be private/internal |
| `JUDGE0_TOKEN` | Auth token | No | — | — | 🔴 Secret if set |

---

## AI

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Claude — mocks, grading, coaching | No | — | `sk-ant-…` | 🔴 Secret, metered. Absent ⇒ AI features return `AI_UNAVAILABLE` |
| `OPENAI_API_KEY` | Whisper transcription | No | — | `sk-…` | 🔴 Secret, metered. Absent ⇒ voice no-ops |

> [!WARNING]
> `OPENAI_API_KEY` appears in `.env.example` under the **Web (Next.js)** section, but it is consumed by the **API** (`services/whisper.ts`) and validated in `env.ts`. It is **not** a `NEXT_PUBLIC_` variable and must never be exposed to the browser. The grouping in `.env.example` is misleading.

---

## Email

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `RESEND_API_KEY` | Transactional email | No | — | `re_…` | 🔴 Secret. Absent ⇒ email no-ops |
| `RESEND_FROM` | From address | No | `EYF <noreply@eyf.in>` | `EYF <noreply@eyf.in>` | Must be a verified domain |

---

## Storage

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare R2 account | No | — | — | — |
| `R2_ACCESS_KEY` | R2 key | No | — | — | 🔴 Secret |
| `R2_SECRET_KEY` | R2 secret | No | — | — | 🔴 Secret |
| `R2_BUCKET` | Bucket name | No | — | `eyf-uploads` | — |
| `R2_PUBLIC_URL` | Public CDN origin | No | — | `https://cdn.eyf.in` | Must match `next.config.mjs` `remotePatterns` |

> [!WARNING]
> **R2 variables are in `.env.example` but NOT in `env.ts`'s Zod schema.** They are not validated at boot, so a missing/typo'd R2 key fails at runtime rather than startup — breaking the fail-fast guarantee every other integration enjoys. Adding them to the schema (as `.optional()`) would close the gap.

---

## Web (Next.js)

All **build-time** and **public**.

| Variable | Purpose | Required | Default | Example | Security notes |
| --- | --- | :-: | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL | ✅ (build) | — | `http://localhost:4000/v1` | Its origin is injected into CSP `connect-src` — wrong value blocks every client fetch |
| `NEXT_PUBLIC_APP_URL` | Canonical web URL | No | — | `https://app.eyf.in` | Public |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key | No | — | `pk_live_…` | Public |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key | No | — | `phc_…` | Public; absent ⇒ analytics off |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host | No | — | `https://us.i.posthog.com` | Public |
| `ANALYZE` | Bundle analyzer | No | — | `true` | Dev only |

> [!TIP]
> `next.config.mjs` derives `apiOrigin` from `NEXT_PUBLIC_API_URL` and injects it into `connect-src`. If the API moves, rebuild the web app — a stale value produces CSP-blocked fetches that look like network errors.

---

## CI-only

Set in `ci.yml`; **not real secrets**:

| Variable | Value |
| --- | --- |
| `JWT_ACCESS_SECRET` | `ci-only-not-secret-32-character-key-pad` |
| `JWT_REFRESH_SECRET` | `ci-only-not-secret-32-character-key-padx` |
| `DATABASE_URL` / `DIRECT_DATABASE_URL` | `postgresql://eyf:eyf@localhost:5432/eyf` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_ci_placeholder` |
| `CLERK_SECRET_KEY` | `sk_test_ci_placeholder` |

CD secrets: `DATABASE_URL`, `DIRECT_DATABASE_URL` (GitHub Secrets); `NEXT_PUBLIC_*` (GitHub Variables).

---

## Validation behaviour

| Rule | Effect |
| --- | --- |
| `DATABASE_URL` must be a URL | Boot fails otherwise |
| `JWT_*_SECRET` ≥32 chars | Boot fails otherwise |
| `NODE_ENV` ∈ {development, test, production} | Boot fails otherwise |
| `API_LOG_LEVEL` ∈ {fatal…trace} | Boot fails otherwise |
| `SENTRY_TRACES_SAMPLE_RATE` ∈ [0,1] | Boot fails otherwise |
| `TRUST_PROXY_HOPS` int ≥0 | Boot fails otherwise |
| Third-party keys | All `.optional()` — features no-op |
| Unknown variables | Ignored (Zod strips) |

---

## Generating secrets

```bash
openssl rand -hex 32                      # JWT_ACCESS_SECRET
openssl rand -hex 32                      # JWT_REFRESH_SECRET  (must differ!)
openssl rand -hex 24                      # ADMIN_ACCESS_CODE
openssl rand -hex 24                      # METRICS_TOKEN
```

> [!WARNING]
> Never reuse the same value for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Their separation is a security control, not a convention — see [AUTHENTICATION](AUTHENTICATION.md).

Secret rotation procedure: **Needs implementation**.

---

**Next:** [CONFIGURATION.md](CONFIGURATION.md) · [THIRD_PARTY_SERVICES.md](THIRD_PARTY_SERVICES.md) · [DEPLOYMENT.md](DEPLOYMENT.md)
