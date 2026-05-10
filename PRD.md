Product Requirements Document (PRD)

EYF — Engineer Your Future (MVP v2.2)

1. Document Control

┌───────────────┬─────────────────────────────────────┐
│ Field         │ Value                               │
├───────────────┼─────────────────────────────────────┤
│ Product       │ EYF — Engineer Your Future          │
├───────────────┼─────────────────────────────────────┤
│ Document Type │ Product Requirements Document (MVP) │
├───────────────┼─────────────────────────────────────┤
│ Version       │ v2.2                                │
├───────────────┼─────────────────────────────────────┤
│ Date          │ 17 Apr 2026                         │
├───────────────┼─────────────────────────────────────┤
│ Owner         │ Product + Engineering + Security    │
├───────────────┼─────────────────────────────────────┤
│ Status        │ Ready for implementation            │
├───────────────┼─────────────────────────────────────┤
│ Platform      │ Web (Public + Authority apps)       │
└───────────────┴─────────────────────────────────────┘

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2. Product Overview

EYF is a guided engineer growth platform that unifies coding practice, concept revision, execution understanding, placement preparation, and resume readiness.

Core loop:
Pick Problem -> Solve -> Run -> Submit -> Visualize -> Next Problem

The MVP must connect this loop to measurable progression (XP/streaks), plan-based access, and secure monetization.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

3. Problem Statement

Current users rely on fragmented tools (coding sites, notes apps, prep portals, resume tools), causing context switching, low retention, weak feedback, and poor placement outcomes. EYF solves this with one connected workflow and clear progression paths.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

4. Product Goals & Success Metrics

4.1 User Metrics

 - Problem completion rate (started -> successful submit): >= 35% weekly
 - Day-7 retention: >= 28%
 - Next-problem CTR from success state: >= 55%
 - Visualizer adoption on successful submit: >= 30%

4.2 Business Metrics

 - Free-to-paid conversion in first 30 days: >= 6%
 - Payment success rate: >= 97%
 - Paid churn: < 8% monthly

4.3 Technical Metrics

 - API P95 (non-execution): < 400 ms
 - Run code P95: <
  3.0 s
 - Submit code P95: <
  3.5 s
 - Uptime: >=
  99.5% monthly

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

5. Scope

5.1 In Scope (MVP)

 - Public auth + authority auth
 - RBAC (user, staff, admin)
 - Plan entitlements (free/basic/pro/elite)
 - Problem list/detail/editor/run/submit
 - Docker execution sandbox (hardened)
 - Visualizer MVP (sorting, binary search)
 - Recommendation engine v1 (rule-based)
 - Core subjects (OS/DBMS/CN/OOP)
 - Placement attempts + mock interview gating
 - Mentorship booking quotas
 - Resume builder + PDF export
 - Billing (checkout, webhook, plan change)
 - Analytics, support, authority operations

5.2 Out of Scope

 - AI interview copilot
 - Community forum
 - Enterprise multi-tenant org features
 - Full algorithm visualizer coverage

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

6. Architecture & Zone Split

6.1 Public Zone

 - Routes: /auth/*, /app/*
 - Actor: role=user
 - Plan entitlement checks apply

6.2 Authority Zone

 - Routes: /authority/login, /authority/*
 - Actors: role=staff, role=admin
 - RBAC only (no user plan logic)

6.3 Global Access Rule

Allow = ZoneGuard + JWTAuth + SessionGuard + RBAC + OwnershipCheck + EntitlementCheck(role=user only)

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

7. Roles, Plans, and Entitlements

7.1 Roles

 - user: learner/customer
 - staff: operations reviewer
 - admin: system/content/billing operator

7.2 Plan Matrix (Final Locked)

┌──────────────────────┬─────────┬──────────────────┬───────────────┬───────────────┐
│ Feature              │ Free    │ Basic            │ Pro           │ Elite         │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ DSA library          │ Starter │ Expanded limited │ Unlimited     │ Unlimited     │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Daily submissions    │ 10/day  │ 50/day           │ Unlimited     │ Unlimited     │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Core subjects        │ Intro   │ Basic            │ Full + videos │ Full + videos │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Visualizer           │ Locked  │ Locked           │ Enabled       │ Enabled       │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Mock interviews      │ No      │ No               │ Enabled       │ Enabled       │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Mentorship sessions  │ 0/mo    │ 0/mo             │ 1/mo          │ 4/mo          │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ AI code review       │ No      │ No               │ Yes           │ Yes           │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Resume PDF export    │ No      │ No/limited       │ Yes           │ Yes           │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Analytics depth      │ Basic   │ Basic            │ Advanced      │ Advanced      │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Personalized roadmap │ No      │ No               │ Yes           │ Yes           │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Company prep grids   │ No      │ No               │ Yes           │ Yes           │
├──────────────────────┼─────────┼──────────────────┼───────────────┼───────────────┤
│ Referral access      │ No      │ No               │ No            │ Yes           │
└──────────────────────┴─────────┴──────────────────┴───────────────┴───────────────┘

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

8. Security Policies (Non-negotiable)

 1. Single active session for all plans.
 2. New login revokes old active session immediately.
 3. JWT must carry session_id; mismatch -> 401 SESSION_REVOKED.
 4. Refresh token rotation with family replay detection.
 5. 2FA (TOTP + backup codes), mandatory on risky/sensitive actions.
 6. Risk-aware auth using device/IP/ASN/geo anomalies.
 7. Premium access enforced on backend only.
 8. Ownership checks on all user-owned resources (prevent IDOR).
 9. Webhook signature verification + idempotency required.
 10. Execution sandbox hardened (no network, no host FS, strict limits).
 11. Premium content protection via watermark + signed URLs.
 12. Immutable security/audit logs.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

9. Functional Requirements

9.1 Authentication & Session (P0)

 - Register with unique email (409 on duplicate)
 - Login returns access + refresh tokens
 - Refresh rotates token; previous token revoked
 - Logout revokes session
 - Protected endpoints reject unauthenticated (401)
 - Login rate limiting by IP + identifier
 - Token replay detection revokes family and active session

9.2 Risk & 2FA (P0/P1)

 - TOTP setup/verify/disable flows
 - Backup codes generation + one-time usage
 - Risk score thresholds:
  - <60: allow
  - 60-84: require 2FA challenge
  - >=85: temporary block/challenge
 - Recent login activity visibility

9.3 DSA Module (P0/P1)

 - Problem list with filter/search/pagination
 - Problem detail with statement/examples/editor
 - Run endpoint for sample/custom input
 - Submit endpoint with hidden test evaluation
 - Store status/runtime/memory/language
 - Success state with Next + Visualize CTAs

9.4 Visualizer (P1)

 - Playback controls (play/pause/next/speed)
 - MVP algorithms: sorting + binary search
 - Access only for Pro/Elite
 - Free/Basic receives locked state + upgrade prompt

9.5 Recommendation Engine v1 (P1)

 - Inputs: solved/failed history + topic signal
 - Strong-topic streak -> increase difficulty
 - Weak-topic failure streak -> easier prerequisite
 - Dashboard outputs one next problem + weak-topic insight

9.6 Core Subjects (P1/P2)

 - Subject/topic listing
 - Structured note rendering
 - Access governed by plan level

9.7 Placement, Mock, Mentorship (P1)

 - Placement attempt create/list
 - Mock interview only Pro/Elite
 - Mentorship monthly quota:
  - Pro = 1
  - Elite = 4
 - Quota exceeded returns MENTORSHIP_QUOTA_EXCEEDED

9.8 Resume (P1)

 - Save/get structured resume
 - Live preview
 - Template selection
 - PDF export with entitlement checks + watermark marker

9.9 Billing (P0/P1)

 - Plans endpoint
 - Checkout session creation (provider-hosted)
 - Webhook processing with signature and idempotency
 - Plan upgrade/downgrade with effective-date rules
 - Failure handling must preserve existing entitlement

9.10 Authority Operations (P0/P1)

 - /authority/login entry
 - Staff queue dashboard
 - Application detail and action flow
 - Admin problem/test-case CRUD
 - Admin billing/status views
 - All authority actions audited

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

10. API Surface (v1)

10.1 Auth/Security

 - POST /api/v1/auth/register
 - POST /api/v1/auth/login
 - POST /api/v1/auth/refresh
 - POST /api/v1/auth/logout
 - POST /api/v1/security/2fa/setup
 - POST /api/v1/security/2fa/verify
 - POST /api/v1/security/2fa/disable
 - GET /api/v1/security/sessions
 - POST /api/v1/security/sessions/{id}/revoke
 - GET /api/v1/security/logins

10.2 Public Core

 - GET /api/v1/dashboard
 - GET /api/v1/problems
 - GET /api/v1/problems/{id}
 - POST /api/v1/problems/{id}/run
 - POST /api/v1/problems/{id}/submit
 - GET /api/v1/recommendations/next
 - POST /api/v1/visualizer/{submission_id}/trace
 - GET /api/v1/visualizer/{submission_id}
 - GET /api/v1/core-subjects
 - GET /api/v1/core-subjects/{subject}/{topic}
 - POST /api/v1/placement/attempts
 - GET /api/v1/placement/attempts
 - POST /api/v1/placement/mock-attempts
 - POST /api/v1/mentorship/bookings
 - GET /api/v1/mentorship/bookings
 - POST /api/v1/resume/save
 - GET /api/v1/resume
 - POST /api/v1/resume/export-pdf

10.3 Billing

 - GET /api/v1/plans
 - POST /api/v1/billing/checkout
 - POST /api/v1/billing/webhook
 - POST /api/v1/billing/change-plan

10.4 Support/Analytics

 - POST /api/v1/analytics/events
 - POST /api/v1/support/tickets

10.5 Authority/Admin

 - POST /api/v1/authority/login
 - GET /api/v1/authority/queue
 - GET /api/v1/authority/applications/{id}
 - POST /api/v1/authority/applications/{id}/actions
 - GET/POST/PUT/DELETE /api/v1/admin/problems...

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

11. Error Contract

Standard envelope:

 {
   "error": {
     "code": "FEATURE_LOCKED",
     "message": "Visualizer is available on Pro and Elite plans only."
   }
 }

Codes:

 - UNAUTHORIZED
 - SESSION_REVOKED
 - TOKEN_REUSE_DETECTED
 - TWO_FA_REQUIRED
 - RISK_CHALLENGE_REQUIRED
 - FEATURE_LOCKED
 - QUOTA_EXCEEDED
 - MENTORSHIP_QUOTA_EXCEEDED
 - FORBIDDEN_RESOURCE_ACCESS
 - WEBHOOK_SIGNATURE_INVALID

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

12. Data Model (MVP)

Required tables:

 - users (includes role, plan, active_session_id)
 - user_sessions
 - refresh_tokens (family/replay fields)
 - user_security_settings
 - login_events
 - plan_entitlements
 - daily_submission_usage
 - user_monthly_usage
 - problems
 - problem_test_cases
 - submissions
 - execution_runs
 - visualizer_traces
 - core_subject_notes
 - placement_attempts
 - mentorship_bookings
 - resumes
 - subscriptions
 - billing_events (provider_event_id unique)
 - analytics_events
 - support_tickets
 - admin_audit_logs

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

13. Transaction & Concurrency Rules

 1. Daily quota check uses transaction + row lock on usage row.
 2. Mentorship booking quota uses transaction + row lock on monthly usage row.
 3. Billing webhook inserts idempotency key first; duplicate returns success/no-op.
 4. Subscription state change and user plan update must be atomic.
 5. Ownership checks occur before any read/write of user resource.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

14. Execution Sandbox Hardening

 - --network none
 - read-only root FS + tmpfs writable dirs
 - no host mounts except controlled scratch
 - strict memory/CPU/pids/time limits
 - seccomp/AppArmor/SELinux profile
 - no-new-privileges
 - language runtime allowlist
 - normalized output only (no internal stack traces)

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

15. Anti-Piracy & Anti-Sharing

 - Dynamic forensic watermark on premium screens
 - PDF/video watermark marker
 - short-lived signed URLs (HMAC + nonce + expiry)
 - anti-scraping rate limits and anomaly detection
 - policy enforcement: warn -> temporary lock -> suspension

Note: screenshots/recording cannot be fully blocked at OS level on web; deterrence + traceability is required approach.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

16. UX Requirements

 - Loading/empty/error/success states on all critical screens
 - mobile responsive (<1024px single-column adaptation)
 - inline form validation + clear retries
 - high-contrast CTAs
 - accessible keyboard flow and labels

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

17. User Flows

17.1 Onboarding Flow

Register -> verify -> login -> risk/2FA (if needed) -> dashboard recommendation.

17.2 Core Solve Flow

Dashboard -> problem detail -> run -> iterate -> submit -> success -> visualize/next.

17.3 Weak Topic Recovery Flow

Repeated failure -> weak-topic signal -> easier recommendation -> improvement loop.

17.4 Upgrade & Billing Flow

Lock/quota hit -> plan page -> checkout -> webhook update -> entitlement refresh.

17.5 Mentorship Flow

Open bookings -> quota check -> book -> confirm or quota-exceeded response.

17.6 Session Security Flow

New device login -> old session revoked -> old device forced re-auth.

17.7 Authority Staff Flow

Authority login -> queue -> open application -> action -> audit log entry.

17.8 Authority Admin Flow

Admin login -> manage problems/test-cases/plans -> export reports -> audit log.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

18. User Journeys (Narrative)

 1. Student first success: solve first problem and continue momentum.
 2. Job switcher remediation: fail hard topic, receive guided easier path, improve.
 3. Pro value realization: use visualizer + mock + mentorship quota.
 4. Free conversion path: quota lock triggers upgrade and successful checkout.
 5. Operations journey: staff/admin process applications securely with traceability.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

19. Storyboards (Screen Sequence)

S1 Core Loop (Pro)

Dashboard -> Detail/Editor -> Run fail -> Run pass -> Submit accepted -> Visualizer -> Next.

S2 Feature Lock (Free/Basic)

Success -> click Visualize -> lock modal -> plan comparison -> checkout CTA.

S3 Payment Failure Recovery

Checkout -> provider decline -> plan unchanged -> retry/support options.

S4 Session Replacement

Device A active -> Device B logs in -> Device A sees session revoked state.

S5 Authority Processing

Authority login -> queue list -> application detail -> action modal -> audit confirmation.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

20. Environment & Deployment

 - Environments: dev, staging, prod
 - staging mirrors billing/webhook/email behavior
 - release sequence includes DB migration safety and rollback
 - feature flags for risky rollouts (billing/security/visualizer)

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

21. Compliance, Legal, Privacy

 - Terms + Privacy policy required pre-launch
 - consent/version capture (terms/privacy versions with timestamp/IP hash)
 - data rights: export/correct/delete workflows
 - retention windows by data class
 - minors policy and regional consent behavior
 - cookie/analytics consent by region

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

22. Billing Operations Completeness

 - refund policy and SLA
 - chargeback/dispute handling
 - dunning/retry schedule for failed renewals
 - invoices/receipts generation
 - cancellation-at-period-end handling
 - downgrade effective-date rules
 - tax handling requirement (jurisdiction-based)

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

23. Observability & Incident Response

 - central logs, metrics, tracing, error tracking
 - alerts: auth spikes, webhook failures, submit timeout spikes, sandbox failures
 - severity model (Sev1/2/3)
 - on-call escalation tree
 - security incident runbook: detect -> contain -> recover -> postmortem
 - user notification policy for impactful incidents

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

24. QA and Test Strategy

Unit

 - entitlement resolver
 - risk scoring
 - quota calculators
 - signed URL verification
 - token rotation/replay logic

Integration

 - single-session revocation
 - refresh replay full revoke
 - ownership/IDOR checks
 - mentorship quota enforcement
 - webhook dedupe + signature validation

E2E

 - Pro full loop with visualizer
 - Free/Basic visualizer locked
 - Pro second mentorship booking denied
 - payment failure keeps entitlement unchanged
 - authority queue action flow

Security

 - IDOR, XSS, injection probes
 - rate-limit bypass tests
 - sandbox escape/network/fs tests

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

25. 15-Day Delivery Plan

 1. Day 1: repo setup, CI, env, migration skeleton
 2. Day 2: auth + JWT + rate limits
 3. Day 3: single-session + token family rotation
 4. Day 4: risk engine + 2FA + login events
 5. Day 5: entitlements + usage counters + middleware framework
 6. Day 6: problem schema + list/detail APIs
 7. Day 7: run endpoint + sandbox adapter
 8. Day 8: submit + hidden tests + transactional quota
 9. Day 9: dashboard + recommendation v1
 10. Day 10: visualizer + Pro/Elite gate + watermark
 11. Day 11: placement/mock + mentorship quotas
 12. Day 12: resume + PDF export protections
 13. Day 13: checkout + webhook idempotency + plan change
 14. Day 14: authority/admin/support/analytics hardening
 15. Day 15: regression + security + performance + release gate

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

26. Definition of Done & Release Gate

A feature is done only if:

 1. Functional acceptance passes
 2. Security controls validated
 3. Automated tests pass
 4. Monitoring/audit logging included
 5. UX states complete (loading/empty/error/success)

Release blocked unless:

 - core loop stable (no P1 defects)
 - RBAC + entitlements enforced server-side
 - single-session + replay defense validated
 - webhook security/idempotency validated
 - sandbox isolation validated
 - authority workflows and audit trails operational
 - rollback and alerting verified


27. Module-First Product Structure (Critical Update)

27.1 Positioning Update

EYF is a module-based engineer growth platform, not only a problem-solving app.
After login, users should first land on a unified Module Home and choose what to work on.

The five primary modules are:

 1. DSA Practice
 2. Core Subjects
 3. Placement Prep
 4. Resume Builder
 5. Tech Skills

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.2 Primary Navigation and Entry Points

Public Entry

 - / -> Landing page (marketing + conversion)
 - /auth/login, /auth/register
 - /authority/login (staff/admin entry)

Authenticated User Entry

 - Default post-login route: /app/home
 - /app/home is mandatory and must not be skipped.

Authority Entry

 - /authority/login -> /authority/queue (or role-specific dashboard)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.3 Landing Page Requirements (/)

Goal

Convert visitors into registered users and clearly communicate multi-module value.

Required sections

 1. Hero (headline + primary CTA “Get Started” + secondary CTA “Login”)
 2. Value proposition strip (Learn, Practice, Track, Apply, Get Hired)
 3. Module overview cards (all 5 modules)
 4. Plan comparison preview (Free/Basic/Pro/Elite highlights)
 5. Outcomes/social proof section
 6. FAQ section
 7. Security/trust strip (secure billing, account protection, privacy)
 8. Footer with policy/legal links
 9. Authority login link (/authority/login)

Mandatory CTAs

 - Start Free
 - View Plans
 - Login
 - Authority Login

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.4 Module Home Requirements (/app/home)

Goal

Give users a clear “control center” to pick what they want to do next.

Screen blocks (top to bottom)

 1. Welcome Header
  - greeting, motivation line
  - current plan badge
 2. Progress Snapshot
  - XP
  - streak
  - daily submissions used/remaining
  - mentorship usage (if Pro/Elite)
 3. Start Here Recommendation Card
  - one recommended next action from recommender
  - CTA: “Start Now”
 4. Module Grid (5 cards)
  - DSA Practice
  - Core Subjects
  - Placement Prep
  - Resume Builder
  - Tech Skills
 5. Recent Activity Feed
  - latest attempts, resume updates, completed topics
 6. Plan Lock States
  - locked features show clear upsell and upgrade CTA
 7. Quick Actions
  - Continue last activity
  - Open support
  - View plan

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.5 Module Card Contract (common design for all 5 cards)

Each module card must include:

 1. Module title + icon
 2. One-line purpose
 3. Progress indicator (percent or milestones)
 4. Last activity timestamp
 5. Primary CTA:
  - Start (if new)
  - Continue (if in progress)
 6. Access state:
  - Unlocked
  - Partially Locked
  - Locked
 7. If locked, show:
  - locked feature reason
  - plan required
  - Upgrade CTA

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.6 Module Definitions (Detailed)

A) DSA Practice

Purpose

Coding fluency, pattern recognition, interview coding confidence.

Core capabilities

 - Problem list/filter/search
 - Run/submit
 - Success insights + next recommendation
 - Visualizer (Pro/Elite)

Success metrics

 - attempts/day
 - acceptance rate
 - topic mastery trend

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

B) Core Subjects

Purpose

Strengthen CS fundamentals (OS/DBMS/CN/OOP).

Core capabilities

 - Subject/topic browsing
 - Note/video access by plan
 - Topic completion marking
 - Weak-topic mapping to DSA/Placement

Success metrics

 - topics completed/week
 - revision frequency
 - weak-topic reduction

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

C) Placement Prep

Purpose

Interview readiness via aptitude, coding rounds, mock interviews.

Core capabilities

 - Aptitude attempt logging
 - Coding attempt logs
 - Mock interviews (Pro/Elite only)
 - Interview question bank access by plan

Success metrics

 - mock completion rate
 - score trend
 - readiness index

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

D) Resume Builder

Purpose

Create and maintain job-ready resume artifacts inside EYF.

Core capabilities

 - structured resume form
 - live preview
 - template selection
 - PDF export (plan-gated)

Success metrics

 - profile completeness score
 - export count
 - update cadence

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

E) Tech Skills

Purpose

Track practical stack readiness beyond DSA (projects/tools/workflows).

Core capabilities

 - skill roadmap/track view
 - progress by skill domain
 - milestone/checkpoint tracking
 - recommended next skill tasks

Success metrics

 - skill milestone completion
 - consistency score
 - roadmap adherence

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.7 Recommendation System (Module-aware)

Recommendation engine must output:

 1. recommended_module
 2. recommended_action
 3. reason_code
 4. difficulty_or_level
 5. estimated_effort

Example outputs

 - “Continue DSA -> Arrays medium problem (weak-topic recovery)”
 - “Resume Builder -> Add 2 project bullets to reach 80% completeness”
 - “Core Subjects -> Revise DBMS normalization topic before mock”

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.8 Routing Rules (User App)

 1. After successful login, redirect to /app/home.
 2. If user left an unfinished critical task, show “Continue where you left off” in home.
 3. Deep links to module routes must still pass RBAC + entitlement checks.
 4. Session revoked state can interrupt any route and force re-login.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.9 API Additions for Module Home

Add/confirm these endpoints:

 1. GET /api/v1/home/summary
  - xp, streak, usage counters, plan, module progress summary
 2. GET /api/v1/home/recommendation
  - next best module/action recommendation
 3. GET /api/v1/home/recent-activity
  - timeline items across all modules
 4. GET /api/v1/modules/status
  - per module lock/unlock + progress + CTA state

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.10 Data Model Additions (if missing)

 1. module_progress
  - user_id, module_key, completion_percent, last_activity_at, status
 2. user_learning_goals
  - user_id, target_role, target_timeline, priority_modules
 3. tech_skill_progress
  - user_id, skill_key, level, milestones_completed
 4. recent_activity
  - user_id, module_key, action_type, metadata, created_at

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.11 UX States for /app/home

Must support:

 1. Loading (skeleton cards)
 2. Empty (new user with onboarding CTA)
 3. Active (normal module dashboard)
 4. Error (retry + support CTA)
 5. Locked feature overlays
 6. Plan upgrade prompt states

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

27.12 Acceptance Criteria

 1. Every successful user login lands on /app/home.
 2. /app/home shows all 5 modules with progress and CTA.
 3. Module locks reflect backend entitlements accurately.
 4. Recommendation card points to one concrete next action.
 5. Users can start/continue any unlocked module in one click.
 6. Locked module actions always return clear upgrade path.
 7. Home data loads within target performance budget.
 8. Home supports desktop and mobile responsive layouts.

  28. Recommendation Engine Specification

  28.1 Objective

   - Produce exactly one deterministic next-action recommendation per user request.
   - Compute on backend only.
   - Return stable output for same input snapshot.

  28.2 Inputs (authoritative)

   - submissions (last 30 days)
   - daily_submission_usage
   - placement_attempts (last 30 days)
   - core_subject_progress (topic completion + last_revised_at)
   - resumes (completeness score)
   - tech_skill_progress (from Section 29)
   - module_progress (from Section
    27.10)
   - user_learning_goals (target role, priority modules)
   - plan_entitlements + current users.plan
   - user_monthly_usage (mock/mentorship usage)

  28.3 Deterministic scoring model

  For each module m ∈ {dsa, core_subjects, placement, resume, tech_skills} compute:

   score(m) =
     w_goal(m)        * goal_alignment(m)        +
     w_urgency(m)     * urgency(m)               +
     w_stagnation(m)  * stagnation(m)            +
     w_weakness(m)    * weakness_signal(m)       +
     w_deadline(m)    * deadline_pressure(m)     +
     w_plan(m)        * entitlement_bonus(m)     +
     w_recent(m)      * novelty_bonus(m)         -
     w_fatigue(m)     * fatigue_penalty(m)

  Global default weights:

   - w_goal=0.30
   - w_urgency=0.20
   - w_stagnation=0.15
   - w_weakness=0.15
   - w_deadline=0.10
   - w_plan=0.05
   - w_recent=0.05
   - w_fatigue=0.10

  All component values normalized to [0,1].

  28.4 Module-specific component definitions

   - goal_alignment: matches user target role roadmap.
   - urgency: days since last activity in module (sigmoid normalization).
   - stagnation: no measurable progress in last N actions.
   - weakness_signal:
    - DSA: topic failure ratio
    - Core: low retention/revision frequency
    - Placement: declining attempt scores
    - Resume: completeness below target threshold
    - Tech Skills: milestone overdue
   - deadline_pressure: higher if user goal date within 30 days.
   - entitlement_bonus: +1 only if feature fully available in current plan; 0 if locked.
   - novelty_bonus: preference against repeating same module >2 consecutive recommendations.
   - fatigue_penalty: if user spent >70% recent actions in same module.

  28.5 Priority resolution

   1. Compute score for all modules.
   2. Exclude modules fully inaccessible by entitlement.
   3. Select top module by score.
   4. Select top action inside module by action score.
   5. Tiebreakers (strict order):
   
    1. higher weakness_signal
   
    2. lower last_action_at
   
    3. lower estimated_effort_minutes
   
    4. lexical action_id (final deterministic tie-break)

  28.6 Cold-start logic

   - Condition: user has <3 tracked actions total.
   - Rule sequence:
   
    1. show onboarding action in /app/home
   
    2. first recommendation: DSA easy starter
   
    3. second: Core Subjects intro topic
   
    4. third: Resume baseline setup
   
    5. then switch to scoring model

  28.7 Conflict resolution

   - If top module action is blocked by quota/plan:
    - downgrade to next highest available action in same module.
    - if none, fallback to next module by score.
   - If all actions blocked:
    - return action_type="upgrade_prompt" with required plan.

  28.8 Output contract

   {
     "recommendation_id": "rec_01J...",
     "generated_at": "2026-04-17T17:30:00Z",
     "user_id": "uuid",
     "module": "dsa|core_subjects|placement|resume|tech_skills|billing",
     "action_type": "solve_problem|revise_topic|take_mock|update_resume|complete_skill_task|upgrade_prompt",
     "action_id": "string",
     "title": "string",
     "reason_code": "WEAK_TOPIC|STAGNATION|GOAL_ALIGNMENT|QUOTA_BLOCKED|COLD_START",
     "score": 0.0,
     "estimated_effort_minutes": 25,
     "difficulty_or_level": "easy|medium|hard|L1|L2|L3",
     "required_plan": "free|basic|pro|elite|null",
     "fallback_action_id": "string|null",
     "expires_at": "2026-04-18T00:00:00Z"
   }

  28.9 Pseudocode

   function recommend(user_id):
     snap = load_feature_snapshot(user_id)
     if snap.total_actions < 3:
       return cold_start_recommendation(snap)
   
     module_scores = {}
     for m in MODULES:
       if !is_module_accessible(m, snap.plan):
         continue
       module_scores[m] = calc_module_score(m, snap)
   
     sorted_modules = sort_desc(module_scores, tie_break=[weakness, last_action_at, module_name])
   
     for m in sorted_modules:
       actions = rank_actions_in_module(m, snap)
       for a in actions:
         if is_action_allowed(a, snap):
           return build_recommendation(m, a, snap)
     return build_upgrade_prompt(snap)

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  29. Tech Skills System Specification

  29.1 Data model

   CREATE TABLE tech_skill_catalog (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     skill_key TEXT UNIQUE NOT NULL,              -- e.g. "git", "docker", "django-rest"
     name TEXT NOT NULL,
     category TEXT NOT NULL,                      -- backend/frontend/devops/data
     level_min INT NOT NULL DEFAULT 1,
     level_max INT NOT NULL DEFAULT 5,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   
   CREATE TABLE tech_skill_tasks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     skill_id UUID NOT NULL REFERENCES tech_skill_catalog(id) ON DELETE CASCADE,
     task_key TEXT UNIQUE NOT NULL,
     task_type TEXT NOT NULL CHECK (task_type IN ('project','quiz','reading','checkpoint')),
     title TEXT NOT NULL,
     description_md TEXT NOT NULL,
     level INT NOT NULL,                          -- 1..5
     estimated_effort_minutes INT NOT NULL,
     points INT NOT NULL DEFAULT 10,
     dependencies JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of task_keys
     is_active BOOLEAN NOT NULL DEFAULT TRUE
   );
   
   CREATE TABLE user_tech_skill_progress (
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     skill_id UUID NOT NULL REFERENCES tech_skill_catalog(id) ON DELETE CASCADE,
     current_level INT NOT NULL DEFAULT 1,
     xp_points INT NOT NULL DEFAULT 0,
     milestone_index INT NOT NULL DEFAULT 0,
     last_activity_at TIMESTAMPTZ,
     PRIMARY KEY (user_id, skill_id)
   );
   
   CREATE TABLE user_tech_skill_task_attempts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     task_id UUID NOT NULL REFERENCES tech_skill_tasks(id) ON DELETE CASCADE,
     status TEXT NOT NULL CHECK (status IN ('started','submitted','passed','failed')),
     score NUMERIC(5,2),
     evidence_url TEXT,
     metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE(user_id, task_id, status, created_at)
   );

  29.2 Progression model

   - Levels L1..L5 per skill.
   - Level up criterion:
    - complete all mandatory tasks for current level
    - reach minimum XP threshold for next level.
   - Mandatory task selection:
    - task_type in (project,checkpoint) are mandatory.
   - XP formula:
    - project=40, quiz=15, reading=10, checkpoint=25
    - multiply by quality_factor (0.8..1.2) from score.

  29.3 Task types

   - project: artifact submission/evidence required.
   - quiz: objective scoring.
   - reading: completion + quick checkpoint question.
   - checkpoint: gated practical validation.

  29.4 Recommendation linkage

   - If DSA weakness in topic requiring missing tech prerequisite, increase Tech Skills module score by +0.15.
   - If user has no activity in tech skills for 7 days and roadmap active, set urgency floor to 0.6.
   - recommendations may emit action_type=complete_skill_task.

  29.5 APIs

   - GET /api/v1/tech-skills/catalog
   - GET /api/v1/tech-skills/{skill_key}
   - GET /api/v1/tech-skills/progress
   - POST /api/v1/tech-skills/tasks/{task_key}/start
   - POST /api/v1/tech-skills/tasks/{task_key}/submit
   - GET /api/v1/tech-skills/tasks/{task_key}/status

  Submit request:

   {
     "evidence_url": "https://...",
     "answers": [{"q":"q1","a":"..."}],
     "metadata": {"repo":"...", "notes":"..."}
   }

  Submit response:

   {
     "task_key":"docker-l2-project",
     "status":"passed",
     "awarded_xp":48,
     "skill_level_before":2,
     "skill_level_after":3,
     "next_task_key":"k8s-l3-reading"
   }

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  30. Visualizer System Specification

  30.1 MVP trace generation strategy

   - Supported only for curated problem set (visualizer_enabled=true at problem level).
   - Generation mode:
   
    1. Runtime instrumentation during accepted submission for supported languages.
   
    2. Fallback to canonical precomputed trace if runtime instrumentation fails.
   - Traces generated asynchronously by worker; submit API returns quickly with trace job id.

  30.2 Trace storage format

   - Persist in visualizer_traces.
   - JSON schema:

   {
     "trace_version":"1.0",
     "problem_id":"uuid",
     "submission_id":"uuid",
     "algorithm":"sorting|binary_search",
     "input_snapshot":{"arr":[5,2,1]},
     "frames":[
       {
         "i":0,
         "timestamp_ms":0,
         "state":{"arr":[5,2,1],"l":0,"r":2,"mid":1},
         "highlight":{"indices":[0,1],"op":"compare"},
         "annotation":"compare arr[0] and arr[1]"
       }
     ],
     "summary":{"steps":42,"time_ms":12}
   }

  30.3 Playback contract

  GET /api/v1/visualizer/{submission_id} response:

   {
     "submission_id":"uuid",
     "status":"ready|processing|failed",
     "trace_url":"signed-url-or-null",
     "frame_count":42,
     "max_speed":4,
     "default_speed":1,
     "watermark":{"id":"wm_...","token":"..."}
   }

  30.4 Performance constraints

   - Trace generation P95 <1200ms for supported MVP problem sizes.
   - Trace payload size limit: <=1.5MB.
   - Frame cap: <=1500.
   - If limits exceeded: truncate with truncated=true and summary note.

  30.5 Failure handling

   - Status transitions: processing -> ready|failed.
   - On failure:
    - return deterministic error code TRACE_GENERATION_FAILED.
    - expose retry endpoint (POST /api/v1/visualizer/{submission_id}/trace/retry) max 2 retries.
    - if still failed, fallback to canonical explanation card.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  31. Billing System Specification

  31.1 Provider abstraction layer

  Interface:

   interface BillingProvider {
     createCheckoutSession(input): Promise<{sessionId:string, redirectUrl:string}>;
     cancelSubscription(providerSubscriptionId:string): Promise<void>;
     changePlan(providerSubscriptionId:string, targetPlan:string): Promise<void>;
     verifyWebhookSignature(headers, rawBody): {valid:boolean, eventId:string, eventType:string, occurredAt:string};
     normalizeWebhookEvent(raw): NormalizedBillingEvent;
   }

  31.2 Internal subscription states

   - trialing
   - active
   - past_due
   - grace_period
   - paused
   - canceled
   - incomplete
   - incomplete_expired

  31.3 Webhook mapping

   - checkout.session.completed -> create subscription + set plan active
   - invoice.paid -> confirm active period
   - invoice.payment_failed -> move past_due, schedule dunning
   - customer.subscription.updated -> plan/status sync
   - customer.subscription.deleted -> set canceled at period end/immediate per policy
   - charge.refunded -> apply refund policy + entitlement rollback if required

  31.4 Idempotency (DB-level)

   CREATE TABLE billing_events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     provider TEXT NOT NULL,
     provider_event_id TEXT NOT NULL,
     event_type TEXT NOT NULL,
     payload JSONB NOT NULL,
     processed_at TIMESTAMPTZ,
     status TEXT NOT NULL DEFAULT 'received',
     UNIQUE(provider, provider_event_id)
   );

  Processing algorithm:

   1. Insert event row.
   2. On unique conflict => return 200 no-op.
   3. Process state transition in transaction.
   4. Mark processed_at and status='processed'.

  31.5 Retry/dunning logic

   - On payment_failed:
    - attempt retries at D+1, D+3, D+5.
    - keep plan active during grace (grace_period) for max 7 days.
    - after grace, downgrade to free/basic policy.
   - Send notifications at each retry and before downgrade.

  31.6 Edge-case handling

   - Double webhook: deduped by unique key.
   - Out-of-order events: ignore stale event using occurred_at < subscription.last_event_at.
   - Partial payment: do not activate plan until provider marks fully paid.
   - checkout success but webhook delay: temporary pending_activation state, max timeout 10 min.
   - downgrade mid-cycle: apply at period boundary unless explicit immediate downgrade policy.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  32. Session and Device Management Specification

  32.1 Device schema

   CREATE TABLE user_devices (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     device_hash TEXT NOT NULL,
     device_label TEXT,
     first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     trusted BOOLEAN NOT NULL DEFAULT FALSE,
     revoked_at TIMESTAMPTZ,
     UNIQUE(user_id, device_hash)
   );

  32.2 Fingerprinting strategy

   - Deterministic hash of:
    - normalized user-agent family/version
    - platform
    - timezone
    - language
    - hardware concurrency bucket
   - Hash with server secret (HMAC); store only hash.
   - Never use raw fingerprint as sole auth factor.

  32.3 Session visibility APIs

   - GET /api/v1/security/sessions

   {
     "active_session_id":"uuid",
     "sessions":[
       {"id":"uuid","device_label":"Chrome on Mac","city":"Bengaluru","last_seen_at":"...","is_current":true}
     ]
   }

   - POST /api/v1/security/sessions/{id}/revoke
   - GET /api/v1/security/logins

  32.4 Forced logout UX messaging

   - If session invalidated:
    - HTTP 401 SESSION_REVOKED
    - frontend modal text:
     - title: Session ended
     - body: Your account was signed in on another device. Please log in again.
   - Require full credential login; refresh token cannot recover revoked session.

  32.5 Suspicious activity handling

   - If risk score >= block threshold:
    - deny login
    - create security event
    - send account alert email
    - expose /security/logins/{id}/confirm workflow.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  33. Entitlement System Specification

  33.1 Middleware logic flow (exact)

   1. Resolve user_id, role, plan from authenticated token.
   2. If role != user, skip plan checks (RBAC still applies).
   3. Resolve required feature key from route map.
   4. Load entitlement snapshot (cache-first).
   5. Validate boolean feature flag.
   6. Validate numeric quotas (daily/monthly) in transaction when action consumes quota.
   7. Return 403 FEATURE_LOCKED or 403 QUOTA_EXCEEDED on deny.

  33.2 Cache strategy

   - Cache key: entitlements:{plan}:v{version}
   - TTL: 300s
   - Invalidate on plan table update/version bump.
   - For user-specific quota counters: no cache for write decisions.

  33.3 Downgrade mid-request handling

   - Token contains entitlement_version.
   - Middleware compares against users.entitlement_version.
   - If mismatch:
    - non-mutating requests proceed with latest entitlements.
    - mutating premium requests fail with PLAN_CHANGED_REAUTH_REQUIRED.

  33.4 Enforcement points

   - submit, visualizer, mock, mentorship, resume export, advanced analytics, question bank full access.
   - Enforcement occurs before business logic and before expensive compute.

  33.5 Race conditions

   - Quota-consuming endpoints must:
    - lock usage row (SELECT ... FOR UPDATE)
    - validate limit
    - increment in same transaction
    - execute critical action only after increment success.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  34. Module Home Backend Aggregation Specification

  34.1 Endpoints

   - GET /api/v1/home/summary
   - GET /api/v1/home/recommendation
   - GET /api/v1/home/recent-activity
   - GET /api/v1/modules/status

  34.2 Aggregation strategy

   - Build from pre-aggregated materialized tables updated by event consumers:
    - home_summary_snapshot
    - module_progress_snapshot
   - Read path:
   
    1. snapshot read (fast path)
   
    2. if stale > 5 min, trigger async refresh and return stale-with-timestamp
   
    3. if missing, synchronous fallback query limited to 500ms budget

  34.3 Response contract (/home/summary)

   {
     "user":{"id":"uuid","plan":"pro","xp":1200,"streak":7},
     "usage":{"daily_submissions_used":12,"daily_submissions_limit":null,"mentorship_used":1,"mentorship_limit":1},
     "modules":[
       {"key":"dsa","status":"unlocked","progress_percent":64,"last_activity_at":"...","cta":"continue"},
       {"key":"tech_skills","status":"unlocked","progress_percent":22,"last_activity_at":"...","cta":"start"}
     ],
     "recommendation_preview":{"module":"core_subjects","action_id":"dbms-normalization-l1"},
     "generated_at":"2026-04-17T17:30:00Z",
     "stale":false
   }

  34.4 Query optimization

   - Covering indexes on (user_id, created_at DESC) for activity tables.
   - Snapshot tables keyed by user_id.
   - Avoid N+1 by bulk fetching module progress in one query.
   - Use read replica for non-transactional home reads.

  34.5 Failure fallback

   - If recommendation service unavailable:
    - return summary without recommendation (null) and degraded=true.
   - If one module fails to aggregate:
    - return partial module list + module_errors[].

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  35. Analytics and Event System Specification

  35.1 Event schema

   {
     "event_id":"evt_01J...",
     "event_type":"problem_submitted",
     "event_version":"1.0",
     "occurred_at":"2026-04-17T17:30:00Z",
     "user_id":"uuid",
     "session_id":"uuid",
     "role":"user|staff|admin",
     "plan":"free|basic|pro|elite|null",
     "module":"dsa|core_subjects|placement|resume|tech_skills|authority",
     "context":{"page":"/app/problems/abc","request_id":"req_..."},
     "payload":{},
     "idempotency_key":"string"
   }

  35.2 Ingestion pipeline

   - API receives event -> schema validation -> enqueue -> async consumer writes to warehouse + operational DB.
   - Reject unknown event_type or invalid schema with 422.

  35.3 Must-track critical events

   - auth: login_success/fail, twofa_challenge, session_revoked
   - learning: problem_opened/run/submitted/result, visualizer_opened
   - conversion: upgrade_cta_clicked, checkout_started/success/failed
   - access: feature_locked, quota_exceeded
   - mentorship: booking_created/quota_denied
   - authority: application_action_taken, admin_crud_action

  35.4 Idempotency

   - Unique index on (event_type, idempotency_key).
   - Duplicate event returns 202 accepted_duplicate.

  35.5 Real-time vs batch

   - Real-time (<5s): operational dashboards, risk events, quota/lock alerts.
   - Batch (hourly/daily): cohort retention, conversion funnels, long-term product analytics.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  36. Concurrency and Race Condition Controls

  36.1 Quota updates

   - Use transaction + row lock on usage rows.
   - For missing row, INSERT ... ON CONFLICT ... then lock.
   - Never compute quota in client.

  36.2 Submission race handling

   - Introduce client idempotency key for submit:
    - header X-Idempotency-Key.
   - Table:

   CREATE TABLE request_idempotency (
     user_id UUID NOT NULL,
     endpoint TEXT NOT NULL,
     key TEXT NOT NULL,
     response_hash TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (user_id, endpoint, key)
   );

   - Duplicate submit with same key returns original result.

  36.3 Webhook duplication/out-of-order

   - Deduplicate using unique (provider, provider_event_id).
   - Store last_event_at on subscription.
   - Ignore stale events where event_time < last_event_at.

  36.4 Session replacement race

   - Login and refresh flows both require:
    - row lock on users record.
    - update active_session_id in single transaction.
   - Access token validation always references latest active_session_id.

  36.5 Mentorship booking race

   - Lock monthly usage row.
   - Validate quota and create booking in same transaction.
   - Enforce unique booking slot constraint to prevent double booking.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  37. Additional Security Controls Specification

  37.1 Request signing/idempotency for critical writes

   - Require X-Idempotency-Key on:
    - billing checkout/change plan
    - mentorship booking
    - submit
   - Reject missing key with 400 IDEMPOTENCY_KEY_REQUIRED.

  37.2 CSRF policy

   - If auth tokens are cookie-based: enforce CSRF token validation on all state-changing routes.
   - If bearer-only: block cross-origin credentials and strict CORS allowlist.

  37.3 File upload security (resume/support evidence)

   - MIME/type allowlist
   - AV scan before persistence
   - max size limits
   - strip active content in PDFs/images where applicable

  37.4 SSRF and outbound controls

   - Worker services must use outbound allowlist.
   - Block private IP ranges for any user-provided URL fetch.

  37.5 Secret and key management

   - Secrets in managed vault only.
   - Rotation policy every 90 days for app secrets; immediate rotation on compromise.
   - JWT signing key versioning with dual-key verification window.

  37.6 Audit log integrity

   - Append-only admin_audit_logs.
   - Include hash chain field (prev_hash, entry_hash) for tamper evidence.
   - Restrict delete/update permissions at DB role level.

  37.7 Request lifecycle enforcement order

   1. TLS termination
   2. WAF/rate limit
   3. AuthN
   4. Session guard
   5. Risk checks + 2FA challenge
   6. RBAC
   7. Ownership
   8. Entitlement
   9. Business logic
   10. Audit/event write