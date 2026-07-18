# Glossary

**Audience:** everyone — especially new joiners and non-engineers.
**Related:** [PROJECT_OVERVIEW](PROJECT_OVERVIEW.md) · [SYSTEM_ARCHITECTURE](SYSTEM_ARCHITECTURE.md) · [CODEBASE_GUIDE](CODEBASE_GUIDE.md)

Every domain and technical term used in this codebase, defined as **this project** uses it.

---

## Table of Contents

- [Product concepts](#product-concepts)
- [Student surfaces](#student-surfaces)
- [Enterprise concepts](#enterprise-concepts)
- [Roles & authority](#roles--authority)
- [Plans & billing](#plans--billing)
- [Architecture terms](#architecture-terms)
- [Codebase conventions](#codebase-conventions)
- [Data model terms](#data-model-terms)
- [Security terms](#security-terms)
- [Operations terms](#operations-terms)
- [Third-party services](#third-party-services)
- [Easily confused pairs](#easily-confused-pairs)

---

## Product concepts

| Term | Definition |
| --- | --- |
| **EYF** | Engineer Your Future — the platform. Also the npm scope: `@eyf/*` |
| **Placement** | Landing a job, typically through Indian campus recruitment. The product's north star |
| **Placement OS** | The positioning: one platform from first DSA concept to offer letter, replacing a dozen disconnected tools |
| **Placement Readiness score** | The flagship metric — a single number answering *"am I ready?"*. Computed by `computeReadiness()` in `packages/types/src/readiness.ts`, shared by web and API |
| **Pillar** | One dimension of readiness. Every activity feeds one; the weakest pillar drives guidance |
| **Guidance / next actions** | Ranked recommendations from `rankActions()`, served by `GET /v1/guidance/me`. The output of readiness — the loop's closing step |
| **The integration thesis** | The strategic bet: any single surface is clonable; the defensible asset is the **loop** — every activity feeds one score which drives what you do next |
| **Persona** | `STUDENT` · `SWITCHER` · `DEVELOPER` — tailors the journey (`Persona` enum) |
| **Score moment** | The retention device: the readiness ring animates from the score you *last saw* to today's, with a delta chip. Powered by `lib/score-memory.ts` |
| **Comeback engine** | Rejection Recovery — turns a rejection into a plan (`lib/comeback.ts`) |
| **Wrapped** | Year-in-review, shareable (`/v1/wrapped/me/:year`) |

---

## Student surfaces

| Term | Definition |
| --- | --- |
| **DSA** | Data Structures & Algorithms — the core of Indian technical interviews |
| **Judge / verdict** | Automated code execution against test cases. `Verdict` defaults to `PENDING` until the worker returns |
| **Pattern** | An algorithmic technique (sliding window, two pointers…). `Problem.patterns` is indexed for faceted browse |
| **Editorial** | The written explanation of a problem's solution — AI-generatable |
| **Problem variant** | An AI-generated mutation of a problem |
| **Cognitive games** | Timed games (spatial, stroop) measuring cognitive traits |
| **Pressure mode** | Practice under simulated interview stress (`PressureSession`) |
| **Composure** | Performance stability under pressure; trended at `/v1/mocks/composure` |
| **Code DNA** | A fingerprint of coding style/behaviour |
| **SRS** | Spaced Repetition System — flashcard scheduling (`services/srs.ts`) |
| **MCQ** | Multiple-choice question — aptitude/core-subject drilling |
| **Company sim** | A simulated company-specific test (`CompanySimBlueprint`) |
| **OA** | Online Assessment — the screening round. "OA fingerprints" are crowd-sourced reports of what a company actually asks |
| **AI mock** | An interview conducted by Claude (`services/ai-mock.ts`) |
| **Peer mock** | A student-to-student mock over WebRTC (`PeerQueue`, `services/peer-matching.ts`) |
| **Communication drill** | A spoken-answer exercise, transcribed by Whisper and graded by Claude |
| **ATS** | Applicant Tracking System — the software that screens résumés. `services/ats.ts` scores a résumé against it |
| **Resume gap** | Missing skills/experience for a target role |
| **Pipeline** | The student's Kanban of applications |
| **Track** | A career track (`CareerTrack`); a student picks a primary |
| **Roadmap** | A generated personalised study plan (`services/roadmap-generator.ts`) |
| **Mission** | A daily task with bonus XP (`MissionDay`) |
| **Streak** | Consecutive active days (`DailyStreak`). The `streak-break-alert` cron fires 21:00 IST |
| **Roast** | A humorous AI résumé critique (`services/roast.ts`) |

---

## Enterprise concepts

| Term | Definition |
| --- | --- |
| **B2B / enterprise platform** | The white-label LMS + assessment + hiring suite for companies and colleges |
| **Org / tenant** | An `Organization` — the unit of multi-tenancy |
| **Access code** | The legacy employer-portal credential (`Organization.accessCode`). Guessable ⇒ rate-limited to **5/min** |
| **Seat** | A licensed membership. `seatsLicensed` caps invites |
| **LMS** | Learning Management System — courses, lessons, enrolments |
| **Learning path** | An ordered sequence of items (`LearningPath` → `PathItem`) |
| **Cohort** | A group progressing through a path together |
| **Stuck detector** | Cohort-funnel analysis identifying learners who have stalled |
| **Two-person publish** | A workflow rule: `learn:author` submits, `learn:publish` approves. Enforced **in routes**, not the capability map |
| **Blueprint** | An assessment template (`AssessmentBlueprint`) |
| **Run / attempt** | An administered assessment (`AssessmentRun`) and one member's sitting (`AssessmentAttempt`) |
| **Skill Ledger** | *"The moat"* — the evidence graph. `SkillEvidence` rows carry a `level` (0–100), a `weight` (source trust), and a `decayHalfLifeDays` (default 180) so stale claims fade |
| **Evidence** | A single demonstration of a skill. `orgId = null` ⇒ earned via B2C activity; non-null ⇒ earned inside a tenant |
| **Weight** | Trust in an evidence source — a lesson completion weighs less than judged code |
| **Role bar** | The skill profile a role requires (`RoleBar` → `RoleBarSkill`) |
| **Skill matrix** | Org-wide view of skills vs. people |
| **Requisition** | An open role (`JobRequisition`) |
| **Talent search** | Evidence-based candidate search — **consent-gated** via `TalentConsent` |
| **Carry-over** | A candidate's platform profile carrying into a tenant's hiring pipeline |
| **Usage counter** | Per-tenant metering (`UsageCounter`) |

---

## Roles & authority

| Term | Definition |
| --- | --- |
| **Role** | The **platform** role — `Role` enum: `GUEST`, `STUDENT_FREE/BASIC/PRO/ELITE`, `MENTOR`, `MODERATOR`, `CONTENT_CREATOR`, `ADMIN` |
| **OrgRole** | The **tenant** role — `OWNER`, `ADMIN`, `HR`, `RECRUITER`, `LND`, `ENG_MANAGER`, `INSTRUCTOR`, `MENTOR`, `REVIEWER`, `MEMBER`, `INTERN`. A member may hold **several** |
| **Capability** | A named permission. Staff: 7 (`manage:content`, `manage:users`, `manage:payments`, `moderate`, `verify:mentors`, `view:analytics`, `issue:certificates`) |
| **Org capability** | One of 21 tenant permissions (`org:manage`, `learn:author`, `hire:offer`…) |
| **RBAC** | Role-Based Access Control — *may this role ever do this?* |
| **ABAC** | Attribute-Based Access Control — *over which rows?* Answered by a **scope** |
| **Scope** | Reach of a granted capability, narrow → wide: `own` · `mentees` · `team` · `department` · `org` |
| **The two-step contract** | `can()` **decides**; the caller **must** apply the returned scope as a query filter. The type system cannot enforce the second half |
| **Staff / staff portal** | Internal back-office (`/admin`). `isStaffRole()` = holds any capability |
| **Admin gate** | A second factor on `/admin`: `x-admin-gate` JWT bound to the staff user's id, issued after entering `ADMIN_ACCESS_CODE` |
| **L&D** | Learning & Development (the `LND` org role) |

---

## Plans & billing

| Term | Definition |
| --- | --- |
| **Plan** | `free` · `basic` · `pro` · `elite` |
| **`meetsPlan`** | The gate. `requirePlan(["pro"])` means **"pro or above"** — the *lowest* listed tier is the minimum |
| **`PLAN_RANK`** | `free:0, basic:1, pro:2, elite:3` |
| **Rate limit** | Per-plan requests/min: 60 / 180 / 600 / 1200 |
| **Submission limit** | Per-plan submissions/day: 5 / 20 / ∞ / ∞ |
| **`BILLING_ENABLED`** | Master paywall switch. **Default `false`**, which makes `requirePlan` a **no-op** — every authenticated user gets full access |
| **Paisa** | 1/100 of a rupee. `Subscription.amountInr` is stored in **paisa**, not rupees |
| **Platform fee** | EYF's cut of a paid mentor mock (`PLATFORM_FEE_PCT`) |
| **Payout** | Mentor earnings via Razorpay Connect (`MentorPayout`) |

---

## Architecture terms

| Term | Definition |
| --- | --- |
| **Monorepo** | One repository, many packages — Turborepo + pnpm workspaces |
| **Turborepo** | The task runner. `^build` = build dependencies first |
| **`globalEnv`** | Turbo env vars that are part of the cache key. Omitting one ⇒ stale cached builds |
| **Workspace package** | `@eyf/db`, `@eyf/types`, `@eyf/ui`, `@eyf/config` |
| **`@eyf/types`** | The pure, dependency-free shared package — readiness, plans, permissions. **The reason web and API can never disagree** |
| **Composition root** | `buildApp()` in `apps/api/src/app.ts`, where plugin order is decided |
| **Decorator** | Fastify's DI mechanism — `app.decorate("requireAuth", …)` → `app.requireAuth` |
| **`fastify-plugin` / `fp`** | Wrapper that breaks encapsulation so a plugin's decorators are visible app-wide |
| **preHandler** | The Fastify hook where guards run |
| **Envelope** | The universal response shape: `{ success: true, data }` or `{ success: false, error }` |
| **Graceful degradation** | Every third-party key is `.optional()`; features no-op rather than crash. The app runs with **zero** external keys |
| **Route group** | Next.js `(app)`, `(admin)` — organises files **without** adding a URL segment |
| **Standalone output** | Next's self-contained server bundle for Docker |
| **SWR** | The client data layer (stale-while-revalidate). Also the de-facto **state manager** — there is no Redux/Zustand |
| **Escape-hatch policy** | The RLS model: filter hard when `app.org_id` is set; pass everything when it is not (admin/cron) |

---

## Codebase conventions

| Term | Definition |
| --- | --- |
| **`*-bank.ts`** | **Legacy** hardcoded content arrays |
| **`*-source.ts`** | **Current** DB-first content source, with the bank as fallback. **New code calls these** |
| **Import-bank** | The admin endpoint migrating a legacy bank into DB rows |
| **`_name.tsx`** | A colocated non-route module in the App Router (`_tabs.tsx`, `_field.tsx`) |
| **`*.integration.test.ts`** | A test requiring a **real** database |
| **`.js` suffix** | Required on API relative imports — the API is ESM. `import { env } from "./env.js"` even though the file is `.ts` |
| **Health stack** | `pnpm typecheck` · `pnpm lint` · `pnpm test:ci` (defined in `CLAUDE.md`) |
| **Check-then-act** | Verify ownership, then mutate — makes the `orgId` check structural rather than trusting a caller's `where` |
| **Extract to make testable** | Splitting a pure decision out of an integration module so it can be unit-tested (`clerk-key.ts` ← `clerk.ts`) |

---

## Data model terms

| Term | Definition |
| --- | --- |
| **Prisma** | The ORM. Schema at `packages/db/prisma/schema.prisma` (87 models, 47 enums) |
| **cuid** | Collision-resistant id — every model's `@id` |
| **`@@map`** | Maps a camelCase model to a snake_case table (`OrgMember` → `org_members`) |
| **Pooled vs direct** | `DATABASE_URL` (pooled) for runtime; `DIRECT_DATABASE_URL` (unpooled) for migrations — **transaction pooling cannot run DDL** |
| **Expand/contract** | Additive migration → deploy → backfill → drop in a *later* release. Mandatory: CD migrates **before** the new code deploys |
| **Soft delete** | `User.deletedAt` — a **column, not a global filter**. Reads must exclude it explicitly |
| **Cascade** | `onDelete: Cascade` (82 uses) — deleting a `User`/`Organization` removes what it owns |
| **`SetNull`** | Used where the child must outlive the parent (`OrgMember.department`, `Skill.parent`) |
| **`lastEventAt`** | Guards against **out-of-order** webhook delivery — a stale event cannot downgrade a live subscription |

---

## Security terms

| Term | Definition |
| --- | --- |
| **RLS** | Row-Level Security — Postgres-enforced tenant isolation (layer 2), on 17 tables + `organizations` |
| **`FORCE ROW LEVEL SECURITY`** | Makes the table **owner** subject to the policy too |
| **`BYPASSRLS` / superuser** | **Superusers bypass RLS unconditionally** — the reason the isolation test is a false negative locally and in CI |
| **`withOrgContext`** | Runs a transaction with `SET LOCAL app.org_id`, activating the policies. `SET LOCAL` is transaction-scoped, so pooled connections stay clean |
| **GUC** | Grand Unified Configuration — a Postgres runtime setting (`app.org_id`). **Cannot be parameterised**, hence the regex guard before interpolation |
| **`orgDb()`** | Layer 1 of tenant isolation — a repository that injects `orgId` into every call. **Currently dead code with zero call sites** |
| **Three-layer isolation** | 1 `orgDb()` (dead) · 2 RLS (active) · 3 cross-tenant tests (false negative) |
| **Fail closed** | Defaulting to deny — `DEV_LOGIN_ENABLED=false`; dev-login also blocked by `NODE_ENV=production`; either guard alone suffices |
| **Dev login** | Password-less login by email. **Returns 404 when disabled** — it does not advertise its existence |
| **Confused deputy** | The attack `isOrgToken()` prevents: org tokens share the signing secret but are not user sessions |
| **Session cap** | `MAX_SESSIONS = 3`. A 4th login evicts the oldest row, which **immediately** invalidates that device's token (real revocation, not expiry) |
| **`sid`** | The session-row id inside an access token — what makes server-side revocation possible |
| **Refresh rotation** | Every refresh issues a **new** refresh token |
| **SSRF** | Server-Side Request Forgery. `lib/ssrf.ts` blocks private/loopback/link-local/metadata ranges — and must run **at save time and again at delivery**, because DNS can be rebound between them |
| **DNS rebinding** | Passing validation, then re-resolving to an internal address at request time |
| **CSP** | Content-Security-Policy. Currently allows `'unsafe-inline'`/`'unsafe-eval'` in `script-src`; nonces are the documented next step |
| **HSTS** | Strict-Transport-Security — 2 years, `includeSubDomains`, `preload`. Once set, HTTP is refused for **every** subdomain |
| **`TRUST_PROXY_HOPS`** | The **exact** number of trusted proxies. `trustProxy: true` would let clients spoof `X-Forwarded-For` and defeat IP rate limiting |
| **Forensic watermark** | A content-protection deterrent. **The web cannot block screenshots** — this creates a trail instead |
| **Audit log** | `AuditLog` + `recordAudit()`; readable at `GET /v1/admin/audit` |

---

## Operations terms

| Term | Definition |
| --- | --- |
| **`/livez`** | Liveness — process alive; **touches no dependency**. Use for LB health |
| **`/readyz`** | Readiness — Postgres + Redis healthy. Use as the **deploy gate** |
| **Why both** | Pointing liveness at `/readyz` means a database blip restarts healthy pods and escalates an incident into an outage |
| **`x-request-id`** | Correlation id — an inbound value is reused, else a UUID is minted; echoed on every response and attached to Sentry |
| **BullMQ** | The Redis-backed queue library. Queues: `judge`, `cron`, `webhook` |
| **Worker** | A separate process consuming a queue. Same image as `api`; the `CMD` chooses |
| **Five processes** | `api`, `worker`, `cron`, `webhook`, `web`. Deploying only `api` leaves submissions unjudged |
| **`db:rls`** | The script applying RLS policies. **Not part of Prisma migrations** — must run after every deploy |
| **Judge0** | Self-hosted sandbox executing untrusted user code. Keep it on a private network |
| **k6** | The load-test tool (`load/k6-smoke.js`) — invoked externally, so static analysis wrongly flags it as orphaned |
| **Knip / madge / jscpd** | Dead-code, cycle, and duplication analysers used in the cleanup audit |

---

## Third-party services

| Term | Definition |
| --- | --- |
| **Clerk** | Authentication. Owns credentials, social login, MFA — **EYF stores no passwords** |
| **`hasRealClerk()`** | The switch between Clerk and the internal-JWT fallback |
| **svix** | The webhook-signature library Clerk uses |
| **Razorpay** | India-first payments — subscriptions + Connect payouts. **Not Stripe** |
| **Anthropic / Claude** | AI mocks, grading, coaching, editorial, course drafting. **Metered** |
| **Whisper** | OpenAI speech-to-text for voice answers |
| **Resend** | Transactional email |
| **R2** | Cloudflare's S3-compatible object storage |
| **PostHog** | Product analytics (client-side) |
| **Sentry** | Error tracking — **5xx only**; 4xx are user errors, not incidents |
| **`AI_UNAVAILABLE`** | The error code returned when `ANTHROPIC_API_KEY` is absent. The UI says *"This AI feature isn't configured yet."* |

---

## Easily confused pairs

> [!WARNING]
> These pairs cause real bugs. Read this table twice.

| Pair | Distinction |
| --- | --- |
| **`Role` vs `OrgRole`** | Different **axes**. A user can be `STUDENT_FREE` on the platform and `OWNER` in a tenant. **Never infer one from the other** |
| **`/v1/org/*` vs `/v1/orgs/*`** | `org` = legacy access-code portal; `orgs` = current multi-tenant platform. Both are live |
| **`*-bank.ts` vs `*-source.ts`** | Bank = legacy hardcoded fallback; source = DB-first. **Call the source** |
| **`DATABASE_URL` vs `DIRECT_DATABASE_URL`** | Pooled runtime vs unpooled DDL. Swapping them breaks migrations or exhausts connections |
| **`/livez` vs `/readyz`** | Process alive vs dependencies healthy. Using `/readyz` for liveness causes restart storms |
| **`JWT_ACCESS_SECRET` vs `JWT_REFRESH_SECRET`** | **Must differ.** Separation is what stops a refresh token being replayed as an access token |
| **Capability vs Role** | Roles *hold* capabilities. Gate on the **capability**, never `role === "ADMIN"` |
| **RBAC vs ABAC** | *May they ever?* vs *over which rows?* You need both — and must apply the scope as a filter |
| **`requirePlan(["pro"])`** | Means **"pro or above"**, not "exactly pro" |
| **Rupees vs paisa** | `amountInr` is in **paisa** (1/100 rupee) |
| **`Verdict.PENDING`** | Not a failure — the judge worker has not returned yet |
| **RLS "failing" locally** | A **false negative** from a superuser role, not a broken policy |
| **`orgDb()` "existing"** | It exists but is **never called**. Do not assume it protects anything |
| **`NEXT_PUBLIC_*`** | **Build-time and public.** Changing one requires a rebuild; never put a secret behind it |
| **Root `.env` vs `apps/api/.env`** | The **API reads `apps/api/.env`**. Editing the root file alone changes nothing |
| **`pino` "unused"** | Referenced as a **transport target string**, not imported. Removing it breaks logging |

---

**Next:** [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) · [CODEBASE_GUIDE.md](CODEBASE_GUIDE.md) · [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
