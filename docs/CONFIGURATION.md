# Configuration

**Audience:** engineers, DevOps.
**Related:** [ENVIRONMENT_VARIABLES](ENVIRONMENT_VARIABLES.md) · [DEPLOYMENT](DEPLOYMENT.md) · [CODEBASE_GUIDE](CODEBASE_GUIDE.md)

Every configuration file in the repository, what it does, and why it is set that way.

---

## Table of Contents

- [Inventory](#inventory)
- [pnpm-workspace.yaml](#pnpm-workspaceyaml)
- [package.json (root)](#packagejson-root)
- [turbo.json](#turbojson)
- [tsconfig.base.json](#tsconfigbasejson)
- [.eslintrc.json](#eslintrcjson)
- [Prettier](#prettier)
- [next.config.mjs](#nextconfigmjs)
- [tailwind.config.ts](#tailwindconfigts)
- [middleware.ts](#middlewarets)
- [vitest.config.ts](#vitestconfigts)
- [playwright.config.ts](#playwrightconfigts)
- [schema.prisma](#schemaprisma)
- [docker-compose.yml](#docker-composeyml)
- [docker-compose.prod.yml](#docker-composeprodyml)
- [Dockerfiles](#dockerfiles)
- [GitHub Actions](#github-actions)
- [lighthouserc.json](#lighthousercjson)
- [sonar-project.properties](#sonar-projectproperties)
- [Other files](#other-files)

---

## Inventory

| File | Scope | Purpose |
| --- | --- | --- |
| `pnpm-workspace.yaml` | Root | Workspace globs |
| `package.json` | Root | Scripts, engines, overrides |
| `turbo.json` | Root | Task graph + caching |
| `tsconfig.base.json` | Root | Shared TS compiler options |
| `.eslintrc.json` | Root | Lint rules |
| `.gitignore`, `.dockerignore` | Root | Exclusions |
| `.node-version` | Root | Node pin |
| `lighthouserc.json` | Root | Performance/a11y budgets |
| `sonar-project.properties` | Root | SonarCloud |
| `docker-compose.yml` | Root | Local datastores |
| `docker-compose.prod.yml` | Root | Production topology |
| `apps/web/next.config.mjs` | Web | CSP, headers, standalone |
| `apps/web/tailwind.config.ts` | Web | Design tokens |
| `apps/web/middleware.ts` | Web | Clerk route protection |
| `apps/web/playwright.config.ts` | Web | E2E |
| `apps/web/postcss.config.js` | Web | Tailwind/PostCSS |
| `apps/api/vitest.config.ts` | API | Test runner |
| `packages/db/prisma/schema.prisma` | DB | Schema + datasource |
| `packages/config/*` | Shared | ESLint/Tailwind/TS bases |
| `.github/workflows/*.yml` | CI/CD | 6 pipelines |
| `infra/terraform/*.tf` | Infra | IaC |

---

## pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

> [!NOTE]
> The root `package.json` **also** declares a `workspaces` array. pnpm reads `pnpm-workspace.yaml`; the `workspaces` field is npm/yarn convention and is redundant here — harmless, but only the YAML is authoritative.

---

## package.json (root)

| Field | Value | Notes |
| --- | --- | --- |
| `packageManager` | `pnpm@9.12.0` | Pinned; corepack uses this exact version |
| `engines.node` | `>=20.10.0` | Matches `.node-version` and CI |
| `private` | `true` | Never published |
| `pnpm.overrides` | `{ "ioredis": "5.10.1" }` | Forces one ioredis across the tree |

### Scripts

| Script | Runs |
| --- | --- |
| `dev` | `turbo run dev` — web + api |
| `build` | `turbo run build` |
| `lint` | `turbo run lint` |
| `typecheck` | `turbo run typecheck` |
| `test` | `turbo run test` |
| `test:ci` | `turbo run test --filter=@eyf/types --filter=@eyf/api` |
| `clean` | `turbo run clean && rm -rf node_modules` |
| `db:generate` / `db:migrate` / `db:studio` / `db:seed` | Prisma via `@eyf/db` |
| `docker:up` / `docker:down` / `docker:logs` | Local datastores |

> [!TIP]
> `test:ci` deliberately excludes `@eyf/web` — web has Playwright E2E, not Vitest. Running `pnpm test` locally is fine; CI uses `test:ci`.

> [!WARNING]
> `pnpm.overrides` pins `ioredis@5.10.1` globally. BullMQ and `@fastify/rate-limit` both depend on ioredis; a version split would create two connection pools and subtly break rate limiting. Do not remove the override without testing both.

---

## turbo.json

```json
{
  "globalDependencies": [".env"],
  "globalEnv": ["NODE_ENV", "DATABASE_URL", "REDIS_URL", "…"],
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "dev":       { "cache": false, "persistent": true, "dependsOn": ["^build"] },
    "lint":      { "outputs": [] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] },
    "test":      { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "clean":     { "cache": false }
  }
}
```

| Concept | Meaning |
| --- | --- |
| `^build` | Build dependencies **first** — `@eyf/types` before `apps/api` |
| `globalEnv` | Listed vars are part of the cache key |
| `globalDependencies` | `.env` changes bust the cache |
| `outputs` | What to cache and restore |
| `dev` | Never cached, persistent |

> [!WARNING]
> **`globalEnv` must list every env var that affects a build output.** Missing one means Turbo serves a stale cached build when that variable changes. `NEXT_PUBLIC_*` values are inlined at build time — note that `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, and `NEXT_PUBLIC_POSTHOG_HOST` are **absent** from `globalEnv` despite being build args in `docker-compose.prod.yml`. Changing them may not invalidate the Turbo cache.

> [!NOTE]
> `!.next/cache/**` excludes Next's internal cache from the Turbo artifact — caching a cache would bloat artifacts for no gain.

---

## tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "incremental": true
  }
}
```

| Option | Effect |
| --- | --- |
| `strict` | All strict checks |
| **`noUncheckedIndexedAccess`** | `arr[0]` is `T \| undefined` — forces explicit handling |
| `noImplicitOverride` | `override` keyword required |
| `noFallthroughCasesInSwitch` | Catches missing `break` |
| `skipLibCheck` | Skips `.d.ts` checking (large generated Prisma client) |
| `isolatedModules` | Each file transpiles independently |

> [!TIP]
> `noUncheckedIndexedAccess` explains the `!` you see after array access (`copy.splice(idx, 1)[0]!`). It is a strong safety setting that catches real bugs — the assertions are the intended escape hatch when the index is provably valid.

---

## .eslintrc.json

```json
{
  "root": true,
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "ignorePatterns": ["dist", "build", ".next", ".turbo", "node_modules", "**/generated/**", "coverage", "*.config.*", "*.mjs"],
  "rules": {
    "no-empty": ["error", { "allowEmptyCatch": true }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
  }
}
```

Rule rationale:

| Rule | Setting | Why |
| --- | --- | --- |
| `no-empty` | `allowEmptyCatch: true` | Deliberate swallows exist (`catch { /* fall through to internal JWT */ }`) |
| `no-explicit-any` | **off** | Would fire on the generated Prisma client. In practice hand-written code has **zero** `: any` |
| `no-non-null-assertion` | **off** | `req.session!` / `req.orgCtx!` are the established pattern (271 uses) after a guard has run |
| `no-unused-vars` | error, `^_` escape | Prefix intentionally unused args with `_` |

Enforcement: `--max-warnings 0` in every package.

> [!NOTE]
> `no-explicit-any` being off is **not** a quality compromise here — `**/generated/**` is ignored, and an audit found **0 `: any` in hand-written code** and only 2 `as any` (both at third-party SDK boundaries). The rule is off for pragmatism, not permissiveness.

Per-app lint commands:

| App | Command |
| --- | --- |
| `web` | `next lint --max-warnings 0` |
| `api` | `eslint src --max-warnings 0` |
| `mobile` | `eslint . --ext .ts,.tsx --max-warnings 0` |

---

## Prettier

> [!WARNING]
> **Not implemented.** There is no `.prettierrc`, `prettier.config.*`, or `prettier` key in any `package.json`, and no format script.
>
> Formatting is currently governed only by ESLint and convention. The codebase is nonetheless consistent (2-space indent, double quotes, semicolons, trailing commas) — but that consistency is **unenforced**.
>
> Adding Prettier is a recommended improvement; see [ROADMAP](ROADMAP.md). Introduce it with `eslint-config-prettier` to avoid rule conflicts, and expect one large reformatting commit.

---

## next.config.mjs

The most security-relevant config in the repo. Full directive table in [SECURITY](SECURITY.md#csp--security-headers).

| Setting | Value | Why |
| --- | --- | --- |
| `reactStrictMode` | `true` | Surfaces unsafe lifecycles (and double-mounts in dev) |
| `transpilePackages` | `["@eyf/ui", "@eyf/types"]` | Workspace packages ship TS |
| `poweredByHeader` | `false` | Removes `X-Powered-By` |
| `output` | `"standalone"` | Self-contained server bundle for Docker |
| `outputFileTracingRoot` | `../../` | Monorepo root, so tracing finds workspace deps |
| `images.formats` | `["image/avif", "image/webp"]` | Modern formats |
| `images.remotePatterns` | R2 + `cdn.eyf.in` | Allowlist |
| `headers()` | CSP + HSTS + XFO + nosniff + Referrer + Permissions | Applied to `/:path*` |

Dynamic CSP `connect-src`:

```js
const apiOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin; } catch { return ""; }
})();
```

> [!WARNING]
> The browser talks **directly** to the API, so `NEXT_PUBLIC_API_URL`'s origin must be in `connect-src` or every client fetch is CSP-blocked. Dev-only localhost/ws origins are appended **only** when `NODE_ENV !== "production"` — the builder can never loosen production.

Bundle analyzer:

```bash
ANALYZE=true pnpm --filter @eyf/web build
```

---

## tailwind.config.ts

Extends the shared preset in `@eyf/config`. Design tokens are CSS custom properties defined in `app/globals.css` and surfaced as Tailwind classes (`text-text-3`, `border-border`, `bg-[rgb(var(--lp-paper))]`).

Rules and token names: [DESIGN](DESIGN.md).

---

## middleware.ts

Clerk route protection with a placeholder-key fallback. See [AUTHENTICATION](AUTHENTICATION.md#frontend-integration).

```js
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
```

> [!TIP]
> The matcher excludes `_next` and static extensions so middleware does not run on every asset — a real performance consideration. `js(?!on)` excludes `.js` but keeps `.json`.

---

## vitest.config.ts

See [TESTING](TESTING.md). Key: `fileParallelism: false` (shared Postgres), `globals: false`, coverage excludes `src/generated/**`, `src/server.ts`, `src/jobs/**`.

---

## playwright.config.ts

E2E config for `apps/web/e2e/`, run in `.github/workflows/e2e.yml`.

---

## schema.prisma

```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../src/generated/client"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

| Setting | Why |
| --- | --- |
| `output` | Generated into the package, re-exported by `src/index.ts` |
| `binaryTargets` | `native` for local; **`linux-musl-openssl-3.0.x` for Alpine containers** |

> [!WARNING]
> Changing the Docker base image away from Alpine requires updating `binaryTargets`, or Prisma fails at runtime with a missing query engine.

Datasource `url`/`directUrl` split: [DATABASE](DATABASE.md#connection-architecture).

---

## docker-compose.yml

Local datastores.

| Service | Image | Port |
| --- | --- | --- |
| `postgres` | `postgres:16-alpine` | 5432 |
| `redis` | `redis:7-alpine` | 6379 |
| Judge0 | profile `judge` | 2358 |

```yaml
environment:
  POSTGRES_USER: eyf
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-eyf}
  POSTGRES_DB: eyf
```

> [!WARNING]
> `POSTGRES_USER: eyf` becomes a **superuser**, which **bypasses RLS unconditionally**. This is why the RLS isolation test cannot pass locally. See [TESTING](TESTING.md#the-rls-false-negative).

Judge0 is opt-in:

```bash
docker compose --profile judge up -d
```

---

## docker-compose.prod.yml

Five app services + optional datastores. See [DEPLOYMENT](DEPLOYMENT.md#docker-compose-production).

```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
```

> [!TIP]
> `:?` makes compose **refuse to start** without the variable. Good fail-closed design — copy it for any required production secret.

---

## Dockerfiles

Multi-stage; see [DEPLOYMENT](DEPLOYMENT.md#docker-images).

| Stage | Purpose |
| --- | --- |
| `base` | `node:20-alpine` + corepack |
| `deps` | Manifests only → `pnpm install --frozen-lockfile` with a cache mount |
| `build` | `prisma:generate` + compile |
| `deploy` | Pruned production bundle |

---

## GitHub Actions

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | push/PR `master`/`main` | typecheck → lint → migrate → rls → test → build |
| `cd.yml` | push `main`, dispatch | migrate → build/push images → deploy (**stub**) |
| `security.yml` | push/PR `main`, weekly Mon 06:00 UTC | CodeQL, Semgrep, gitleaks, `pnpm audit` |
| `sonar.yml` | — | SonarCloud |
| `lighthouse.yml` | — | Performance/a11y budgets |
| `e2e.yml` | — | Playwright |

> [!NOTE]
> `ci.yml` SHA-pins its actions; `cd.yml` uses floating tags (`@v4`). CD holds deploy secrets and deserves the stricter pinning.

---

## lighthouserc.json

```json
{
  "ci": {
    "collect": { "startServerCommand": "pnpm --filter @eyf/web start", "url": ["http://localhost:3000/"], "numberOfRuns": 1, "settings": { "preset": "desktop" } },
    "assert": {
      "assertions": {
        "categories:accessibility":  ["error", { "minScore": 0.9 }],
        "categories:performance":    ["warn",  { "minScore": 0.6 }],
        "categories:best-practices": ["warn",  { "minScore": 0.8 }],
        "categories:seo":            ["warn",  { "minScore": 0.9 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

| Category | Level | Min |
| --- | --- | --- |
| Accessibility | **error** | 0.90 |
| Performance | warn | 0.60 |
| Best practices | warn | 0.80 |
| SEO | warn | 0.90 |

> [!TIP]
> **Accessibility is the only hard gate** — the single `error` assertion. That is a deliberate values statement: a11y regressions block, performance regressions warn.

Limitations: **desktop only**, `numberOfRuns: 1` (noisy), **landing page only**.

---

## sonar-project.properties

```properties
sonar.projectKey=EngineerYourFuture_EYF
sonar.organization=engineeryourfuture
sonar.sources=apps,packages
sonar.tests=apps,packages
```

Consumes the `lcov` coverage report.

---

## Other files

| File | Purpose |
| --- | --- |
| `.node-version` | Node pin for version managers |
| `.gitignore` | Excludes `.env`, `node_modules`, `.next`, `dist`, `coverage`, `src/generated` |
| `.dockerignore` | Keeps build context small |
| `CLAUDE.md` | AI-assistant instructions — health stack + skill routing |
| `infra/terraform/*.tf` | `main.tf`, `variables.tf`, `outputs.tf` |
| `load/k6-smoke.js` | `BASE_URL=… k6 run load/k6-smoke.js` |

---

**Next:** [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) · [DEVOPS.md](DEVOPS.md) · [CODEBASE_GUIDE.md](CODEBASE_GUIDE.md)
