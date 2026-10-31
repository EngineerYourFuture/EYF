# Troubleshooting

**Audience:** engineers, QA, DevOps.
**Related:** [CONTRIBUTING](CONTRIBUTING.md) · [TESTING](TESTING.md) · [DEPLOYMENT](DEPLOYMENT.md) · [OPERATIONS](OPERATIONS.md)

Real failures seen in this codebase, their root causes, and fixes.

---

## Table of Contents

- [Quick triage](#quick-triage)
- [Setup issues](#setup-issues)
- [Database issues](#database-issues)
- [Build failures](#build-failures)
- [Test failures](#test-failures)
- [Authentication issues](#authentication-issues)
- [Network & CORS issues](#network--cors-issues)
- [Runtime issues](#runtime-issues)
- [Deployment issues](#deployment-issues)
- [Diagnostic commands](#diagnostic-commands)

---

## Quick triage

```mermaid
flowchart TD
    S["Something's broken"] --> Q{Where?}
    Q -->|"Fresh clone won't run"| A["Setup issues"]
    Q -->|"Can't reach DB"| B["Database issues"]
    Q -->|"typecheck/build fails"| C["Build failures"]
    Q -->|"Tests red"| D["Test failures"]
    Q -->|"401 / 404 on app routes"| E["Auth issues"]
    Q -->|"Browser fetch blocked"| F["Network & CORS"]
    Q -->|"Works locally, not deployed"| G["Deployment issues"]
```

> [!TIP]
> Start with `pnpm typecheck && pnpm lint`. Both should be **completely clean** — this repo's baseline is zero errors and zero warnings. Any output there is a real signal, not noise.

---

## Setup issues

### `.env` credentials don't match Docker

**Symptom**

```
Authentication failed against database server at `localhost`,
the provided database credentials for `user` are not valid.
```

**Cause** — `.env`, `apps/api/.env`, and `packages/db/.env` may carry stale `user:password` placeholders, while `docker-compose.yml` provisions `eyf:eyf`. `.env.example` is correct.

**Fix**

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example packages/db/.env
```

### Editing `.env` changes nothing

**Cause** — The API reads **`apps/api/.env`** (via `dotenv/config` in `env.ts`), **not** the root `.env`. `packages/db/.env` is a third copy used by the Prisma CLI.

**Fix** — Edit the file the process actually reads. Verify:

```bash
grep DATABASE_URL apps/api/.env
```

### `Environment variable not found: DIRECT_DATABASE_URL` (P1012)

**Symptom**

```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Environment variable not found: DIRECT_DATABASE_URL.
  -->  prisma/schema.prisma:19
```

**Cause** — `schema.prisma` declares `directUrl = env("DIRECT_DATABASE_URL")`, but `packages/db/.env` omits it.

**Fix** — Add it (locally it may equal `DATABASE_URL`):

```bash
echo 'DIRECT_DATABASE_URL=postgresql://eyf:eyf@localhost:5432/eyf?schema=public' >> packages/db/.env
```

Or pass it inline:

```bash
DIRECT_DATABASE_URL="$DATABASE_URL" pnpm --filter @eyf/db exec prisma migrate deploy
```

### App boots then exits immediately

**Cause** — `env.ts` parses with Zod at import time and **throws** on invalid config. This is intentional fail-fast.

**Common triggers**

| Error | Fix |
| --- | --- |
| `JWT_ACCESS_SECRET: String must contain at least 32 character(s)` | `openssl rand -hex 32` |
| `DATABASE_URL: Invalid url` | Include the scheme: `postgresql://…` |
| `NODE_ENV: Invalid enum value` | One of `development` / `test` / `production` |

---

## Database issues

### 🔴 Two Postgres servers fight over port 5432

The highest-value entry in this document — it produces **confusing, misleading errors**.

**Symptom**

```
ConnectorError { PostgresError { code: "42501", message: "permission denied for schema public" } }
```

…even though `docker ps` shows a healthy container and `docker exec psql` works fine.

**Cause** — A local Postgres (e.g. Homebrew `postgresql@16`) binds `127.0.0.1:5432` and `[::1]:5432`, while Docker binds the wildcard `*:5432`. **The more specific bind wins**, so `localhost:5432` reaches the *local* server — a different database, with a different `eyf` role that lacks privileges.

**Diagnose**

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN
# com.docke … TCP *:5432 (LISTEN)
# postgres  … TCP 127.0.0.1:5432 (LISTEN)   ← the thief

psql "$DATABASE_URL" -c "SELECT version();"
# "(Homebrew)" ⇒ wrong server. The container reports "PostgreSQL 16.x" on Alpine.
```

**Fix** — either:

```bash
brew services stop postgresql@16          # free the port
```

or map the container elsewhere (`5433:5432` in `docker-compose.yml`) and update `DATABASE_URL`.

> [!WARNING]
> This can silently point **migrations** at the wrong database. If `migrate deploy` reports success but tables are missing, check the listener before anything else.

### `Can't reach database server at localhost:5432`

```bash
docker ps                     # containers running?
pnpm docker:up
docker exec eyf-postgres pg_isready -U eyf -d eyf
```

### Prisma client types missing / `@eyf/db` has no exports

**Cause** — The client is generated into `packages/db/src/generated/` and is git-ignored. A fresh clone has no client.

**Fix**

```bash
pnpm db:generate
```

> [!NOTE]
> Client generation is **not** a Turbo task — CI runs it explicitly. A fresh clone that skips it fails typecheck with missing types.

### Migration fails: DDL through a pooler

**Cause** — Transaction pooling cannot run DDL.

**Fix** — Point `DIRECT_DATABASE_URL` at the **unpooled** endpoint. See [DATABASE](DATABASE.md#connection-architecture).

### Prisma engine missing in Docker

```
Query engine library for current platform could not be found
```

**Cause** — `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` targets Alpine. Changing the base image breaks it.

**Fix** — Keep Alpine, or add the matching target to `schema.prisma` and regenerate.

---

## Build failures

### `Cannot find module './env'` at runtime

**Cause** — The API is **ESM**; relative imports must carry `.js`.

```ts
import { env } from "./env";      // ❌ fails at runtime
import { env } from "./env.js";   // ✅
```

> [!WARNING]
> This compiles cleanly and fails only at runtime. If a route 500s with a module-not-found error, check the import suffix first.

### Turbo serves a stale build

**Cause** — Turbo caches by content **and** `globalEnv`. A variable not listed there does not bust the cache.

```bash
pnpm build --force
```

> [!WARNING]
> `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, and `NEXT_PUBLIC_POSTHOG_HOST` are **absent from `globalEnv`** but are build args. Changing them may not invalidate the cache — use `--force`, and consider adding them.

### `NEXT_PUBLIC_*` change has no effect

**Cause** — Inlined at **build time**, not read at runtime.

**Fix** — Rebuild. In Docker they are **build args** (`docker-compose.prod.yml`), not `env_file` values.

### Lint fails on an unused variable

**Fix** — Prefix with `_`:

```ts
app.get("/readyz", async (_req, reply) => { … });
```

---

## Test failures

### 🟡 The RLS test always fails — **this is expected**

```
FAIL src/routes/orgs.integration.test.ts >
  RLS backstop: an UNFILTERED query inside org A's context cannot see org B
AssertionError: expected false to be true
```

**Cause** — `docker-compose.yml` sets `POSTGRES_USER: eyf`, which the Postgres image makes a **superuser**. Superusers **bypass RLS unconditionally**, even with `FORCE ROW LEVEL SECURITY`.

```bash
docker exec eyf-postgres psql -U eyf -d eyf \
  -c "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname='eyf';"
#  eyf | t | t     ← bypasses RLS
```

The policy is **correct** — verified by querying as a non-superuser, which sees only its own tenant.

> [!WARNING]
> **Do not "fix" this by weakening the assertion.** It guards real tenant isolation. The correct fix is a non-superuser test role. See [TESTING](TESTING.md#the-rls-false-negative).

**Expected baseline:** `134 passed | 1 failed`.

### Tests report `66 skipped` and 11 files "failed"

**Cause** — No database. Integration tests skip rather than fail.

**Fix**

```bash
pnpm docker:up
export DATABASE_URL="postgresql://eyf:eyf@localhost:5432/eyf?schema=public"
export DIRECT_DATABASE_URL="$DATABASE_URL"
export REDIS_URL="redis://localhost:6379"
pnpm --filter @eyf/db exec prisma migrate deploy
pnpm --filter @eyf/db db:rls
pnpm --filter @eyf/api test
```

### Flaky integration tests

**Cause** — Files share one Postgres and race on fixtures. This is why `vitest.config.ts` sets `fileParallelism: false`.

**Fix** — Don't re-enable parallelism. Clean up fixtures in `afterAll`; leaked `@test.eyf` rows accumulate:

```bash
docker exec eyf-postgres psql -U eyf -d eyf \
  -c "DELETE FROM users WHERE email LIKE '%@test.eyf';"
```

### Rate-limit tests interfere

**Cause** — A shared Redis store leaks counts across files.

**Fix** — Ensure `NODE_ENV=test`; the limiter then uses an in-memory store by design (`app.ts:74`).

---

## Authentication issues

### App routes 404 with placeholder Clerk keys

**Cause** — `clerkMiddleware` 404s app routes when it cannot reach a (fake) Clerk host.

**Fix** — `apps/web/middleware.ts` already handles this by skipping Clerk entirely for placeholder keys. If you see this, your key is *partially* set — either a real key or a recognised placeholder (`pk_test_replace`) is required. A random string is neither.

### `POST /v1/auth/dev-login` returns 404

**Cause** — Fail-closed by design:

```ts
if (!env.DEV_LOGIN_ENABLED || env.NODE_ENV === "production") return reply.code(404).send(…);
```

**Fix (local only)** — `DEV_LOGIN_ENABLED=true` **and** `NODE_ENV != production`.

> [!WARNING]
> If this returns anything but 404 in production, treat it as a **P0**. It mints admin sessions from an email alone.

### `404 USER_NOT_FOUND` on dev-login

**Fix** — `pnpm db:seed`.

### Logged out unexpectedly / `401 SESSION_REVOKED`

**Cause** — Working as intended. `MAX_SESSIONS = 3`; a fourth login evicts the oldest session row, and tokens carrying that `sid` immediately stop resolving.

### `403 ADMIN_GATE_REQUIRED`

**Cause** — `ADMIN_ACCESS_CODE` is set, so staff routes need a second factor.

**Fix**

```bash
curl -X POST $API/v1/admin/gate -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' -d '{"code":"<ADMIN_ACCESS_CODE>"}'
# then send x-admin-gate: <returned token> alongside the session token
```

Unset `ADMIN_ACCESS_CODE` locally to disable the gate.

### Org token rejected on user routes

**Cause** — Intentional. Org tokens share the signing secret but are not user sessions; `isOrgToken()` rejects them (`middleware/auth.ts:53`) to prevent a confused-deputy attack.

---

## Network & CORS issues

### Browser fetches fail; console shows a CSP violation

**Cause** — The browser talks **directly** to the API, so `NEXT_PUBLIC_API_URL`'s origin must appear in CSP `connect-src`. `next.config.mjs` derives it at build time.

**Fix** — Set `NEXT_PUBLIC_API_URL` correctly and **rebuild**. A stale value produces CSP-blocked fetches that look like network errors.

### `CORS policy: No 'Access-Control-Allow-Origin'`

**Fix** — Add the web origin to `API_CORS_ORIGINS` (comma-separated) and restart the API.

> [!WARNING]
> Never use `*`. CORS runs with `credentials: true`; a wildcard would be a critical misconfiguration.

### Rate limited unexpectedly (429)

**Cause** — Per-plan limits: `free` 60/min, `basic` 180, `pro` 600, `elite` 1200. **Anonymous traffic keys on IP** — behind a proxy, many users can share one key.

**Fix** — Set `TRUST_PROXY_HOPS` to the real proxy count so the client IP resolves correctly.

> [!WARNING]
> Do **not** set `trustProxy: true`. It trusts any hop, letting clients spoof `X-Forwarded-For` and bypass rate limiting entirely.

---

## Runtime issues

### Submissions stay `PENDING` forever

**Cause** — The judge worker is not running, or Judge0 is unreachable.

**Fix**

```bash
pnpm --filter @eyf/api dev:worker
docker compose --profile judge up -d
curl $JUDGE0_URL/about
```

> [!WARNING]
> In production, `api` alone is not enough — `worker`, `cron`, and `webhook` are separate processes. Deploying only `api` leaves submissions unjudged, alerts unsent, and webhooks undelivered.

### AI features return `AI_UNAVAILABLE`

**Cause** — `ANTHROPIC_API_KEY` unset. By design the feature no-ops; the UI shows *"This AI feature isn't configured yet."*

### Paid features accessible without paying

**Cause** — Not a bug. `BILLING_ENABLED` defaults to `false`, which makes `requirePlan` a **no-op** (`middleware/auth.ts:97`).

### `/metrics` returns 401

**Cause** — `METRICS_TOKEN` is set.

```bash
curl -H "Authorization: Bearer $METRICS_TOKEN" $API/metrics
```

### `/readyz` returns 503

**Cause** — Postgres or Redis unhealthy. The response body names the failing check.

```bash
curl -s $API/readyz | jq
```

---

## Deployment issues

### Images build and publish, but nothing deploys

**Cause** — `cd.yml`'s deploy job is an **echo-only stub**. Publishing works; promotion is not wired.

**Fix** — Wire the job to your platform. See [DEPLOYMENT](DEPLOYMENT.md#cd-pipeline).

### New org table leaks across tenants in production

**Cause** — **`db:rls` runs in CI but not in CD.** Production migrations do not reapply RLS policies.

**Fix** — Run it after every production migration, and add it to the CD `migrate` job:

```bash
pnpm --filter @eyf/db db:rls
```

### RLS appears to do nothing in production

**Cause** — The application's database role is a **superuser**. Superusers bypass RLS unconditionally.

```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;
```

**Fix** — Use a non-superuser role without `BYPASSRLS`.

### Rollback after a destructive migration

**Cause** — Prisma has no down-migrations; CD runs migrations **before** deploying code.

**Fix** — There is no automated path. Forward-fix or restore from backup. Prevent it: keep migrations additive (expand/contract).

---

## Diagnostic commands

```bash
# Health stack — baseline is completely clean
pnpm typecheck && pnpm lint && pnpm test:ci

# Which Postgres am I actually talking to?
lsof -nP -iTCP:5432 -sTCP:LISTEN
psql "$DATABASE_URL" -c "SELECT version(), current_user, current_database();"

# Is the app role a superuser? (RLS killer)
psql "$DATABASE_URL" -c "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;"

# Is RLS enabled + forced?
psql "$DATABASE_URL" -c "SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname='org_members';"

# Containers + migration state
docker ps
pnpm --filter @eyf/db prisma:status

# API health
curl -s localhost:4000/livez
curl -s localhost:4000/readyz | jq

# Correlate a user report with Sentry
curl -sI localhost:4000/v1/problems | grep -i x-request-id

# Dead code / cycles / duplication
npx knip
npx madge --circular --extensions ts,tsx apps/api/src
```

---

**Next:** [TESTING.md](TESTING.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [OPERATIONS.md](OPERATIONS.md)
