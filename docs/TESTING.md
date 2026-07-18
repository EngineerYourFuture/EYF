# Testing

**Audience:** engineers, QA.
**Related:** [BACKEND](BACKEND.md) · [DEVOPS](DEVOPS.md) · [TROUBLESHOOTING](TROUBLESHOOTING.md) · [CONTRIBUTING](CONTRIBUTING.md)

---

## Table of Contents

- [Strategy](#strategy)
- [Test inventory](#test-inventory)
- [Running tests](#running-tests)
- [Unit tests](#unit-tests)
- [Integration tests](#integration-tests)
- [E2E tests](#e2e-tests)
- [The RLS false negative](#the-rls-false-negative)
- [Coverage](#coverage)
- [Mocking](#mocking)
- [Fixtures](#fixtures)
- [Known issues](#known-issues)
- [Best practices](#best-practices)
- [Writing a new test](#writing-a-new-test)

---

## Strategy

```mermaid
flowchart TD
    subgraph Pyramid
        E["E2E — Playwright<br/>smoke, real browser"]
        I["Integration — Vitest + real Postgres<br/>11 files · routes, RLS, tenancy"]
        U["Unit — Vitest, pure<br/>46 @eyf/types + API lib/service tests"]
    end
    U --> I --> E
    style U fill:#2d5,color:#000
    style I fill:#fd5,color:#000
    style E fill:#f97,color:#000
```

The shape follows the architecture: **pure logic lives in `@eyf/types`, so the most valuable tests are also the cheapest.** Readiness scoring, plan ranking, and the capability maps need no database.

| Level | Tool | DB | Speed |
| --- | --- | --- | --- |
| Unit | Vitest | ❌ | ms |
| Integration | Vitest | ✅ real Postgres | ~20–30s |
| E2E | Playwright | ✅ full stack | slowest |

> [!NOTE]
> **Integration tests use a real database — not mocks.** The files are named `*.integration.test.ts` and connect to actual Postgres. This is a deliberate trade: slower tests in exchange for catching what mocked Prisma never would (constraints, cascades, RLS, transaction semantics).

---

## Test inventory

| Package | Files | Tests |
| --- | --- | --- |
| `@eyf/api` | 22 | **135** (134 pass, 1 known false negative) |
| `@eyf/types` | 5 | **46** |
| `@eyf/web` | Playwright specs in `apps/web/e2e/` | Smoke |

### `@eyf/types` — pure unit tests

| File | Covers |
| --- | --- |
| `index.test.ts` | `meetsPlan`, plan ranking |
| `readiness.test.ts` | `computeReadiness`, `rankActions` |
| `org-permissions.test.ts` | Org RBAC/ABAC matrix |
| `skill-ledger.test.ts` | Evidence → level roll-up |
| `webrtc.test.ts` | Peer signalling types |

### `@eyf/api` — unit tests

`lib/judge-retry.test.ts` · `lib/mock-feedback.test.ts` · `lib/org-token.test.ts` · `lib/rate-limits.test.ts` · `lib/subscription.test.ts` · `services/clerk-key.test.ts` · `services/assessment.test.ts` · `services/ats.test.ts` · `services/mcq.test.ts` · `services/pressure.test.ts` · `services/srs.test.ts`

> [!TIP]
> `services/clerk-key.test.ts` exists because `clerk-key.ts` was **deliberately split** from `clerk.ts` — *"so it can be unit-tested in isolation"* without importing env + prisma + the Clerk SDK. Extracting a pure function to make it testable is the pattern to copy.

### `@eyf/api` — integration tests (11 files, real DB)

`orgs` · `org-learn` · `org-hire` · `org-assess` · `org-paths` · `org-certificates` · `org-skills` · `org-settings` · `org-offers` · `org-ai` · `billing`

> [!NOTE]
> Every integration test targets the **enterprise/tenancy** surface — the area where a bug means cross-tenant data exposure. That prioritisation is correct.

---

## Running tests

```bash
pnpm test          # everything via turbo
pnpm test:ci       # @eyf/types + @eyf/api only (the CI gate)
pnpm --filter @eyf/types test
pnpm --filter @eyf/api test
pnpm --filter @eyf/web test:e2e
```

### Integration tests need a database

Without one, they **skip** rather than fail loudly:

```
Test Files  11 failed | 11 passed (22)
     Tests  69 passed | 66 skipped (135)
```

`Can't reach database server at localhost:5432` ⇒ the DB is not up.

Bring it up:

```bash
pnpm docker:up
pnpm db:generate
pnpm --filter @eyf/db exec prisma migrate deploy
pnpm --filter @eyf/db db:rls
pnpm --filter @eyf/api test           # → 134 passed | 1 failed
```

> [!WARNING]
> `.env` files ship with stale `user:password` credentials while `docker-compose.yml` provisions `eyf:eyf`. Either re-copy `.env.example` or pass credentials inline:
> ```bash
> export DATABASE_URL="postgresql://eyf:eyf@localhost:5432/eyf?schema=public"
> export DIRECT_DATABASE_URL="$DATABASE_URL"
> export REDIS_URL="redis://localhost:6379"
> ```

---

## Unit tests

```ts
import { describe, it, expect } from "vitest";
import { computeReadiness, rankActions, type ReadinessInput } from "./readiness";

describe("rankActions", () => {
  it("returns at most `limit` actions", () => {
    expect(rankActions(computeReadiness(empty), 2)).toHaveLength(2);
  });
});
```

Pure, no DB, no mocks, milliseconds. **This is where new logic should be tested.**

---

## Integration tests

Configured by `apps/api/vitest.config.ts`:

```ts
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: false,
    // The DB-backed integration tests share one Postgres, so running test files
    // in parallel races on shared fixtures (skill upserts, seeded ids). Run them
    // sequentially for deterministic, flake-free results.
    fileParallelism: false,
    coverage: { /* … */ },
  },
});
```

| Setting | Value | Why |
| --- | --- | --- |
| `fileParallelism` | **`false`** | Files share one Postgres; parallel runs race on fixtures |
| `globals` | `false` | Explicit imports — no ambient `describe`/`it` |
| `environment` | `node` | No DOM needed |

> [!WARNING]
> `fileParallelism: false` is why the suite takes ~20–30s. Do not "optimise" it back on without giving each file an isolated schema or database — the races it prevents are real (skill upserts, seeded ids).

Fixture pattern (`mkUser`) is repeated across ~11 files — duplication is tolerated in tests for explicitness.

---

## E2E tests

Playwright — `apps/web/playwright.config.ts`, specs in `apps/web/e2e/`, CI via `.github/workflows/e2e.yml`.

```bash
pnpm --filter @eyf/web test:e2e
```

Scope is **smoke-level**. A comprehensive E2E matrix is **Needs implementation**.

---

## The RLS false negative

One test fails and **is expected to fail locally and in CI**:

```
FAIL src/routes/orgs.integration.test.ts >
  org tenant isolation (real DB) >
  RLS backstop: an UNFILTERED query inside org A's context cannot see org B
AssertionError: expected false to be true
```

**This is not a bug in the application.** It fails identically on an untouched checkout.

### Root cause

`docker-compose.yml` sets `POSTGRES_USER: eyf`; the Postgres image makes that role a **superuser**:

```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname='eyf';
--  eyf | t | t
```

**Superusers bypass RLS unconditionally** — even with `FORCE ROW LEVEL SECURITY`, which `apply-rls.ts` correctly sets:

```sql
SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname='org_members';
--  org_members | t | t     ← RLS is correctly enabled AND forced
```

### The policy is proven correct

Two orgs' rows, one unfiltered query under `SET LOCAL app.org_id = 'ORG_A'`:

| Connecting role | Rows visible | Verdict |
| --- | --- | --- |
| `eyf` (superuser — what tests use) | ORG_A **and** ORG_B | RLS bypassed → test fails |
| non-superuser (production-like) | **ORG_A only** | ✅ Policy works |

```mermaid
flowchart TD
    T["RLS test"] --> C["connects as eyf"]
    C --> S{"rolsuper = t?"}
    S -->|yes| B["RLS bypassed<br/>sees both orgs → FAIL"]
    S -->|no| P["policy applies<br/>sees own org → PASS"]
    style B fill:#fdd,stroke:#900
    style P fill:#dfd,stroke:#090
```

> [!WARNING]
> **The danger is social, not technical.** A permanently red test invites someone to "fix" it by weakening the assertion — destroying a real tenant-isolation guard. Do not touch the assertion.

### The fix

Give the integration suite a dedicated **non-superuser** role:

```sql
CREATE ROLE eyf_app LOGIN PASSWORD '…';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eyf_app;
-- no BYPASSRLS, not a superuser
```

Then point `DATABASE_URL` at `eyf_app` for tests. This also matches production, where the app role must not be a superuser.

> [!NOTE]
> CI shares this blind spot — `ci.yml`'s `postgres:16` service uses the same superuser. Fixing local and CI together is one change.

---

## Coverage

```ts
coverage: {
  provider: "v8",
  reporter: ["text", "lcov"],
  reportsDirectory: "coverage",
  include: ["src/**/*.ts"],
  // Don't count tests, generated clients, or infra bootstrap against coverage.
  exclude: ["src/**/*.test.ts", "src/**/*.d.ts", "src/generated/**", "src/server.ts", "src/jobs/**"],
}
```

| Excluded | Why |
| --- | --- |
| `src/generated/**` | Generated Prisma client — not our code |
| `src/server.ts` | Process bootstrap — nothing to assert |
| `src/jobs/**` | Long-running workers |
| `*.test.ts`, `*.d.ts` | Tests and type declarations |

`lcov` feeds SonarQube (`sonar.yml`, `sonar-project.properties`).

> [!NOTE]
> **No coverage threshold is enforced** — coverage is reported, not gated. Adding a floor is **Needs implementation**.

---

## Mocking

Deliberately minimal:

| Dependency | Approach |
| --- | --- |
| Database | **Real Postgres** — no Prisma mocks |
| Redis (rate limiter) | In-memory store in `NODE_ENV=test` |
| Clerk | Absent keys ⇒ internal-JWT path |
| Anthropic / OpenAI / Razorpay / Judge0 | Absent keys ⇒ no-op |

> [!TIP]
> The "runs without keys" architecture **is** the mocking strategy. Because every integration no-ops without its key, tests exercise real code paths without stubs. This is why there is almost no mocking code in the repo.

The rate limiter's test-mode store is a correctness requirement:

```ts
...(env.NODE_ENV === "test" ? {} : { redis, nameSpace: "eyf-rl:" }),
```

A shared Redis store would leak counts across test files and make results order-dependent.

---

## Fixtures

Integration tests create their own data:

```ts
const mkUser = async (tag: string) => {
  const u = await prisma.user.create({
    data: { clerkId: `org_int_${tag}_${stamp}`, email: `org-int-${tag}-${stamp}@test.eyf`, /* … */ },
  });
  return u;
};
```

- Timestamp-suffixed ids avoid collisions across runs.
- `@test.eyf` marks fixture rows.

`pnpm db:seed` seeds dev users for `POST /v1/auth/dev-login` (dev, not tests).

---

## Known issues

| # | Issue | Impact |
| --- | --- | --- |
| 1 | RLS test is a false negative | Suite is never fully green |
| 2 | Fixture rows leak (`@test.eyf` users persist) | Accumulates; contributes to the races behind `fileParallelism: false` |
| 3 | Integration tests skip silently without a DB | 66 "skipped" reads as OK — easy to mistake for passing |
| 4 | No coverage threshold | Regressions in coverage are invisible |
| 5 | E2E is smoke-only | Limited regression safety on UI flows |
| 6 | `.env` drift | Tests fail on a fresh clone until env is fixed |

---

## Best practices

> [!TIP]
> **Put logic in `@eyf/types` and unit-test it there.** It is the fastest, most reliable layer, and both web and API get the guarantee.

- Prefer a pure function + unit test over an integration test.
- Extract to enable testing (see `clerk-key.ts`).
- Use integration tests for **constraints, cascades, and isolation** — things mocks cannot catch.
- Never assert on wall-clock time; use the `stamp` pattern for unique ids.
- Keep `fileParallelism: false` unless you isolate databases.
- Do not mock Prisma.
- Test the **envelope** (`{ success, data }`), not just the status code.

---

## Writing a new test

### Pure logic

```ts
// packages/types/src/thing.test.ts
import { describe, it, expect } from "vitest";
import { computeThing } from "./thing";

describe("computeThing", () => {
  it("clamps to 100", () => expect(computeThing({ raw: 150 })).toBe(100));
});
```

### Route touching the database

```ts
// apps/api/src/routes/widgets.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@eyf/db";
import { buildApp } from "../app.js";

describe("widgets (real DB)", () => {
  const stamp = Date.now();
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: `-${stamp}@test.eyf` } } });
    await app.close();
  });

  it("rejects anonymous callers", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/widgets" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHENTICATED");
  });
});
```

### Checklist

- [ ] `*.integration.test.ts` if it touches the DB
- [ ] Unique fixtures (`stamp`)
- [ ] **Clean up in `afterAll`** (issue #2 above)
- [ ] Assert the envelope and the error `code`
- [ ] Tenant tests: assert the **negative** (org B is invisible)

---

**Next:** [DEVOPS.md](DEVOPS.md) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) · [CONTRIBUTING.md](CONTRIBUTING.md)
