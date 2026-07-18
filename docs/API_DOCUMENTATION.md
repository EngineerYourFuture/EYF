# API Documentation

**Audience:** backend/frontend engineers, integrators, QA.
**Related:** [AUTHENTICATION](AUTHENTICATION.md) · [BACKEND](BACKEND.md) · [DATABASE](DATABASE.md) · [SECURITY](SECURITY.md)

**Base URL:** `{API_HOST}:{API_PORT}/v1` — locally `http://localhost:4000/v1`
**Production URL:** **Needs implementation** — not configured in-repo.

---

## Table of Contents

- [How to read this document](#how-to-read-this-document)
- [Conventions](#conventions)
  - [Response envelope](#response-envelope)
  - [Headers](#headers)
  - [Error codes](#error-codes)
  - [Validation](#validation)
  - [Rate limits](#rate-limits)
  - [Authentication & permissions](#authentication--permissions)
- [Health & observability](#health--observability)
- [Endpoint reference](#endpoint-reference)
  - [Auth](#auth)
  - [Account](#account)
  - [Practice — problems & submissions](#practice--problems--submissions)
  - [Learn](#learn)
  - [Interview](#interview)
  - [Career](#career)
  - [Community](#community)
  - [Gamification & score](#gamification--score)
  - [Billing](#billing)
  - [Staff / admin](#staff--admin)
  - [Enterprise — organizations](#enterprise--organizations)
- [Worked examples](#worked-examples)
- [Webhooks](#webhooks)

---

## How to read this document

The API exposes **328 endpoints across 60 route modules**, all mounted under `/v1` (`apps/api/src/routes/index.ts`).

Rather than repeat identical boilerplate 328 times, this document follows the Stripe/GitHub pattern:

1. **[Conventions](#conventions)** define the envelope, headers, error codes, validation, and rate limits that apply to **every** endpoint.
2. **[Endpoint reference](#endpoint-reference)** lists every endpoint with its method, route, purpose, auth, and permission.
3. **[Worked examples](#worked-examples)** show full request/response cycles for representative flows.

> [!NOTE]
> There is **no OpenAPI/Swagger specification** in the repository — **Needs implementation**. Route schemas are enforced at runtime by Zod inside each handler rather than declared in Fastify's `schema` option, so a spec cannot currently be generated automatically.

---

## Conventions

### Response envelope

Every endpoint returns the discriminated union defined in `packages/types/src/index.ts`:

```ts
type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: { page?: number; total?: number; cursor?: string };
};

type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    upgradeRequired?: boolean;
    plan?: "basic" | "pro" | "elite";
    details?: unknown;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

> [!TIP]
> Clients should branch on `success`, never on HTTP status alone. The union is exported from `@eyf/types` and shared by the web app, so response handling is type-safe end-to-end.

### Headers

**Request:**

| Header | Required | Purpose |
| --- | --- | --- |
| `Authorization: Bearer <token>` | For authenticated routes | Clerk session token **or** internal access JWT |
| `Content-Type: application/json` | For bodies | Standard |
| `x-admin-gate: <token>` | When `ADMIN_ACCESS_CODE` is set | Second factor for all `requirePermission` routes |
| `x-request-id` | Optional | Reused as the correlation id if supplied by the edge |
| `x-org-key` / API key | Org API access | See `lib/api-keys.ts` |

Audio endpoints (`/v1/mocks/:id/transcribe`, `/v1/communication/transcribe`) accept raw bodies with `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/ogg`, or `application/octet-stream` (`apps/api/src/app.ts:40`).

**Response:**

| Header | Always | Purpose |
| --- | --- | --- |
| `x-request-id` | Yes | Correlation id, echoed for every response (`app.ts:118`) |
| Helmet security headers | Yes | CSP `default-src 'none'`, HSTS 2y preload, `Referrer-Policy: no-referrer` |

### Error codes

| HTTP | Code | Meaning | Source |
| --- | --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Zod rejected the body; `details` carries `flatten()` | `middleware/error.ts` |
| 400 | `VALIDATION` | Domain validation failure | route handlers |
| 400 | `BAD_REQUEST` | Generic 4xx fallback | `middleware/error.ts` |
| 401 | `UNAUTHENTICATED` | Missing/invalid session | `middleware/auth.ts` |
| 401 | `INVALID_REFRESH` | Refresh token invalid/expired | `routes/auth.ts` |
| 401 | `SESSION_REVOKED` | Session row gone (evicted by the session cap) | `routes/auth.ts` |
| 402 | `PLAN_UPGRADE_REQUIRED` | Plan too low; carries `upgradeRequired` + `plan` | `middleware/auth.ts` |
| 403 | `FORBIDDEN` | Role/capability missing | `middleware/auth.ts`, `permissions.ts` |
| 403 | `ADMIN_GATE_REQUIRED` | Valid staff role, missing admin-gate token | `middleware/permissions.ts` |
| 404 | `NOT_FOUND` | Resource absent (also returned by disabled dev-login) | routes |
| 404 | `USER_NOT_FOUND` | Dev-login email unknown | `routes/auth.ts` |
| 409 | `NOT_EDITABLE` | State machine forbids the edit (e.g. published course) | `routes/org-learn.ts` |
| 429 | `RATE_LIMITED` | Over the per-plan limit | `app.ts:83` |
| 500 | `INTERNAL_ERROR` | Unhandled; generic message in production | `middleware/error.ts` |

> [!NOTE]
> In production, 5xx messages are replaced with *"Something went wrong on our end."* and the exception is sent to Sentry with `{ reqId, url, method }`. Use `x-request-id` to correlate a user report with the Sentry event.

### Validation

Validation is **runtime Zod inside handlers**, not Fastify JSON schema:

```ts
const body = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().max(2000).default(""),
}).parse(req.body);
```

A `ZodError` is caught centrally and returned as:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body.",
    "details": { "formErrors": [], "fieldErrors": { "title": ["String must contain at least 2 character(s)"] } }
  }
}
```

### Rate limits

Global, Redis-backed, **per plan** (`packages/types/src/index.ts`, applied in `app.ts:70`):

| Plan | Requests/min | Submissions/day |
| --- | --- | --- |
| `free` | 60 | 5 |
| `basic` | 180 | 20 |
| `pro` | 600 | Unlimited |
| `elite` | 1200 | Unlimited |

- **Key:** `req.session?.id ?? req.ip` — authenticated users are limited per account; anonymous traffic per IP.
- **Store:** shared Redis (`nameSpace: "eyf-rl:"`) so the limit is global across instances. In `NODE_ENV=test` an in-memory store is used to isolate test files.
- **Excluded:** `/livez`, `/readyz`, `/health`, `/v1/health`, `/metrics` (`config: { rateLimit: false }`).

**Per-route override** (`apps/api/src/lib/rate-limits.ts`):

| Route | Limit | Why |
| --- | --- | --- |
| `POST /v1/org/verify` | **5/min** | The org access code is a guessable credential — hard cap to make brute force impractical |

429 response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Limit is 60/min on your plan. Try again in 34s.",
    "upgradeRequired": true
  }
}
```

### Authentication & permissions

Four guard types compose in `preHandler` chains:

| Guard | Effect | Failure |
| --- | --- | --- |
| `app.requireAuth` | Populates `req.session` | 401 |
| `app.requirePlan([...])` | Minimum plan tier | 402 |
| `app.requireRole([...])` | Exact role membership | 403 |
| `requirePermission(cap)` | Staff capability **+ admin gate** | 403 |
| `requireOrgCapability(cap)` | Org capability + ABAC scope | 403 |

> [!WARNING]
> **Plan gating is disabled unless `BILLING_ENABLED=true`.** `requirePlan` returns early when billing is off (`middleware/auth.ts:97`), so every authenticated user receives full access. This is intentional pre-launch; treat "requires Pro" in this document as *"will require Pro once billing is enabled"*.

---

## Health & observability

Unauthenticated and excluded from rate limiting.

| Method | Route | Purpose | Response |
| --- | --- | --- | --- |
| GET | `/livez` | Liveness — process is up; touches no dependency | `{ ok: true }` |
| GET | `/readyz` | Readiness — checks Postgres + Redis | `200 { ok, checks }` / `503` |
| GET | `/health` | Back-compat shallow check | `{ ok: true, ts }` |
| GET | `/v1/health` | Back-compat shallow check | `{ ok: true, ts }` |
| GET | `/metrics` | Prometheus exposition | text/plain |

`/metrics` requires `Authorization: Bearer $METRICS_TOKEN` **only when `METRICS_TOKEN` is set**; otherwise it is world-readable and must be protected at the network layer.

> [!TIP]
> Gate deploy promotion on `/readyz == 200`. Point load-balancer liveness at `/livez` so a transient database blip does not restart healthy pods.

---

## Endpoint reference

Legend — **Auth:** `—` public · `Auth` requires session · `Role` requires role · `Cap` requires capability · `Org` requires org capability.

### Auth

Prefix `/v1/auth` — `apps/api/src/routes/auth.ts`

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/v1/auth/dev-login` | Password-less login for seed users | — (dev only) |
| POST | `/v1/auth/refresh` | Rotate access + refresh tokens | Refresh token |
| POST | `/v1/auth/logout` | Destroy the session row | Auth |
| POST | `/v1/auth/clerk-webhook` | Clerk user sync (svix-signed) | Signature |

> [!WARNING]
> `POST /v1/auth/dev-login` is **fail-closed**: it 404s unless `DEV_LOGIN_ENABLED=true` **and** `NODE_ENV !== "production"`. Both guards are independent, so a misconfigured `NODE_ENV` alone cannot reopen it. Never enable in production — it mints admin tokens without a password.

**Session cap:** `MAX_SESSIONS = 3`. A fourth login evicts the oldest session row, which immediately invalidates that device's token (tokens carry `sid`; `resolveSession` rejects a token whose session row is gone).

### Account

Prefix `/v1/me` — `routes/me.ts`

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/v1/me` | Current user profile | Auth |
| PATCH | `/v1/me` | Update profile | Auth |
| GET | `/v1/me/export` | GDPR-style data export | Auth |
| POST | `/v1/me/delete` | Account deletion | Auth |

### Practice — problems & submissions

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/v1/problems` | List problems | — |
| GET | `/v1/problems/mastery` | Per-pattern mastery | Auth |
| GET | `/v1/problems/:slug` | Problem detail | — |
| POST | `/v1/submissions` | Submit code → judge queue | Auth |
| GET | `/v1/submissions/me` | My submissions | Auth |
| GET | `/v1/submissions/:id` | Submission verdict | Auth |
| POST | `/v1/cognitive/sessions` | Record a cognitive-game session | Auth |
| GET | `/v1/cognitive/me` | My cognitive stats | Auth |
| GET | `/v1/cognitive/percentile` | Percentile rank | Auth |
| GET | `/v1/cognitive/leaderboard/:game` | Per-game leaderboard | — |
| POST | `/v1/pressure/start` | Start a pressure session | Auth |
| POST | `/v1/pressure/:id/end` | End a pressure session | Auth |
| GET | `/v1/pressure/me` | Pressure history | Auth |
| GET | `/v1/pressure/me/anxiety` | Anxiety trend | Auth |
| GET | `/v1/code-dna/me` | Code-DNA fingerprint | Auth |
| POST | `/v1/code-dna/strategy` | Strategy recommendation | Auth |

### Learn

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/v1/subjects` | Subject catalogue | — |
| GET | `/v1/subjects/review` | Due review items | Auth |
| GET | `/v1/subjects/:subject/notes` | Theory notes for a subject | — |
| GET | `/v1/subjects/notes/:slug` | Note detail | Auth |
| GET | `/v1/subjects/:subject/flashcards/due` | Due flashcards (SRS) | Auth |
| POST | `/v1/subjects/flashcards/:id/review` | Grade a flashcard | Auth |
| POST | `/v1/assessment/adaptive` | Adaptive assessment step | Auth |
| GET | `/v1/assessment/start` | Start an assessment | Auth |
| POST | `/v1/assessment/submit` | Submit answers | Auth |
| GET | `/v1/assessment/me` | Assessment history | Auth |
| GET | `/v1/mcq/catalog` | MCQ catalogue | — |
| GET | `/v1/mcq/sims` | Company sims | — |
| POST | `/v1/mcq/start` | Start an MCQ run | Auth |
| POST | `/v1/mcq/submit` | Submit an MCQ run | Auth |
| GET | `/v1/mcq/history` | MCQ history | Auth |
| GET | `/v1/roadmap/me` | My roadmap | Auth |
| POST | `/v1/roadmap/generate` | Generate a personalised roadmap | Auth |
| POST | `/v1/roadmap/start` | Start the roadmap | Auth |
| GET | `/v1/roadmap/today` | Today's roadmap slice | Auth |
| GET | `/v1/tracks` | Career tracks | — |
| GET | `/v1/tracks/:slug` | Track detail | — |
| GET | `/v1/tracks/me/primary` | My primary track | Auth |
| POST | `/v1/tracks/:slug/choose` | Choose a track | Auth |

### Interview

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/v1/mocks/me` | My mock sessions | Auth |
| GET | `/v1/mocks/composure` | Composure trend | Auth |
| GET | `/v1/mocks/:id` | Mock detail | Auth |
| POST | `/v1/mocks/ai/start` | Start an AI mock | Auth |
| POST | `/v1/mocks/:id/turn` | Submit a conversational turn | Auth |
| POST | `/v1/mocks/:id/end` | End + grade the mock | Auth |
| POST | `/v1/mocks/:id/transcribe` | Transcribe audio (Whisper) | Auth |
| POST | `/v1/peer/queue/join` | Join the peer-mock queue | Auth |
| POST | `/v1/peer/queue/leave` | Leave the queue | Auth |
| GET | `/v1/peer/queue/status` | Queue/match status | Auth |
| POST | `/v1/peer/:mockId/signal` | Post a WebRTC signal | Auth |
| GET | `/v1/peer/:mockId/signal` | Poll WebRTC signals | Auth |
| POST | `/v1/peer/:mockId/leave` | Leave a peer mock | Auth |
| GET | `/v1/communication/prompts` | Drill prompts | — |
| POST | `/v1/communication/transcribe` | Transcribe a drill | Auth |
| POST | `/v1/communication/feedback` | AI feedback on a drill | Auth |
| GET | `/v1/communication/history` | Drill history | Auth |
| GET | `/v1/companies` | Company list | Auth |
| GET | `/v1/companies/:slug` | Company prep detail | Auth |
| GET | `/v1/oa` | OA fingerprints | — |
| GET | `/v1/oa/:id` | OA detail | — |
| POST | `/v1/oa` | Submit an OA report | Auth |
| POST | `/v1/oa/:id/helpful` | Mark helpful | Auth |
| POST | `/v1/project-prep/generate` | Generate project questions | Auth |
| GET | `/v1/project-prep` | List preps | Auth |
| GET | `/v1/project-prep/:id` | Prep detail | Auth |

### Career

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/v1/resume/me` | My resumes | Auth |
| GET | `/v1/resume/:id` | Resume detail | Auth |
| POST | `/v1/resume` | Create a resume | Auth |
| PATCH | `/v1/resume/:id` | Update a resume | Auth |
| GET | `/v1/resume/:id/pdf` | Render PDF | Auth |
| POST | `/v1/resume/:id/score` | ATS score | Auth |
| GET | `/v1/resume/:id/gap` | Gap analysis | Auth |
| GET | `/v1/jobs` · `/v1/internships` | Listings | — |
| GET | `/v1/jobs/:slug` · `/v1/internships/:slug` | Detail | — |
| GET | `/v1/jobs/me/applications` · `/v1/internships/me/applications` | My applications | Auth |
| POST | `/v1/jobs/:slug/save` · `/v1/internships/:slug/save` | Save/apply | Auth |
| PATCH | `/v1/jobs/me/applications/:id` · `/v1/internships/me/applications/:id` | Update pipeline stage | Auth |
| GET | `/v1/projects` · `/v1/projects/:slug` | Project ideas | — |
| GET | `/v1/projects/me/started` | Started projects | Auth |
| POST | `/v1/projects/:slug/start` | Start a project | Auth |
| PATCH | `/v1/projects/me/:id` | Update progress | Auth |
| GET | `/v1/mentors` · `/v1/mentors/:id` · `/v1/mentors/:id/slots` | Mentor discovery | — |
| POST | `/v1/mentors/me/slots` | Publish slots | Auth (mentor) |
| POST | `/v1/mentors/slots/:slotId/book` | Book a slot | Auth |
| POST | `/v1/mentors/me/razorpay-link` | Link payout account | Auth (mentor) |
| GET | `/v1/mentors/me/payouts` | Payout history | Auth (mentor) |
| POST | `/v1/mentors/mocks/:mockId/complete` | Complete a paid mock | Auth (mentor) |
| POST | `/v1/mentors/apply` | Apply to be a mentor | Auth |
| GET | `/v1/certificates/me` | My certificates | Auth |
| GET | `/v1/certificates/verify/:code` | Public verification | — |
| GET | `/v1/certificates/:id/pdf` | Certificate PDF | — |
| POST | `/v1/certificates/issue` | Issue a certificate | Cap `issue:certificates` |

### Community

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/v1/forum/threads` · `/v1/forum/threads/:slug` | Threads | — |
| POST | `/v1/forum/threads` | Create a thread | Auth |
| POST | `/v1/forum/threads/:slug/posts` | Reply | Auth |
| POST | `/v1/forum/react` | React to a post | Auth |
| GET | `/v1/experiences` | Interview experiences | — |
| POST | `/v1/experiences` | Share an experience | Auth |
| POST | `/v1/experiences/:id/upvote` | Upvote | Auth |
| GET | `/v1/ask/trending` · `/v1/ask/entry/:id` | Knowledge entries | — |
| POST | `/v1/ask` | Ask a question | Auth |

### Gamification & score

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/v1/gamification/badges` | Badge catalogue | — |
| GET | `/v1/gamification/me` | My badges/XP | Auth |
| GET | `/v1/gamification/leaderboard` | Leaderboard | — |
| GET | `/v1/gamification/streak` | Streak state | Auth |
| GET | `/v1/leaderboard` | Global leaderboard | Auth |
| GET | `/v1/missions/today` | Today's missions | Auth |
| POST | `/v1/missions/claim` | Claim a mission reward | Auth |
| GET | `/v1/guidance/me` | **Ranked next actions** (readiness engine) | Auth |
| GET | `/v1/skill-graph/me` | Skill graph | Auth |
| POST | `/v1/score/share` | Create a shareable score card | Auth |
| GET | `/v1/score/verify/:code` | Verify a shared score | — |
| GET | `/v1/wrapped/me/:year` | Year in review | Auth |
| GET | `/v1/wrapped/me/:year/share.pdf` | Wrapped PDF | Auth |
| POST | `/v1/fun/roast/:resumeId` | Resume roast | Auth |
| GET | `/v1/fun/offer-letter` | Mock offer letter | Auth |
| POST | `/v1/push/register` · `/unregister` · `/test` | Push tokens | Auth |

### Billing

Prefix `/v1/billing` — `routes/billing.ts`

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/v1/billing/plans` | Plan catalogue | — |
| POST | `/v1/billing/create-order` | Create a Razorpay order | Auth |
| POST | `/v1/billing/confirm` | Confirm payment | Auth |
| POST | `/v1/billing/webhook` | Razorpay webhook (signature-verified) | Signature |

### Staff / admin

All `requirePermission` routes additionally require the `x-admin-gate` header when `ADMIN_ACCESS_CODE` is set.

| Method | Route | Purpose | Capability |
| --- | --- | --- | --- |
| GET | `/v1/admin/gate/status` | Is the gate satisfied? | Auth |
| POST | `/v1/admin/gate` | Exchange the access code for a gate token | Auth |
| GET | `/v1/admin/mod/overview` | Moderation overview | `moderate` |
| GET | `/v1/admin/mod/mentors/pending` | Pending mentors | `verify:mentors` |
| POST | `/v1/admin/mod/mentors/:id/verify` · `/reject` | Approve/reject a mentor | `verify:mentors` |
| POST | `/v1/admin/mod/forum/threads/:id/lock` · `/unlock` · `/pin` | Thread moderation | `moderate` |
| DELETE | `/v1/admin/mod/forum/threads/:id` · `/posts/:id` · `/oa/:id` | Remove content | `moderate` |
| GET | `/v1/admin/users` | List users | `manage:users` |
| PATCH | `/v1/admin/users/:id/role` · `/plan` · `/status` | Change role/plan/status | `manage:users` |
| GET | `/v1/admin/payments/overview` · `/invoices` | Payments | `manage:payments` |
| GET | `/v1/admin/audit` | Audit log | `view:analytics` |
| GET/POST/PATCH/DELETE | `/v1/admin/content/problems` · `/jobs` · `/career-tracks` · `/experiences` | Content CRUD | `manage:content` |
| GET/POST/PATCH/DELETE | `/v1/admin/content/theory-notes` · `/flashcards` | Learn content CRUD | `manage:content` |
| GET/POST/PATCH/DELETE | `/v1/admin/content/internships` · `/project-ideas` | Career content CRUD | `manage:content` |
| GET/POST/PATCH/DELETE | `/v1/admin/content/mcq` · `/assessment` · `/communication` · `/sims` · `/knowledge` | Bank CRUD | `manage:content` |
| POST | `/v1/admin/content/{mcq,assessment,communication}/import-bank`, `/sims/import-defaults` | Import legacy hardcoded banks into the DB | `manage:content` |
| POST | `/v1/admin/problems/:slug/generate` · `/variants/generate` | AI editorial/variants | `manage:content` |
| GET | `/v1/admin/problems/:slug/editorial` · `/variants` | Read generated content | `manage:content` |

> [!TIP]
> The `import-bank` endpoints migrate the legacy in-code banks (`lib/*-bank.ts`) into database rows. After import, the `*-source.ts` modules serve DB rows and the bank remains only as a fresh-install fallback.

### Enterprise — organizations

Two generations of org endpoints coexist:

| Prefix | Module | Status |
| --- | --- | --- |
| `/v1/org/*` | `routes/org.ts` | Earlier, access-code portal + simple courses |
| `/v1/orgs/*` | `routes/orgs.ts` + 9 sibling modules | Current multi-tenant platform |

#### Tenant, members, structure — `routes/orgs.ts`

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/v1/orgs` | Create an organization |
| GET | `/v1/orgs/mine` | My organizations |
| GET | `/v1/orgs/:orgId` | Org detail |
| GET | `/v1/orgs/:orgId/usage` | Usage counters vs. licensed seats |
| GET | `/v1/orgs/:orgId/members` | List members |
| PATCH | `/v1/orgs/:orgId/members/:memberId` | Change roles/status (last-owner guarded) |
| POST | `/v1/orgs/:orgId/invites` | Invite (seat-capped) |
| POST | `/v1/orgs/invites/accept` | Accept an invite |
| GET/POST/DELETE | `/v1/orgs/:orgId/departments` | Departments |
| GET/POST | `/v1/orgs/:orgId/teams`, `/teams/:teamId/members` | Teams |

> [!NOTE]
> `PATCH /v1/orgs/:orgId/members/:memberId` enforces a **last-owner invariant**: demoting the final `OWNER` returns `400 LAST_OWNER`.

#### LMS — `routes/org-learn.ts`, `org-paths.ts`, `org-ai.ts`

| Method | Route | Org capability |
| --- | --- | --- |
| GET/POST | `/v1/orgs/:orgId/courses` | `learn:author` |
| GET/PATCH | `/v1/orgs/:orgId/courses/:courseId` | `learn:author` |
| POST | `/v1/orgs/:orgId/courses/:courseId/lessons` | `learn:author` |
| PATCH | `/v1/orgs/:orgId/lessons/:lessonId` | `learn:author` |
| POST | `/v1/orgs/:orgId/courses/:courseId/submit` | `learn:author` |
| POST | `/v1/orgs/:orgId/courses/:courseId/publish` · `/archive` | `learn:publish` |
| GET | `/v1/orgs/:orgId/work/courses` · `/work/courses/:courseId` | `member` |
| POST | `/v1/orgs/:orgId/work/lessons/:lessonId/complete` | `member` |
| GET/POST | `/v1/orgs/:orgId/paths`, `/paths/:pathId`, `/paths/:pathId/items` | `learn:author` |
| POST | `/v1/orgs/:orgId/paths/:pathId/publish` | `learn:publish` |
| GET/POST | `/v1/orgs/:orgId/cohorts`, `/cohorts/:cohortId/enroll` | `learn:enroll` |
| GET | `/v1/orgs/:orgId/cohorts/:cohortId/funnel` | `learn:enroll` |
| GET | `/v1/orgs/:orgId/work/paths` | `member` |
| POST | `/v1/orgs/:orgId/ai/course-draft` | `learn:author` |

> [!NOTE]
> **Two-person publish** is a workflow rule enforced in routes, not in the capability map: `learn:author` submits, `learn:publish` approves. `org-permissions.ts` answers *reach*, not *ceremony*.

#### Assessments — `routes/org-assess.ts`

| Method | Route | Org capability |
| --- | --- | --- |
| GET/POST | `/v1/orgs/:orgId/blueprints` | `assess:author` |
| GET | `/v1/orgs/:orgId/runs` | `assess:view-results` |
| POST | `/v1/orgs/:orgId/runs` | `assess:administer` |
| GET | `/v1/orgs/:orgId/runs/:runId/results` | `assess:view-results` |
| GET | `/v1/orgs/:orgId/work/assessments` | `member` |
| POST | `/v1/orgs/:orgId/runs/:runId/start` | `member` |
| POST | `/v1/orgs/:orgId/attempts/:attemptId/submit` | `member` |

#### Skills & certificates

| Method | Route | Org capability |
| --- | --- | --- |
| GET | `/v1/orgs/:orgId/role-bars` · `/skills/matrix` | `people:skills-read` |
| POST | `/v1/orgs/:orgId/role-bars` | `assess:author` |
| GET | `/v1/orgs/:orgId/members/:memberId/ledger` | `people:skills-read` |
| GET/POST | `/v1/orgs/:orgId/cert-templates` | `org:manage` |
| POST | `/v1/orgs/:orgId/cert-templates/:templateId/issue` | `org:manage` |
| GET | `/v1/orgs/:orgId/certificates` | `org:manage` |
| POST | `/v1/orgs/:orgId/certificates/:certId/revoke` | `org:manage` |

#### Hiring — `routes/org-hire.ts`, `talent.ts`

| Method | Route | Org capability |
| --- | --- | --- |
| GET | `/v1/orgs/:orgId/talent/search` · `/talent/:userId/profile` | `talent:search` |
| GET/POST | `/v1/orgs/:orgId/requisitions` | `hire:pipeline` |
| PATCH | `/v1/orgs/:orgId/requisitions/:reqId` | `hire:pipeline` |
| GET | `/v1/orgs/:orgId/requisitions/:reqId/pipeline` | `hire:pipeline` |
| POST | `/v1/orgs/:orgId/requisitions/:reqId/candidates` | `hire:pipeline` |
| PATCH | `/v1/orgs/:orgId/candidates/:candId` | `hire:pipeline` |
| POST | `/v1/orgs/:orgId/requisitions/:reqId/offer` | `hire:pipeline` |
| POST | `/v1/orgs/:orgId/offers/:offerId/send` | `hire:offer` |
| GET | `/v1/orgs/:orgId/offers` | `hire:pipeline` |
| GET/POST | `/v1/talent/consent`, `/consent/revoke` | Auth (student) |
| GET | `/v1/talent/offers` | Auth (student) |
| POST | `/v1/talent/offers/:offerId/respond` | Auth (student) |

> [!TIP]
> Talent search is **consent-gated**. A student appears in `/talent/search` only via `TalentConsent` (`TalentScope`), and can revoke at any time. Treat consent as the authority, not the index.

#### Settings — `routes/org-settings.ts`

| Method | Route | Org capability |
| --- | --- | --- |
| GET | `/v1/orgs/:orgId/branding` | — |
| PATCH | `/v1/orgs/:orgId/branding` | `org:branding` |
| GET/POST | `/v1/orgs/:orgId/api-keys` | `org:manage` |
| POST | `/v1/orgs/:orgId/api-keys/:keyId/revoke` | `org:manage` |
| GET/POST | `/v1/orgs/:orgId/webhooks` | `org:manage` |
| GET | `/v1/orgs/:orgId/webhooks/:hookId/deliveries` | `org:manage` |
| POST | `/v1/orgs/:orgId/webhooks/:hookId/delete` | `org:manage` |

> [!WARNING]
> Org webhook URLs are attacker-supplied and therefore an SSRF vector. `apps/api/src/lib/ssrf.ts` guards outbound destinations. Any new outbound-fetch feature must route through it.

#### Legacy portal — `routes/org.ts`

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/v1/org/verify` | Exchange an org access code for an org token — **rate limited 5/min** |
| GET | `/v1/org/me` · `/catalog` · `/courses` · `/internships` | Portal reads |
| POST/PATCH/DELETE | `/v1/org/courses`, `/courses/:id`, `/courses/:id/lessons`, `/internships` | Portal writes |
| GET/POST | `/v1/org/student/internships`, `/courses/:id/enroll`, `/courses/:id/learn`, `/lessons/:id/complete`, `/courses/:id/enrollments` | Student-side LMS |

> [!NOTE]
> Org portal tokens are signed with the same JWT secret as user sessions but are **not** user sessions. `resolveSession()` rejects them on user routes via `isOrgToken()` (`middleware/auth.ts:53`) — a deliberate confused-deputy defence.

---

## Worked examples

### 1. Dev login → authenticated request

```bash
curl -X POST http://localhost:4000/v1/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@eyf.in"}'
```

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
    "user": { "id": "clx…", "email": "student@eyf.in", "role": "STUDENT_FREE", "plan": "free" }
  }
}
```

```bash
curl http://localhost:4000/v1/me -H "Authorization: Bearer $TOKEN"
```

**Errors:** `404 NOT_FOUND` (dev-login disabled) · `404 USER_NOT_FOUND` · `400 VALIDATION_ERROR` (invalid email).

### 2. Token refresh

```bash
curl -X POST http://localhost:4000/v1/auth/refresh \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

Returns a fresh access token **and a rotated refresh token**.

**Errors:** `401 INVALID_REFRESH` · `401 SESSION_REVOKED` (the session row was evicted by the 3-session cap).

### 3. Rate-limited response

```bash
for i in $(seq 1 61); do curl -s -o /dev/null http://localhost:4000/v1/problems; done
```

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Limit is 60/min on your plan. Try again in 12s.",
    "upgradeRequired": true
  }
}
```

### 4. Admin gate

```bash
# 1. Exchange the access code for a gate token
curl -X POST http://localhost:4000/v1/admin/gate \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"code":"<ADMIN_ACCESS_CODE>"}'

# 2. Use it alongside the session token
curl http://localhost:4000/v1/admin/users \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "x-admin-gate: $GATE_TOKEN"
```

Without the gate header (when `ADMIN_ACCESS_CODE` is set):

```json
{ "success": false, "error": { "code": "ADMIN_GATE_REQUIRED", "message": "Enter your admin access code to continue." } }
```

---

## Webhooks

### Inbound

| Endpoint | Source | Verification |
| --- | --- | --- |
| `POST /v1/auth/clerk-webhook` | Clerk | `svix` signature against `CLERK_WEBHOOK_SECRET` |
| `POST /v1/billing/webhook` | Razorpay | HMAC against `RAZORPAY_WEBHOOK_SECRET` |

Both rely on `fastify-raw-body` (`field: "rawBody"`, `global: false`, `runFirst: true`) — signatures must be computed over the **raw** body, not the parsed object.

### Outbound

Organizations register endpoints via `/v1/orgs/:orgId/webhooks`. Delivery is queued through BullMQ (`webhook.queue.ts` → `webhook.worker.ts`) and recorded in `WebhookDelivery`; inspect attempts via `GET /v1/orgs/:orgId/webhooks/:hookId/deliveries`.

---

**Next:** [AUTHENTICATION.md](AUTHENTICATION.md) · [DATABASE.md](DATABASE.md) · [BACKEND.md](BACKEND.md)
