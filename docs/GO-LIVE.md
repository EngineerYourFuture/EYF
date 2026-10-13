# EYF — Go-Live Runbook

EYF has substantial feature implementation, but launch readiness still requires validated content, working service integrations, and end-to-end checks. Use this runbook alongside the hardening backlog; configuration alone does not establish that a feature works.

> Env-file gotcha: locally the **API reads `apps/api/.env`** (not the repo-root `.env`), the **web reads `apps/web/.env.local`**, mobile reads `apps/mobile/.env`, and the root `.env` feeds `packages/db`. In prod, set vars in the platform's env UI, not files. Never commit real keys.

---

## Payment preview (current development mode)

Keep `BILLING_ENABLED=false` in **`apps/api/.env`** while payments are deferred.
The billing page reads `/v1/billing/status`, displays planned pricing, and links
to `/today` without loading checkout. Order creation, confirmation, and payment
webhooks return `BILLING_DISABLED`; no mock payments or paid subscriptions are created.
Student plan gates, submission quotas, premium theory/editorials, and premium MCQs
are bypassed. Sign-in, staff permissions, rate limits, and organization resource
limits still apply. Partner internships can be previewed without claiming a paid
tier, ranking, or reserved seat. External AI and judge services still need their
own configuration.

Payments are the final integration milestone. Re-enable billing only after testing
real authentication, practice, and progress flows, then validate checkout and webhook
behavior in the provider's test environment.

For new coding problems, the admin editor now requires at least one public example
and one hidden test with different inputs. Metadata-only API edits preserve the bank;
replacing the bank is atomic. Existing problems with no tests cannot be submitted,
and already queued submissions with no tests finish as an internal error without XP.

## LMS workflow verification

Run the commercial LMS as a separate web deployment. General EYF does not serve
`/org`, `/orgs` or `/learn`; the LMS does not serve general practice, pricing or
platform administration. Every LMS course (including legacy candidate courses)
requires an active organization membership at the API. Being signed in to EYF,
holding a paid student plan, or being a platform admin does not grant membership.
The shared access-code portal and its management APIs are retired with HTTP 410,
including previously issued organization tokens.

Local URLs and commands:

- General EYF: `http://localhost:3000` — `pnpm --filter @eyf/web dev`.
- Private LMS: `http://localhost:3001` — `pnpm --filter @eyf/web dev:lms`.
- Platform provisioning: `http://localhost:3000/admin/organizations`.

Production builds use `NEXT_PUBLIC_EYF_PORTAL=public` and
`NEXT_PUBLIC_EYF_PORTAL=lms` respectively. This is a build-time setting; build two
artifacts. `docker-compose.prod.yml` includes both web services. Set
`NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_LMS_URL` to their final HTTPS origins
(for example `https://eyf.in` and `https://lms.eyf.in`) in both builds, and include
both in the API's `API_CORS_ORIGINS`. Point each hostname at the appropriate web
service. DNS, TLS and production Clerk configuration are deployment steps;
starting the local app does not configure those services. Verify real sign-in,
sign-out, invitation acceptance and account switching on both deployed hosts.
Clerk's [production guide](https://clerk.com/docs/guides/development/deployment/production)
explains subdomain authentication and authorized origins. A separate registrable
domain needs Clerk's satellite-domain setup; that is not enabled automatically.

CD now builds separate `web` and `lms` images with those portal settings. The
production API image has also been exercised locally with disposable Postgres
and Redis: API readiness, anonymous-access rejection, private-storage permissions,
all three worker connections, five schedules and graceful shutdown passed. Run
`pnpm test:production` after building `eyf-api:local-readiness` to repeat this check.
It does not verify a remote Judge0 executor or actual provider delivery. See
[deployment checks](DEPLOYMENT.md#docker-compose-production) for the exact commands.
Production Compose forces production mode and disables developer login and test
security bypasses. The local strict RLS check now passes for all 19 protected
tables after applying the missing `sprint_reviews` policy; the sprint and LMS
access tests also pass with that policy enabled.

The LMS sends no-index and no-store headers and does not initialize product
analytics. Those are privacy measures; API membership and permission checks
provide authorization. Caches reset when the signed-in account changes. The two
apps share identity and the API/database, with tenant-scoped permissions; this is
not a separate database per customer. Media embedded from outside EYF retains
its host's access policy: a publicly hosted video/file is still accessible through
its original URL. Do not place confidential media on public storage.

Authors can now upload private images, MP4/WebM video, files and WebVTT captions
directly in the lesson editor. Files live in `PRIVATE_MEDIA_DIR`, outside public
static directories; production Compose mounts `eyf_private_media` at
`/app/private-media`. Five-minute signed URLs are issued only after authorization,
and every download rechecks active membership and published-lesson access (authors
can preview drafts). Suspension and archiving invalidate existing links. Videos
support byte ranges; the player refreshes access while preserving position.
Links are bearer capabilities until expiry; this is access control, not DRM.
External HTTPS embeds retain their original host's permissions.

The default upload limit is 250 MB per file and 2 GB per organization, configurable
with `PRIVATE_MEDIA_MAX_MB` and `PRIVATE_MEDIA_ORG_LIMIT_MB`. HTML/SVG uploads are
rejected. In **Manage private uploads**, authors can delete unused files; referenced
files are protected. Back up this private volume with Postgres. All API replicas
must mount the same persistent volume; use a shared filesystem before scaling to
multiple hosts. The optional R2 variables are still reserved, not an active storage
backend. Do not expose the private volume through a CDN or static server.
Set `BACKUP_MEDIA_DIR` to that mounted volume when running `scripts/db-backup.sh`;
it creates a matching private `.media.tar.gz` archive and includes it in optional
off-site uploads. Restore only into an empty private directory and configure the
recovered API to use it. Pause writes while taking a consistent DB/media backup.

1. A **platform administrator** opens **Admin → LMS organizations**, provides
   an existing owner's email and the licensed seat count, and creates a workspace.
   This grants the designated user OWNER membership without granting the platform
   admin access to customer content. No payment is taken. The owner uses **People**
   to create invitations. With a configured Resend key, EYF emails the code and
   private LMS address, records delivery acceptance, and allows a rate-limited
   resend. Failed/unconfigured delivery retains the manual code and explains what
   happened. The cron worker sends one reminder near expiry for previously emailed,
   unaccepted invitations, rechecking the inviter's access. Provider acceptance
   does not prove inbox delivery. Invitees use the matching email and enter the code
   in the private LMS. Administrators can suspend, restore or offboard members.
   Suspended/offboarded users cannot regain access by accepting another invitation.
2. Open **Courses**, create a draft, and edit its lessons. Save changes before
   publishing. Images need descriptions; media URLs must use HTTPS. Generated
   coding exercise references must be replaced with existing, tested problems.
   **Create revision** copies a published course into a separate draft and
   leaves existing learners and their progress on the original course.
3. Under **Programs**, create a program, attach published courses, and publish
   it. Create a cohort and select eligible learners to enroll. Published
   programs have fixed course membership; create another program for a new
   curriculum. Cohort reporting shows completion and learners needing attention.
4. Learners open their assigned program and complete its lessons. Inline quiz
   answers are checked on the server; coding exercises require an accepted
   submission. Progress and skill evidence are recorded together once. Reading
   lessons remain self-confirmed; video playback is not proof of attendance.
5. Under **Assessments**, create a blueprint and open a run. Before learners take
   it, create its passing certificate template under **Certificates**. Learners
   complete the timed assessment, then view their certificate and public
   verification link. Administrators can revoke issued certificates.

Video embeds support YouTube and Vimeo; direct MP4/WebM/Ogg resources use the
native player. Other HTTPS embeds remain external links. Captions must be supplied
by the author/provider. Browser regression tests mock the API and external video
resource; database integration tests cover the actual authorization, progress,
assessment, and certificate APIs. Real Clerk sign-in and external provider behavior
still require deployment-environment validation.

### Roles and limits

| Role | Allowed scope | Important limits |
|------|---------------|------------------|
| Platform ADMIN | EYF staff tools, provision organizations, set licensed seats | No automatic customer membership or course access |
| Organization OWNER | All permissions inside that organization, usage and billing visibility | Cannot remove the last active owner; no EYF platform powers |
| Organization ADMIN | Organization settings, people, learning, assessments and hiring | Cannot grant/change OWNER or ADMIN; no billing capability |
| LND | Author and publish learning content, enroll and assess learners | Cannot administer accounts or workspace settings |
| INSTRUCTOR | Author learning content and assessments, grade work | Cannot publish, enroll cohorts or administer accounts |
| REVIEWER | Review content and consented practical submissions | Cannot publish courses or administer accounts |
| HR | Learner/intern accounts, enrollment and hiring | Cannot assign or edit staff roles, including its own |
| ENG_MANAGER | Department-scoped enrollment, assessment and skill data | No access to another department's learning records |
| MENTOR | Assigned mentees' results/skills and teaching | No organization-wide learner records |
| RECRUITER | Hiring assessments and pipeline, consenting candidate search | No offer approval, course publishing or account administration |
| MEMBER / INTERN | Published organization courses and own learning, results and certificates | No people directory, authoring, publishing or other learners' records |

An active member can browse published courses in their organization; cohorts
provide assigned programs, not additional per-course purchase entitlements.
Multiple roles combine their grants. The **Access** tab shows the effective
capabilities and scope. Changing a role or suspending an account takes effect on
the next API request. License checks apply both when accepting invitations and
restoring access, including concurrent requests. Seat changes and membership
changes are audited. Invitation acceptance rechecks the inviter's current authority.
A workspace always retains an active owner under concurrent membership changes.
Payment preview never overrides membership, role or seat limits.

Browser verification starts separate public/LMS servers. With custom running
servers use `E2E_BASE_URL=http://localhost:3100 E2E_LMS_URL=http://localhost:3101`.
Mocked browser sessions exercise UI behavior; the database integration tests
exercise actual permissions and concurrency. Neither replaces real Clerk
validation on the final domains.

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
| `PRIVATE_MEDIA_DIR`, `PRIVATE_MEDIA_MAX_MB`, `PRIVATE_MEDIA_ORG_LIMIT_MB` | private lesson uploads and storage limits | persistent private volume |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | reserved; object storage is not wired | Cloudflare R2 |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | product analytics on every pillar | posthog.com |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (mobile) | mobile auth | Clerk (same instance) |

**Minimum to be live and usable:** `DATABASE_URL`, `REDIS_URL`, JWT secrets, Clerk, Anthropic, Judge0. Add Razorpay + `BILLING_ENABLED=true` to charge. Add Resend to turn on retention emails.

### Activation notes per service

**Clerk** — dashboard: add a webhook → `https://<api>/v1/auth/clerk-webhook` (events `user.created/updated/deleted`), copy its signing secret into `CLERK_WEBHOOK_SECRET`. Gotcha: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is **build-time** — the web must be rebuilt for the dev-login→Clerk switch (`HAS_REAL_CLERK`) to flip. Verify: real sign-in page appears; dev-login disables; a new signup syncs into the DB via the webhook.

**Razorpay (deferred)** — when ready, configure webhook → `https://<api>/v1/billing/webhook` (payment + subscription events). Verify in test mode before setting `BILLING_ENABLED=true` for users.

**Anthropic** — the biggest unlock: AI mock interviewer + personas + tone analysis, daily coach note, Roast + Offer, interview-experience synthesis, resume bullet-rewriter. Unconfigured features return fallback guidance or an explicit unavailable state. Verify: `POST /v1/mocks/ai/start` returns a live interviewer turn.

**Judge0** — real submit/run on Problems + blind mode + pressure mode, complexity analyzer, test-case generator, OA simulated coding. Verify: submitting a solution returns a real verdict.

**Not a single key (still needs a service/worker):**
- **Scrapers** — live jobs, OA fingerprint DB, interview experiences, placement calendars. Schema + UIs are ready to ingest; needs a scraping worker + sources.
- **TURN server (peer-mock NAT traversal)** — WebRTC is wired; set `NEXT_PUBLIC_TURN_URL/USERNAME/CREDENTIAL` in `apps/web/.env.local` (managed: Twilio/Metered, or self-host coturn). Without it, peer mocks are STUN-only and fail on strict NAT (the UI shows a clear "connection failed" state).

---

## 2. Deploy

Turborepo monorepo (pnpm), Node 20+.

**Services to stand up (including the separate LMS web deployment):**
1. **web + lms** — two Next.js 15 builds (standalone/Docker → `apps/web/Dockerfile`) → Vercel or a container host. Set all `NEXT_PUBLIC_*` env (build-time).
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

### Backend placement sprint

`/sprint` now provides a persisted starting check → targeted practice → ticket-handler practical → different follow-up questions → evidence report. Today, app navigation and the landing page link into the journey. Payments remain deferred.

- Apply `20261012090000_placement_sprint` and regenerate Prisma before restarting the API **and judge worker**. Older workers do not record a test-bank fingerprint, so their verdicts cannot complete a sprint.
- Start Judge0's API **and internal execution worker**, then `pnpm --filter @eyf/api dev:worker` (the separate EYF queue worker). Use `docker compose --profile judge up -d judge0 judge0-worker` on a compatible Linux amd64/cgroup-v1 host. The bundled Judge0 1.13.1 is not supported by the inspected Mac's ARM/cgroup-v2 runtime. Point `JUDGE0_URL` and `JUDGE0_TOKEN` at a compatible private host; do not disable sandbox isolation. The authenticated `/v1/submissions/status` checks API reachability and EYF worker presence, not successful execution. Run `pnpm --filter @eyf/api judge:smoke` and a real queued learner submission before a pilot.
- The task is provisioned on first start. Its slug `backend-ticket-handler-v1` and 24-case bank are immutable published content. Create a new task version for changes. An altered bank is rejected instead of silently approving stale results.
- Both six-question checks are unproctored and submitted once. Practice checks can be retried. The follow-up covers the same topics with different prompts; this is not a calibrated placement score.
- Practical completion requires an owned, post-start accepted submission with every test passed and the expected bank fingerprint. The original SQL proposal, explanation and test plan remain candidate-authored text. Executable SQL is available separately in `/labs`; learners may request private human feedback from an organization after finishing the sprint. Neither changes the original public evidence snapshot. Assistance declarations are self-reported.
- Public evidence requires explicit consent. The snapshot includes display name, written answers and test evidence, excludes email/source, expires after 30 days and can be revoked. Regenerating a link invalidates the previous link. Public reports use no-store and noindex. Shared copies cannot be recalled.
- Exercise the entire journey with a real learner and a running judge before a pilot. Track starts, each completed stage, return visits and support time before expanding the task library or setting paid cohort promises.

Salary scenarios now expose catalog ranges and simple annual/monthly assumptions without translating readiness into a predicted offer. Expert mock sessions are explicitly separate from planned subscriptions; final Elite benefits still need definition before paid enrollment.

### College pilot and continued learning

The October 12 continuation adds four additive migrations after the original sprint: `cohort_operations`, `sprint_continuation`, `sql_labs`, and `provider_usage`. Deploy all migrations, regenerate Prisma, restart the API and EYF judge worker, and apply the existing RLS script with the deployment role; `sprint_reviews` is now part of the tenant-isolation table list.

- **Organizations → Programs:** CSV enrollment previews and commits for up to 500 existing active members. A required `email` header is case-insensitive. Duplicates, invalid rows, existing enrollments and unavailable members are reported separately. Unknown/new learners must first accept an invitation from People. Department managers only see and enroll their department; only org-wide enrollers can change shared drive rules.
- **Drive eligibility:** configurable minimum required-course progress and an optional deadline. Progress after the deadline does not retroactively qualify a learner. Empty required programs and dropped enrollments do not qualify. These rules are course criteria, not employer eligibility or placement predictions.
- **Staff follow-up:** status, note and due date per enrollment, with overdue filtering. Notes are staff-only. Saving does not send email. CSV exports use current progress and neutralize spreadsheet formulas.
- **Private practical reviews:** the learner explicitly consents to sharing source, written notes and test evidence with their active organization. `assess:grade` reviewers can publish one final four-part rubric and feedback; self-review is blocked. Withdrawing access removes the request from the staff queue. Feedback remains private to the learner and is not added to public proof links.
- **Repeat practice:** two new authored six-question sets rotate after the original sprint, with persisted history and post-submission explanations. Repeated sets are labeled; scores are practice feedback. Concurrent starts resume one active round and duplicate submissions cannot overwrite its result.
- **Practical Labs:** two SQLite exercises with six versioned cases each: private ticket filtering and paid-revenue aggregation. Fixture setup and learner SQL execute together only inside Judge0. The browser saves SQL drafts and restricts these exercises to SQL. Repository-authored reference queries are checked against all 12 fixtures locally; this is separate from real sandbox execution validation.
- **Admin → Operations:** bounded 7/30/90-day reports for sprint progression, learners active on multiple UTC dates, review queues, pending submissions and structural content gaps. Provider metering records request metadata, token/cache counts and audio duration; no prompts or recordings. The dashboard distinguishes absent/configured services from execution evidence.

Provider cost estimates are opt-in through `PROVIDER_RATES_JSON` in the API environment. Its keys are `provider:model`; supported fields are `inputPerMillion`, `outputPerMillion`, `cacheReadPerMillion`, `cacheWritePerMillion` and `perMinute`, all in USD. Use your contracted rates. Missing rates or failed calls stay **unknown**, and history is not repriced automatically. Estimates exclude infrastructure, staffing and tax and cannot establish profitability by themselves.

`pnpm --filter @eyf/api pilot:doctor` checks DB, Redis, incomplete migrations, judge reachability/worker presence, Docker compatibility, private-volume writability and configuration presence without printing secrets or sending mail. `pilot:verify` additionally fails when required live-provider configuration is absent or contains placeholders. Neither command claims that configuration alone proves provider delivery. It exits nonzero when core execution is blocked. The inspected local environment has working DB/Redis and a Clerk key. Anthropic and Resend contain placeholder credentials; the transcription key and Sentry DSN are missing. Readiness reporting distinguishes placeholders from configured values. Actual signup, complete AI interview, audio, mail delivery, TURN across two networks, production deployment, load behavior and backup restoration remain deployment acceptance checks. Existing backup/restore and monitoring tooling is in `docs/DEVOPS.md`; restore only into a designated recovery database. Payments remain deferred.

Judge0 deployment references: [official 1.13.1 release requirements](https://github.com/judge0/judge0/releases/tag/v1.13.1), [official configuration](https://github.com/judge0/judge0/blob/v1.13.1/judge0.conf). A public API health response is not proof of functioning sandbox workers.

- [ ] Real Clerk signup → land on dashboard (dev-login disabled in prod)
- [ ] Solve a problem → Judge0 returns a verdict
- [ ] Subscribe via Razorpay (test mode) → plan gate lifts; invoice appears in `/admin/payments`
- [ ] Trigger the cron once → a real streak/digest email arrives (Resend)
- [ ] AI mock returns a graded rubric (Anthropic)
- [ ] PostHog receives events from a pillar
- [ ] Android dev build → screenshot is black (`FLAG_SECURE`)


### Local verification and pilot course (13 October 2026)

- `pnpm --filter @eyf/api judge:start` checks the Docker host before starting the bundled judge. The current Mac is ARM64/cgroup v2; configure a compatible private Linux amd64/cgroup-v1 Judge0 host and run the EYF worker. `judge:smoke` verifies actual accepted and wrong-answer results; it remains blocked without that host. Host requirements follow the [upstream Judge0 deployment guide](https://github.com/judge0/judge0/releases/tag/v1.13.1).
- `pnpm --filter @eyf/api pilot:load` creates and cleans up synthetic local records, serves the real API on a temporary loopback port, and checks 200 authenticated LMS reads from 20 concurrent learners. The measured local run passed with p95 **399 ms** and zero failed requests. This is not a production-capacity claim; repeat on staging with media, providers and realistic course sizes.
- `BACKUP_DATABASE_URL=<local-backup-role-url> pnpm --filter @eyf/api pilot:recovery` dumps the local database, restores into a fresh randomly named recovery database, compares core table counts and media RLS, then drops only that recovery database. It also restores and hashes the private media volume when present. The local database restore passed using the local PostgreSQL owner; the restricted application role correctly could not dump FORCE-RLS tables. No real media uploads existed during this drill, so media-volume recovery still needs acceptance with actual files. Private recovery artifacts are retained in an OS temporary directory; move backups off-host for production.
- **Courses → New course → Use SQL pilot course** creates a reviewable draft with five substantive lessons, six graded questions and two existing versioned SQL labs. It covers trusted scope, stable ordering, LEFT JOIN semantics, zero/NULL values, duplicate amounts and a review rubric. Assign it through Programs and Cohorts after instructor review. Real lab completion still needs a working judge; the UI does not manufacture accepted submissions.

The remaining external acceptance requirements are real Clerk login on both deployed
origins, verified AI/audio credentials, a verified email sender and inbox delivery,
a Sentry project/DSN, compatible Judge0 hosting, cross-network TURN, production
DNS/TLS, and an actual customer pilot. Payments remain intentionally deferred.
