# EYF Enterprise Learning Platform — PRD & Product Architecture

**Version 1.0 · 2026-07-06 · Status: Canonical source of truth**
**Authors: EYF product team (PM · SaaS Architect · Founder · LMS Architect · UX Research · Software Architect · CTO · EM · Solution Design)**
**Builds on:** existing `Organization / Course / Lesson / Enrollment / InternshipSlot` models, capability RBAC (`@eyf/types/permissions`), Judge0 execution, Skill Graph, Readiness Index, ScoreShare, admin content platform, Ask EYF knowledge base.

---

## 0. The one idea everything hangs on

Every LMS tracks **completion**. Enterprises need **provable, deployable capability**. EYF already computes capability from *doing* (solves, mocks, projects, assessments) — no incumbent has this primitive.

Therefore this platform is **not an LMS**. It is a **Capability Operating System**:

> Courses, assessments, projects, code reviews, mentorship, and live classes are all just **evidence sources**. They feed one **Skill Ledger** per person. The ledger rolls up into team/department/org **Skill Matrices**. Hiring, onboarding, staffing, promotion, and training decisions all read from the same ledger.

The strategic loop (the moat):

```
Student builds a verified skill passport on EYF (B2C)
        │ hire from Talent Pool (evidence-based, not resume-based)
        ▼
Company onboards the hire on EYF — passport carries over, day-1 plan auto-generated
        │ train / certify / grow (B2B)
        ▼
Company posts internships+jobs back into EYF → more students join (B2C)
```

One profile from campus to career. Nobody else can build this because nobody else has both sides.

---

## 1. Executive Summary

EYF Enterprise Learning Platform ("EYF Enterprise") lets a company replace **TalentLMS + Moodle + Google Classroom + Judge0 + Zoom + HackerRank + Google Forms + Notion + Excel** with one product that:

1. **Onboards** engineers with auto-generated, skill-gap-driven day-1→day-90 plans.
2. **Trains** interns/freshers/employees with a Notion-grade course builder, live classes, labs, and the entire EYF practice arsenal (DSA engine, visualizer, core subjects, pressure mode) white-labeled inside the org.
3. **Assesses** with a 12-type assessment engine (MCQ→pair-programming) on EYF's proven judged-code infrastructure, with proctoring and plagiarism defense.
4. **Certifies** with publicly verifiable, revocable, skill-anchored certificates (the existing `/verify` trust rail).
5. **Measures** with skill matrices and learning analytics tied to business outcomes (time-to-productive, bench readiness, attrition risk) — not completion vanity metrics.
6. **Hires** directly from the EYF Elite talent pool using full evidence profiles (Readiness Index, Skill Graph, coding history, mock performance, projects, certificates) — and pays for internship slots with training seats (the supply flywheel).

**Why now:** Indian colleges pay ₹5–15L/yr for placement AI; companies pay ₹1,500–4,000/user/yr for LMS + separately for HackerRank (₹5L+/yr) + Zoom + tooling. EYF collapses 6 line items into one and adds the thing none of them have: the talent pipeline.

**Business ask:** 3 quarters, ~3 squads. Target: 20 paying orgs + 5 colleges in year 1 → ₹4–6 Cr ARR from this module alone, plus the B2C flywheel effect (internships → Elite conversions).

---

## 2. Vision

**Every engineering career in India runs on one operating system — and every company that hires engineers runs its people development on the same one.** The skill passport a student earns at 19 is the same living document their employer reads at 25 and their next employer trusts at 30.

## 3. Mission

Replace completion-theater with capability-evidence: give companies a single platform to onboard, train, assess, certify, staff, and hire engineers — measured by what people can *do*, proven by what they have *done*.

## 4. Business Goals

| # | Goal | Metric | 12-mo target |
|---|------|--------|--------------|
| G1 | Enterprise revenue | ARR from org plans | ₹4–6 Cr |
| G2 | Flywheel supply | Internship + job slots posted by orgs | 500 slots |
| G3 | Flywheel demand | Elite conversions attributed to slots | 3,000 |
| G4 | Consolidation proof | Avg tools replaced per org (self-reported) | ≥4 |
| G5 | Time-to-value | Org signup → first cohort live | < 7 days |
| G6 | Outcome proof | Median "time-to-productive" reduction for onboarding cohorts | −30% |
| G7 | Retention | Net revenue retention (orgs) | >110% |
| G8 | College land | Seat-licensed institutions | 5 (≥8k seats) |

## 5. Problems Being Solved

**Enterprise pains** (from L&D/EM interviews and public complaints about incumbents):
- P1 *Tool sprawl*: learning in one tool, assessment in another, hiring in a third; no shared identity or data. Reporting = Excel exports glued by an analyst.
- P2 *Completion theater*: 87% course-completion, zero idea who can actually ship. No link from learning → capability → staffing.
- P3 *Onboarding chaos*: new engineer's first month is a wiki graveyard + shadowing + vibes. No baseline, no plan, no measurement. Time-to-productive unknown and unmanaged.
- P4 *Assessment distrust*: internal quizzes are toys; external platforms (HackerRank) are expensive, hated by candidates, and disconnected from training.
- P5 *Certificate inflation*: internal certs mean nothing outside; external certs (Udemy) prove watching, not doing.
- P6 *Trainer bottleneck*: senior engineers burn days building slide decks; content dies in folders, never versioned, never reused.
- P7 *Skills blindness*: "Who here can do Kafka?" is answered by asking around. No org skill matrix that updates itself.

**Startup pains:** can't afford an L&D department; one founder-engineer onboards everyone; needs "training in a box" + hire-ready juniors with proof.

**Engineering-onboarding specifics:** environment setup, codebase orientation, secure-coding norms, review culture — all teachable as EYF labs/paths but currently tribal.

**Hiring pains:** resumes lie; interviews are lossy 45-minute samples; campus hiring is spray-and-pray; internal-mobility decisions have no data.

**Training pains:** generic catalogs (Udemy) have 3% relevance; custom content has 100% cost. Missing middle: adapt-a-template + auto-generate from the org's own stack.

## 6. Market Gaps (first principles)

| Gap | Why incumbents can't close it | EYF's structural answer |
|---|---|---|
| Learning and hiring are separate industries | LMS vendors have no candidate supply; assessment vendors have no learning loop | Same profile powers both; Elite pool is native |
| No evidence layer | They only observe their own content consumption | Skill Ledger ingests *all* activity incl. real coding, judged submissions, mock interviews |
| Onboarding ≠ course list | LMS has no notion of a codebase, a team, a role bar | Role bars (tier profiles) + gap-driven generated plans already exist in EYF (roadmap engine) |
| Assessment divorced from practice | Candidates grind LeetCode, get tested on HackerRank, learn on Udemy — three data silos | One engine: practice, assess, and train on the same judged infrastructure |
| Certificates aren't portable trust | Walled gardens | Public `/verify` rail, skill-anchored, revocable, already shipped |
| India pricing | US-priced per-seat models fail Indian mid-market | INR-native tiers; college seat pricing at ₹1.8–8k/seat/yr |

## 7. Competitive Analysis

| Product | Does well | Misses | EYF beats it by |
|---|---|---|---|
| **Moodle** | Free, infinitely configurable, huge plugin ecosystem | 2005 UX; admin burden measured in FTEs; zero coding/assessment depth; no hiring | Zero-config day-1; capability model; modern UX |
| **Canvas** | Solid academic workflows, gradebook, standards | Enterprise-engineer irrelevance; no code execution; per-seat $$ | Engineer-native content types (labs, judged code) |
| **TalentLMS** | Fast setup, clean SMB UX, gamification | Shallow: no skills model, toy quizzes, no dev tooling, no hiring | Same ease + skill ledger + real assessments |
| **LearnWorlds** | Course-selling polish, interactive video | Creator-economy DNA, not enterprise; no evidence layer | Enterprise RBAC/SSO + evidence |
| **Thinkific** | Creator UX, templates | Same as above; zero engineering features | Engineer-native + hiring |
| **Google Classroom** | Free, dead simple, great for handouts | Not an LMS at all: no paths, skills, certs, analytics | Everything past "handouts" |
| **Coursera Business** | Brand-name catalog, university certs | Generic content; completion metrics; no org-specific skills; no hiring pipe | Org-specific paths + evidence + hire loop |
| **Udemy Business** | Massive catalog, cheap | Quality lottery; watching ≠ doing; zero org intelligence | Doing-based evidence; curated + generated content |
| **Degreed** | Skills taxonomy pioneer, LXP aggregation | Skills are *self-reported/inferred from clicks*, not proven; needs an integration army | Skills are *computed from judged work* — provable |
| **HackerRank** | Credible coding tests, wide language support | Assessment island: no learning loop, candidate-hostile, pricey | Assessment fused with practice+training; candidates arrive already on-platform |
| **CodeSignal** | Calibrated scores (GCA), IDE realism | Same island problem; US pricing | Calibrated + trainable + India-priced |
| **HackTheBox** | Immersive labs, community, gamified depth | Security niche; no enterprise L&D surface | Same lab immersion (Interactive Labs P0) across all CS, plus enterprise surface |

**Category claim:** incumbents sell *content delivery* or *candidate filtering*. EYF sells **capability infrastructure**. When a Degreed asks "what skills do people say they have?", and HackerRank asks "can this stranger pass a test?", EYF answers "here is what this person has verifiably done, here is their gap to your bar, and here is the plan that closes it."

---

## 8. User Personas & Core Workflows

Platform roles (existing): `STUDENT_* / MENTOR / MODERATOR / CONTENT_CREATOR / ADMIN`. This module adds **org-scoped roles** (§9). A user can hold different roles in different orgs (e.g., EYF student + intern at Org A).

| Persona | Org role | Primary goals | Top frustrations today |
|---|---|---|---|
| Company Owner / CEO | ORG_OWNER | Prove L&D ROI; hire faster/cheaper; one invoice | 6 tools, 0 answers |
| HR | ORG_HR | Onboarding compliance, records, attrition signals | Excel trackers, chasing completions |
| Recruiter | ORG_RECRUITER | Qualified pipeline, less screening time | Resume noise; test-tool friction |
| L&D Manager | ORG_LND | Build paths, run cohorts, report outcomes | Authoring pain; no skills data |
| Engineering Manager | ORG_ENG_MANAGER | Team ready for roadmap; who-knows-what | Skills blindness; onboarding drag |
| Instructor | ORG_INSTRUCTOR | Author once, reuse; see who's stuck | Slide graveyards; no telemetry |
| Mentor | ORG_MENTOR | Guide 2–5 mentees efficiently | No context on mentee gaps |
| Reviewer | ORG_REVIEWER | Grade subjective/code work fast & fairly | Email attachments; no rubric tooling |
| Employee | ORG_MEMBER | Grow, get certified, get promoted | Irrelevant catalogs; invisible growth |
| Intern / Fresher | ORG_INTERN | Convert to full-time; know the bar | Vibes-based evaluation |
| Student (B2C) | — | Get hired; carry proof | Effort invisible to employers |
| College TPO | EDU_ADMIN | Placement %, batch visibility, employer relations | Zero live data on students |
| Org Administrator | ORG_ADMIN | Seats, SSO, branding, audit | Admin panels from 2010 |
| EYF Super Admin | ADMIN (platform) | Tenant health, billing, abuse | — |

**Six workflows in detail** (others are compositions of these):

**W1 — Company Owner: zero → live in a week.** Sign up → create org → pick plan → invite ORG_ADMIN → (optional SSO later) → choose "Fresher Onboarding" template path → assign 12 interns → dashboard shows cohort readiness day 1 vs bar → week 4: sees time-to-productive projection and 2 flight-risk flags → quarterly: exports board slide from CEO dashboard.

**W2 — L&D Manager: cohort lifecycle.** Create Learning Path (template or AI-draft from JD) → attach courses/labs/assessments/live classes → set completion rules + certificate → enroll Team or CSV/SCIM group → schedule cohort with calendar events → monitor funnel (started/stuck/done, per-lesson drop-off) → intervene on stuck learners (nudge, assign mentor) → close cohort → outcome report (skill delta, not just completion).

**W3 — Engineering Manager: skills-driven staffing.** Opens Team Skill Matrix → sees Kafka column red → clicks gap → platform proposes: 2 internal candidates 1 course away + 1 Elite external candidate above bar → assigns path to internals, shortlists external → 6 weeks later matrix cell turns green; staffing decision logged.

**W4 — Employee: growth loop.** Day 1: baseline assessment (adaptive) → auto gap plan vs role bar → weekly: lessons + labs + 1 judged exercise; streaks/XP (org-safe) → monthly: skill delta review with mentor → milestone: org certificate → internal mobility: applies to platform team with ledger attached; manager sees evidence, not politics.

**W5 — Recruiter: evidence-based hire.** Define role bar (tier profile or custom) → Talent Pool query: `readiness ≥ 80 for-bar × skills ⊇ {react,node} × grad 2027 × consented` → ranked list with full evidence profiles → shortlist 8 → one-click structured interview loop (EYF interview rooms w/ shared judged editor) → panel scorecards → offer letter issued & tracked in-platform → hired → **same profile becomes their employee profile; onboarding plan auto-generated from their actual gaps.** Zero re-assessment.

**W6 — Intern: internship → conversion.** Accept slot (from flywheel) → org onboarding path → weekly judged deliverables + mentor reviews → conversion review = evidence pack (ledger delta, project reviews, attendance, mock panel) → PPO decision recorded → if converted, role flips INTERN→MEMBER, history intact.

---

## 9. Role & Permission Matrix (RBAC)

Extends the existing capability system (`@eyf/types/permissions`) with **org-scoped capabilities**. Format: `scope:action:resource`. A membership = `(userId, orgId, role[], departmentIds[], teamIds[])`. All org capability checks resolve against membership; ABAC conditions (§25) further scope rows (own-department, own-team, own-mentees).

**Org capabilities:** `org:manage` `org:billing` `org:members` `org:audit` `org:branding` `learn:author` `learn:publish` `learn:enroll` `learn:review` `learn:teach` `assess:author` `assess:administer` `assess:grade` `assess:view-results` `hire:pipeline` `hire:offer` `talent:search` `people:skills-read` `people:skills-read-all` `mentor:mentees` `reports:team` `reports:org`

| Capability → / Role ↓ | OWNER | ADMIN | HR | RECRUITER | LND | ENG_MGR | INSTRUCTOR | MENTOR | REVIEWER | MEMBER | INTERN |
|---|---|---|---|---|---|---|---|---|---|---|---|
| org:manage / billing | ✅ | ✅¹ | — | — | — | — | — | — | — | — | — |
| org:members | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| org:audit / branding | ✅ | ✅ | — | — | — | — | — | — | — | — | — |
| learn:author | ✅ | ✅ | — | — | ✅ | — | ✅ | — | — | — | — |
| learn:publish | ✅ | ✅ | — | — | ✅ | — | ⛔² | — | — | — | — |
| learn:enroll (others) | ✅ | ✅ | ✅ | — | ✅ | ✅³ | — | — | — | — | — |
| learn:teach (live) | — | — | — | — | ✅ | — | ✅ | ✅ | — | — | — |
| assess:author | ✅ | ✅ | — | — | ✅ | — | ✅ | — | — | — | — |
| assess:administer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅³ | — | — | — | — | — |
| assess:grade | — | — | — | — | ✅ | — | ✅ | — | ✅ | — | — |
| assess:view-results | ✅ | ✅ | ✅ | ✅⁴ | ✅ | ✅³ | ✅⁵ | ✅⁶ | ✅⁵ | own | own |
| people:skills-read | — | — | ✅ | — | ✅ | ✅³ | — | ✅⁶ | — | own | own |
| people:skills-read-all | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — | — |
| talent:search / hire:pipeline | ✅ | ✅ | ✅ | ✅ | — | ✅³ | — | — | — | — | — |
| hire:offer | ✅ | ✅ | ✅ | ⛔⁷ | — | — | — | — | — | — | — |
| reports:team | ✅ | ✅ | ✅ | — | ✅ | ✅³ | ✅⁵ | ✅⁶ | — | — | — |
| reports:org | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | — | — |

¹ billing view-only unless granted. ² instructor drafts, LND/ADMIN publishes (two-person rule). ³ own department/teams only (ABAC). ⁴ hiring assessments only. ⁵ own courses/cohorts. ⁶ own mentees. ⁷ recruiter drafts offers; OWNER/ADMIN/HR approve.

**Approval hierarchies** (explicit, auditable): course publish (author→publisher), certificate issue (auto-on-criteria OR reviewer sign-off), offer (draft→approve→send), org role grants ≥ADMIN (OWNER only), seat purchases (OWNER/billing).

---

## 10. Information Architecture

```
eyf.in
├── (student app — existing, unchanged)
├── /score/:code, /verify/:code            # public trust rails (existing)
├── /work                                   # NEW: member-facing org space (employee/intern)
│   ├── /work/home            # my day: assigned paths, due items, live classes, streak
│   ├── /work/paths           # my learning paths → /work/paths/:id (player)
│   ├── /work/courses/:id     # course player (lesson types incl. labs, judged code)
│   ├── /work/assessments     # upcoming/past → /work/assessments/:id/take (secure runner)
│   ├── /work/projects        # assigned projects, deliverables, reviews
│   ├── /work/skills          # my ledger: skill graph vs role bar, history
│   ├── /work/certificates    # earned; share/verify links
│   ├── /work/calendar        # classes, office hours, deadlines (ics feed)
│   ├── /work/mentor          # my mentor, sessions, notes
│   ├── /work/forum           # org-private spaces + announcements
│   └── /work/messages        # DMs / cohort channels
└── /org                                    # org console (role-gated per §9)
    ├── /org/home             # role-aware overview (owner sees ROI; LND sees cohorts…)
    ├── /org/people
    │   ├── /members  /invites  /departments  /teams
    │   └── /members/:id       # profile = skill ledger + activity + certs + notes
    ├── /org/skills
    │   ├── /matrix            # dept × skill heat grid, drill-in
    │   ├── /bars              # role bar editor (tier templates + custom)
    │   └── /gaps              # org-wide gap report → propose training/hiring
    ├── /org/learn
    │   ├── /library           # courses/labs/question-banks; filters; templates
    │   ├── /builder/:id       # course builder (§16)
    │   ├── /paths  /paths/:id # path composer
    │   ├── /cohorts /cohorts/:id  # enrollment, schedule, funnel, interventions
    │   └── /live              # class scheduling, rooms, recordings, attendance
    ├── /org/assess
    │   ├── /banks  /banks/:id # question banks (12 types), import, difficulty audit
    │   ├── /blueprints        # assessment composition rules
    │   ├── /runs /runs/:id    # administer: windows, proctoring level, results, flags
    │   └── /grading           # reviewer queue (rubrics, anonymized)
    ├── /org/certify
    │   ├── /templates         # design + criteria (skill-anchored)
    │   └── /issued            # registry, revoke, verify stats
    ├── /org/projects          # project templates, assignments, review queues
    ├── /org/mentorship        # mentor roster, matching, load, session logs
    ├── /org/hire
    │   ├── /talent            # Elite pool search (consented) + internal mobility
    │   ├── /jobs /internships # postings (flow back to B2C boards)
    │   ├── /pipeline          # kanban per req; scorecards; comparisons
    │   ├── /interviews        # loops, scheduling, rooms, panel scorecards
    │   └── /offers            # drafts, approvals, letters, acceptance tracking
    ├── /org/analytics         # role dashboards (§19) + report builder + exports
    ├── /org/announce          # announcements, targeting, read receipts
    └── /org/settings
        ├── /general /branding # name, logo, colors, custom domain (white-label)
        ├── /sso /scim         # SAML/OIDC, provisioning
        ├── /roles             # role grants, custom roles (Enterprise)
        ├── /api               # API keys, webhooks, event log
        ├── /billing           # plan, seats, invoices, usage
        └── /audit             # immutable log, filters, export
```

Navigation: `/work` uses the student app shell (sidebar + mobile tab bar) with an **org switcher** in the account footer; `/org` uses the admin-style chrome (top nav) with capability-filtered sections (same pattern as the existing admin portal). Global ⌘K spans both.

---

## 11. Complete User Flows (canonical numbered flows)

**F1 Org creation:** owner signs up → `POST /orgs` → plan select (trial default) → org switcher appears → guided checklist (invite admin, pick template path, connect Slack/SSO [skippable], enroll first cohort) → "time-to-first-cohort" tracked as activation metric.

**F2 Member invite/provision:** HR uploads CSV or SCIM push or invite link w/ domain allowlist → member accepts → account created-or-linked (existing EYF users LINK; passport consent prompt §21) → lands in /work/home with assigned baseline.

**F3 Course creation:** instructor drafts in builder (blocks §16) → attach skill tags + weights per lesson → preview as learner → submit for publish → LND reviews diff (v2 vs v1) → publish → available to paths; edits create new version, cohorts pin versions.

**F4 Cohort run:** LND composes path → selects audience (team/dept/CSV) → schedule (start, cadence, live sessions) → auto-calendar + notifications → learners progress; stuck-detector flags >7d inactivity or 2 failed attempts → mentor assigned → completion → certificates auto-issue on criteria → outcome report.

**F5 Assessment run:** author blueprint (e.g., 20% MCQ aptitude, 40% coding-medium, 20% SQL, 20% subjective; difficulty curve; bank randomization) → schedule window + proctoring level → candidates take in secure runner (fullscreen, tab-blur telemetry, webcam snapshots at L2+) → auto-grade objective + judged code; reviewer queue for subjective with anonymized rubric grading → results + integrity report → feeds ledger (internal) or pipeline (hiring).

**F6 Certification:** template (design, skills asserted, criteria: path completion + assessment ≥ bar + reviewer sign-off if configured) → issue → public verify page w/ skill assertions + evidence summary → revocation propagates to verify page instantly.

**F7 Hiring (external):** req → role bar → talent search (consented Elite) → shortlist → structured loop (rooms w/ shared editor + rubric scorecards) → decision matrix (evidence-weighted) → offer draft → approval chain → e-sign → hired → **profile carries into org membership (F2-link path)**.

**F8 Internship flywheel:** org posts slots (seats, stipend=0 allowed, criteria) → EYF allocates visibility to Elite by score (existing exchange) → applications ranked by evidence → intern onboarded via F4 → conversion review pack → PPO or completion certificate; slot metrics feed org's employer-brand page on B2C side.

**F9 Live class:** schedule in /org/learn/live → room (WebRTC SFU; phase 1 embeds provider, phase 2 self-host) → attendance auto (join/leave events) → recording → attached to course as lesson → absent learners auto-assigned recording + quiz.

**F10 Student→Intern→Employee (the spine):** B2C student earns passport → consents to Talent Pool → hired via F7/F8 → org link — ledger continues; role bar switches from "placement" to org role; same ScoreRing, new bar.

## 12. Storyboards (frames)

**S1 Intern "Priya", weeks 0→14:** (1) Offer email → accepts slot on EYF; passport consent. (2) Day 1 /work/home: "Your 30-day plan — built from your gaps vs Backend-Intern bar" (she's 71 vs bar 65 on DSA, 12 vs 60 on org-stack lab). (3) Daily loop: 1 lab + 1 judged exercise; streak intact; mentor pings on day 9 stall. (4) Week 6 checkpoint assessment; proctored; passes 78. (5) Week 10 project: ship a service; reviewer rubric 4/5; AI reviewer pre-comments before human. (6) Week 13: conversion pack auto-compiled; panel mock; (7) PPO → role flips; certificate on her public profile; her college TPO sees the conversion in the college dashboard.

**S2 EM "Rahul" staffing:** matrix red on "Postgres tuning" → 2 internals proposed a 3-week path + 1 Elite external at 84 vs bar → assigns path; opens req for external → hires in 3 weeks with 2 interviews instead of 6 (evidence pre-screens) → board slide auto-notes ₹ saved vs agency.

**S3 Owner "Meera" renewal:** CEO dashboard: time-to-productive 62→41 days, 14 certified, 3 hires from pool (₹0 agency fees), attrition-risk flags actioned 5/6 → clicks renew + 20 seats.

---

## 13. Database Design (ERD)

Conventions: Prisma/Postgres; every org-scoped table carries `orgId` (FK, cascade) with composite indexes `(orgId, …)`; soft-delete via `deletedAt` on people-visible rows; `createdAt/updatedAt` everywhere; all money in paise; all enums explicit. Existing tables reused: `Organization, OrgMember(role→role[]), Course, Lesson, Enrollment, LessonProgress, InternshipSlot, Certificate, User, ScoreShare, Job, JobApplication, McqBankQuestion, AssessmentBankQuestion, CompanySimBlueprint, KnowledgeEntry, AuditLog`.

**New/extended entities (table → key fields → relations/indexes):**

```
Organization (extend)      + slug UNIQUE, logoUrl, brandColor, customDomain UNIQUE NULL,
                             plan OrgPlan, seatsLicensed INT, ssoConfig JSON, settings JSON
OrgMember (extend)         + roles OrgRole[], departmentId FK NULL, title, joinedAt, status
                             @@unique(orgId,userId) @@index(orgId,departmentId)
Department                 id, orgId, name, parentId NULL (tree), headMemberId
Team                       id, orgId, departmentId, name, leadMemberId
TeamMember                 teamId, memberId @@unique(teamId,memberId)

Skill                      id, slug UNIQUE, name, category, parentId NULL   # global taxonomy
OrgSkill                   orgId, skillId, alias NULL, active               # org overlay
RoleBar                    id, orgId, name, basedOnTier NULL                # e.g. "Backend L2"
RoleBarSkill               roleBarId, skillId, requiredLevel 0-100, weight
SkillEvidence              id, userId, orgId NULL, skillId, level 0-100, weight,
                           sourceType ENUM(LESSON,LAB,ASSESSMENT,JUDGED_CODE,PROJECT_REVIEW,
                           MOCK,CERT,MENTOR_RATING,IMPORT), sourceId, decayHalfLifeDays,
                           createdAt  @@index(userId,skillId) @@index(orgId,skillId)
SkillSnapshot              userId, orgId NULL, skillId, level, computedAt   # materialized ledger
                           @@unique(userId,orgId,skillId)

LearningPath               id, orgId, title, description, targetRoleBarId NULL, published, version
PathItem                   pathId, orderIndex, itemType ENUM(COURSE,ASSESSMENT,PROJECT,
                           LIVE_CLASS,EXTERNAL,CHECKPOINT), itemId, required, unlockRule JSON
Course (extend)            + version INT, status ENUM(DRAFT,IN_REVIEW,PUBLISHED,ARCHIVED),
                           coverUrl, estMinutes, skillTags via CourseSkill(courseId,skillId,weight)
CourseVersion              courseId, version, snapshot JSON, publishedBy, publishedAt
Lesson (extend)            + type ENUM(RICH_TEXT,VIDEO,LAB,JUDGED_CODE,QUIZ_INLINE,EMBED,FILE),
                           blocks JSON (block model §16), estMinutes, skillId NULL
Cohort                     id, orgId, pathId, name, startsAt, endsAt, mentorPolicy JSON
CohortEnrollment           cohortId, memberId, status, progressPct, lastActivityAt, stuckFlag
                           @@unique(cohortId,memberId) @@index(cohortId,stuckFlag)

QuestionBank               id, orgId NULL (NULL=EYF global), name, subject
Question                   id, bankId, type ENUM(MCQ,MSQ,CODING,SQL,SUBJECTIVE,VIDEO,AUDIO,
                           FILE,WHITEBOARD,PAIR,FILL,ORDERING), difficulty, skillId,
                           body JSON, answerKey JSON NULL, rubric JSON NULL, stats JSON
CodingQuestion             questionId 1:1, starterCode JSON, languages TEXT[], timeLimitMs,
                           memoryKb, testcases → Testcase(id, codingQuestionId, input, expected,
                           hidden BOOL, weight)
AssessmentBlueprint        id, orgId, name, sections JSON (type mix, counts, difficulty curve,
                           bankIds, randomize, negativeMarking, adaptive BOOL)
AssessmentRun              id, orgId, blueprintId, purpose ENUM(TRAINING,CERTIFICATION,HIRING),
                           windowStart/End, durationMin, proctorLevel 0-3, settings JSON
AssessmentAttempt          id, runId, userId, startedAt, submittedAt, score, sectionScores JSON,
                           integrityScore 0-100, status  @@index(runId,score)
AttemptItem                attemptId, questionId, answer JSON, autoScore, reviewScore NULL,
                           reviewerId NULL, gradedAt   @@index(attemptId)
ProctorEvent               attemptId, ts, kind ENUM(TAB_BLUR,FULLSCREEN_EXIT,FACE_MISSING,
                           MULTI_FACE,PASTE_BURST,IP_CHANGE,SNAPSHOT), meta JSON
PlagiarismPair             runId, attemptA, attemptB, similarity FLOAT, method, reviewed BOOL

OrgProject                 id, orgId, templateId NULL, title, brief, skillTags, rubric JSON
ProjectAssignment          projectId, memberId/cohortId, dueAt, repoUrl NULL, status
ProjectReview              assignmentId, reviewerId, rubricScores JSON, comments, aiPreReview JSON

MentorAssignment           orgId, mentorMemberId, menteeMemberId, startedAt, endedAt NULL, load
MentorSession              assignmentId, scheduledAt, durationMin, notes, menteeVisible BOOL

LiveClass                  id, orgId, courseId NULL, title, startsAt, durationMin, roomProvider,
                           roomRef, recordingUrl NULL, instructorMemberId
Attendance                 liveClassId, memberId, joinedAt, leftAt, source ENUM(AUTO,MANUAL)

CertificateTemplate        id, orgId, name, design JSON, skills JSON, criteria JSON,
                           requiresSignoff BOOL
(Certificate extend)       + orgId NULL, templateId NULL, revokedAt NULL, revokeReason,
                           evidenceSummary JSON

TalentConsent              userId, scope ENUM(POOL_ANON,POOL_FULL), grantedAt, revokedAt NULL
JobRequisition             id, orgId, title, roleBarId, headcount, status, hiringManagerId
PipelineCandidate          reqId, userId NULL, source ENUM(ELITE_POOL,INTERNAL,APPLY,REFERRAL),
                           stage ENUM(SOURCED,SCREEN,ASSESSMENT,INTERVIEW,DECISION,OFFER,HIRED,
                           REJECTED), evidenceSnapshot JSON, referrerId NULL
InterviewLoop              reqId, candidateId, rounds JSON; InterviewRound(id, loopId, kind,
                           scheduledAt, roomRef, interviewerIds, scorecard JSON, decision)
Offer                      id, reqId, candidateId, draft JSON, status ENUM(DRAFT,PENDING_APPROVAL,
                           SENT,ACCEPTED,DECLINED,EXPIRED), approvals JSON, letterUrl
Referral                   orgId, referrerMemberId, candidateEmail, reqId NULL, status, rewardPaise

Announcement               orgId, title, body, audience JSON, publishAt, readReceipts BOOL
AnnouncementRead           announcementId, memberId, readAt
Thread/Message             org-scoped channels + DMs (orgId, channelId, authorId, body, ts)
Notification               userId, orgId NULL, kind, payload JSON, readAt NULL @@index(userId,readAt)
CalendarEvent              orgId NULL, ownerId, kind, refId, startsAt, endsAt, icsUid

ApiKey                     orgId, name, hashedKey, scopes TEXT[], lastUsedAt, revokedAt
WebhookEndpoint            orgId, url, secret, events TEXT[], active, failCount
WebhookDelivery            endpointId, eventId, status, attempts, lastAt
UsageCounter               orgId, metric, period, value   # seats, exec-minutes, storage, AI tokens
Invoice (extend existing billing)  + orgId, lineItems JSON
AnalyticsEvent             (append-only, partitioned by month) orgId NULL, userId, name,
                           props JSON, ts  @@index(orgId,name,ts)
```

**Key constraints:** every `/org` query filters by `orgId` at the repository layer (see §25 tenant isolation); `SkillSnapshot` recomputed async from `SkillEvidence` (BullMQ) with exponential decay; `AssessmentAttempt.integrityScore` derived from `ProctorEvent` weights; `Certificate.revokedAt` checked on every public verify.

---

## 14. API Design

**Conventions (extends existing `/v1`):** envelope `{success, data|error}`; cursor pagination `?cursor&limit≤100` returning `{items, nextCursor}`; filtering via typed query params (no generic query language in v1); sorting `?sort=field:asc`; idempotency on all POSTs that create money/offers/certificates via `Idempotency-Key` header; org context via path `/v1/orgs/:orgId/...` (never inferred from token alone); rate limits per plan + per API key; errors carry stable `code`.

**Auth:** humans = existing JWT/Clerk session + org membership check per request; machines = `Authorization: Bearer eyf_key_…` API keys with scoped permissions (subset of org capabilities); SSO per §24.

**Endpoint catalog (representative, by module):**

```
Orgs/People    POST /orgs · GET/PATCH /orgs/:id · POST /orgs/:id/invites · POST /orgs/:id/members:bulk
               GET /orgs/:id/members?dept&team&role&skill≥ · PATCH /members/:id (roles, dept)
               CRUD /departments /teams · POST /teams/:id/members
Skills         GET /skills (taxonomy) · CRUD /orgs/:id/role-bars · GET /orgs/:id/skills/matrix?by=dept
               GET /members/:id/ledger · GET /orgs/:id/skills/gaps?roleBarId
Learn          CRUD /orgs/:id/courses (+ /versions, POST /:id/publish) · CRUD /paths /paths/:id/items
               CRUD /cohorts · POST /cohorts/:id/enroll · GET /cohorts/:id/funnel
               POST /lessons/:id/progress · POST /labs/:id/submit (judged)
Assess         CRUD /banks /questions (+ POST /questions:import csv/qti) · CRUD /blueprints
               POST /runs · GET /runs/:id/attempts?sort=score · POST /runs/:id/start (candidate)
               POST /attempts/:id/items/:qid/answer · POST /attempts/:id/submit
               GET /attempts/:id/integrity · POST /grading/queue/:itemId (score, rubric)
Certify        CRUD /cert-templates · POST /certificates:issue · POST /certificates/:id/revoke
               GET /verify/:code (public, existing)
Projects       CRUD /org-projects · POST /assignments · POST /assignments/:id/review
Mentorship     CRUD /mentor-assignments · POST /sessions · GET /mentors/:id/load
Live           CRUD /live-classes · POST /live-classes/:id/join → room token · GET /:id/attendance
Hire           GET /orgs/:id/talent/search?roleBarId&minReadiness&skills&gradYear&consent=full
               CRUD /requisitions · PATCH /pipeline/:candidateId/stage · CRUD /interview-loops
               POST /offers · POST /offers/:id/approve|send · POST /referrals
Comms          CRUD /announcements · GET /announcements/:id/reads · channels/messages (WS)
Analytics      GET /orgs/:id/analytics/:dashboard (owner|hr|lnd|eng|instructor) ·
               POST /orgs/:id/reports (async → webhook/export) · GET /usage
Admin          CRUD /api-keys · CRUD /webhooks · GET /audit?actor&action&from&to (export)
```

**Webhooks (HMAC-signed, retried w/ backoff, event log UI):** `member.joined|left`, `cohort.completed`, `enrollment.stuck`, `assessment.submitted`, `assessment.flagged`, `certificate.issued|revoked`, `skill.threshold_crossed`, `pipeline.stage_changed`, `offer.accepted`, `invoice.paid`, `usage.limit_approaching`.

**Realtime:** WS channels (Phase 2; long-poll fallback like peer-signaling today) for: assessment runner (timer sync, incident push), live-class presence/attendance, grading queue updates, pipeline board, messaging. SSE acceptable for dashboards.

---

## 15. Feature Specifications (per-feature PRDs, MoSCoW)

Each block: **Purpose → Must (M) / Should (S) / Later (L) → Acceptance highlights.** Skill-tagging is mandatory on every content type — untagged content cannot publish (this is what keeps the ledger honest).

**15.1 Org Dashboard (role-aware home).** One page per role answering their one question. Owner: ROI strip (time-to-productive, certs, hires-from-pool, ₹ saved), renewal health. HR: onboarding compliance, overdue, flight-risk flags. LND: cohort funnels, stuck queue. EM: team matrix deltas, staffing suggestions. M: role detection, drill-through everywhere, 7/30/90 ranges. S: scheduled email digest. L: custom widgets. *Accept:* every number clicks through to the people behind it.

**15.2 Course Builder** → §16. **15.3 Course Player.** M: block rendering, resume position, progress per block-completion rules (video ≥90%, lab passed, quiz ≥bar), offline-tolerant progress writes (queue+retry), keyboard nav, mobile parity via existing tab-bar shell. S: notes/highlights per lesson. L: downloadable packs.

**15.4 Module/Lesson Builder.** Folded into §16 block model (a module = section of blocks; a lesson = ordered blocks).

**15.5 Assignments (non-code).** M: brief, attachments, due dates, rubric attach, submission types (file/link/text), late policy, reviewer routing. S: peer review mode. *Accept:* reviewer never sees learner identity when anonymized grading is on.

**15.6 Coding Assignments** → §18. **15.7 Quiz Engine (inline).** Subset of §17 embedded in lessons: MCQ/MSQ/fill/ordering, instant feedback mode vs graded mode, question pools with randomization.

**15.8 Assessment Engine** → §17. **15.9 Certificate Engine.** M: template designer (brand, layout presets), criteria compiler (path AND/OR assessment AND/OR signoff), auto-issue, public verify with skill assertions + evidence summary, revocation with reason (propagates ≤1 min). S: LinkedIn share card (reuse OG generator), expiry+renewal. L: Open Badges 3.0 export. *Accept:* forged/revoked cert URL shows red state.

**15.10 Attendance.** M: auto from live-class join/leave, manual override w/ audit, per-cohort report, absence → auto-assign recording+quiz. **15.11 Progress Tracking.** M: per-lesson/course/path %; stuck detector (7-day inactivity OR 2 consecutive failed attempts) feeding intervention queue; SLA timers on interventions.

**15.12 Learning Paths.** M: ordered items with unlock rules (sequential, date, score-gated checkpoints), required vs elective, target role bar, forecast (est. hours vs learner pace → projected completion). S: A/B path variants per cohort. *Accept:* removing an item from a live path never corrupts learner state (versioned pin).

**15.13 Skill Matrix.** The centerpiece. M: dept×skill and team×skill grids from `SkillSnapshot`, color by level-vs-bar, drill to person→evidence list (every cell explains itself), export. S: gap→action proposer (train N internals vs hire; cost/time estimates). L: scenario planning ("if this team ships the Kafka path, matrix in 8 weeks"). *Accept:* every level traces to ≥1 evidence row; no self-reported numbers anywhere.

**15.14 Department/Team/Employee Management.** M: tree depts, teams, bulk ops, CSV+SCIM, offboarding (revoke access, retain records, anonymize option). **15.15 Project Management (learning projects, not Jira).** M: templates w/ rubrics, assignment to person/cohort, deliverable submissions (repo link + artifacts), review queue, AI pre-review (§20). *Non-goal:* general PM — deep-link Jira/Linear instead.

**15.16 Mentor Management.** M: roster, load caps, matching by skill gap overlap, session logs, mentee-visible notes vs private notes. S: auto-match suggestions. **15.17 Forums/Announcements/Messaging/Notifications.** M: org-private forum spaces (reuse forum engine, org-scoped), announcements with audience targeting + read receipts, DM/cohort channels, notification center with per-kind preferences + email fallback; everything mutable only by moderation roles. *Non-goal v1:* Slack replacement — provide Slack/Teams webhook bridge instead.

**15.18 Calendar/Events/Office Hours.** M: org calendar aggregating classes/deadlines/interviews, ics feed per user, office-hours slots (mentor publishes; members book; caps). **15.19 Code Playground.** M: org-scoped scratchpads on the judged runner, shareable snapshots. **15.20 Interview Platform.** M: interview rooms = video + shared judged editor + question panel + private scorecard; structured loops from templates; panel scorecards aggregate to decision matrix. S: recording w/ consent, AI notes.

**15.21 Resume/Certificate Verification.** M: recruiter pastes any EYF profile/cert/score URL → verification status + what's asserted; batch verify CSV for campus drives. **15.22 Coding Sandbox** = existing Judge0 infra hardened (§25): per-org queues (fair share), exec-minute metering.

**15.23 Analytics/Reports** → §19. **15.24 Hiring Pipeline / Internship / Talent Pool / Referrals / Job Posting / Ranking / Scheduling / Offers** → §21.

---

## 16. Course Builder (Notion × Canvas × Thinkific × Figma)

**Model:** a Course is a tree: `Course → Sections → Lessons → Blocks[]`. Block = typed JSON node:
`heading | rich_text | callout | image | video (upload/embed) | code (read-only) | judged_code (starter+tests, runs on Judge0) | lab (Interactive Labs runtime) | quiz (inline pool) | file | embed (figma/miro/yt) | divider | toggle | columns | template_slot`.

**Editing UX.** M: slash-command insert (`/video`, `/judged`), drag-to-reorder with keyboard fallback, inline skill-tagging chips on every lesson (publish-blocking if empty), autosave every 5s + local draft recovery, learner-preview toggle (renders exactly the player), estimated-time auto-calc from blocks. S: side-by-side two-author presence (show avatars + block-level soft locks; full CRDT co-editing is **L** — soft locks cover 95% of org authoring at 5% of the cost). 

**Reusable blocks.** Any section/lesson can be saved to the **org library** as a reusable component with propagate-on-update semantics (consumers pin a version; "update available" badge, one-click adopt). EYF ships a **global template library** (Fresher Onboarding, Backend Bootcamp, Secure Coding, DSA Sprint…) cloneable per org — first-cohort-in-a-day depends on this.

**Versioning & publishing.** Draft → In-review → Published; every publish snapshots `CourseVersion`; visual diff (added/removed/edited blocks) for the reviewer; running cohorts stay pinned to their version; rollback = republish old snapshot. Two-person rule (author ≠ publisher) enforced when org setting on.

**Accept:** author builds a 5-lesson course with a judged exercise and inline quiz in <30 min without docs; publish diff correctly shows a single edited block; learner progress unaffected by post-pin edits.

## 17. Assessment Engine

**Item types (12):** MCQ, MSQ, fill-in, ordering, SQL (judged against seeded schema — runs as a Judge0 language with result-set comparison), Coding (§18), Subjective (rubric-graded), Video response (record, S3/R2, reviewer or AI-transcript-assisted), Audio, File upload, Whiteboard (canvas snapshots on the existing excalidraw-style surface), Pair programming (two candidates or candidate+interviewer in one shared judged editor; keystroke attribution logged).

**Composition.** Blueprints define sections: `{type mix, count, bankIds, difficulty curve (e.g., 20/50/30 E/M/H), randomization (per-candidate draw from pools), negative marking per section, adaptive flag}`. Adaptive mode reuses the shipped adaptive-diagnostic ladder (level ± on correct/wrong, converging on boundary) generalized to any bank. Difficulty balancing: per-question empirical stats (p-value, discrimination from attempt history) recalibrate authored difficulty; flag miscalibrated items to authors.

**Delivery/runner.** Fullscreen-required mode, per-section timers with server-authoritative clock, autosave every answer, connection-loss grace (rejoin within N min), question flagging/review screen, accessibility (keyboard-complete, screen-reader labels, extra-time accommodations per candidate).

**Proctoring levels (org chooses per run; candidates see exactly what's collected):**
- **L0 honor:** nothing collected.
- **L1 telemetry:** tab-blur/fullscreen-exit/paste-burst/IP-change events (extends existing cognitive anti-cheat).
- **L2 snapshot:** L1 + webcam stills at random intervals + ID capture at start.
- **L3 continuous:** L2 + face-presence/multi-face detection on-device. (No keystroke biometrics, no screen recording — privacy stance is a feature.)
Integrity score 0–100 from weighted events; **humans decide, the score only ranks review order** — hard rule.

**Question banks:** org-private + EYF-global (the 4 shipped banks seed it); CSV/QTI import; per-item analytics; leak rotation (retire items with anomalous p-value drift).

## 18. Coding Assessments (reuse EYF engine)

**Authoring:** problem statement (markdown), starter code per language, visible + hidden testcases with weights, custom checker option (for multiple-valid-answer problems), time/memory limits per language, languages allowlist (existing Judge0 set), private author notes + editorial. Bulk import from EYF problem library (2k+) with one click — orgs start with a real bank on day 1.

**Execution:** existing BullMQ→Judge0 pipeline with per-org fair-share queues, per-run concurrency caps, exec-minute metering to `UsageCounter`.

**Candidate experience:** Monaco (self-hosted at deploy per QA note), run-visible-tests loop, submit-hidden-tests, per-test verdicts (hidden tests show pass/fail only), submission history with diffs.

**Leaderboards:** per-run (score, then time, then submissions); hidden during window, revealed after; anonymized option for hiring runs.

**Anti-cheat/plagiarism:** L1 telemetry always on for coding runs; paste-burst heuristics (≥N chars in <1s from blur); similarity = token-stream + AST-shape comparison across all pairs in a run (winnowing/fingerprint), cross-run fingerprint bank for question leaks; AI-likelihood is **advisory-only** (never auto-fail — false-positive harm > benefit); every flag routes to human review queue with side-by-side diff. **Accept:** two submissions sharing 80% token fingerprint flag at >0.9 similarity; renamed-variables copy still flags via AST shape.

## 19. Analytics

**Event spine:** append-only `AnalyticsEvent` (partitioned monthly) + nightly rollups (BullMQ) into per-org aggregates; PostHog remains for product analytics — org analytics are first-party (data residency + no per-seat vendor cost).

**Dashboards (per role, each ≤6 KPIs + 2 visuals):**
- **CEO/Owner:** time-to-productive trend, certified count, internal-mobility fills, hires-from-pool + agency-₹-avoided, seat utilization, renewal-health composite.
- **HR:** onboarding compliance %, overdue by dept (heatmap), attrition-risk flags (signal: engagement slope + skill stagnation; advisory), cert registry.
- **Engineering (EM):** team skill matrix delta 90d, bench readiness vs next-quarter needs, review-quality distribution, top gaps.
- **L&D:** cohort funnel (enrolled→started→50%→done), per-lesson drop-off waterfall (find the killer lesson), content ROI (skill-delta per authored hour), stuck-queue SLA.
- **Instructor:** per-lesson completion+time+quiz-miss distribution, question-level distractor analysis, live-class attendance.
- **Mentor:** mentee gap closure rate, session cadence adherence.
- **Employee (self):** ledger history, percentile vs role bar (private), certificates, streak.
**Learning analytics:** completion, time-on-task, attempt curves, retention curves (30/60/90-day skill decay via evidence half-life), drop-off cohortized by source. **ROI model:** explicit formula configurable per org: `(baseline TTP − current TTP) × daily-cost × hires + agency-fee-avoided + attrition-save-estimate − platform cost`; always shown with assumptions editable — credibility over magic.

## 20. AI Features (3-year horizon, shipped on the existing fallback-safe pattern)

All AI follows the house rule proven in guidance/Ask EYF: **deterministic core, LLM enrichment, hard fallback, human final say.** Per-org AI budget metering; org content never trains shared models; every AI output labeled + editable.

| Feature | v1 (now) | v2 (12 mo) | v3 (36 mo) |
|---|---|---|---|
| **AI Tutor** | Ask-EYF scoped to course context (lesson + org KB as grounding); "explain this failing test" | Socratic mode on judged exercises (never reveals answer; hint ladder) | Voice tutor in labs; per-learner misconception model |
| **AI Reviewer** | Pre-review on project/code submissions: rubric-aligned comments queued for human reviewer | Confidence-gated auto-approve of trivially-passing rubric lines | Style-learned per-org review voice |
| **AI Assignment Generator** | From skill + difficulty: brief+rubric draft | From org repo README/stack profile: contextual assignments | Auto-refresh variants per cohort (leak-proofing) |
| **AI Quiz Generator** | From lesson blocks → MCQ/MSQ drafts w/ distractor rationale (author approves) | Difficulty-calibrated against bank stats | Continuous item generation to retire leaked items |
| **AI Course Builder** | JD/skill-list → path skeleton + lesson outlines from template library | Draft full lessons grounded in org KB + EYF content | Self-maintaining courses (flag stale content vs stack changes) |
| **AI Mentor** | Weekly nudge digest per mentee (gaps, stalls) for the human mentor | Prep-pack before each session | Off-hours mentee Q&A with mentor-reviewed memory |
| **AI Resume Reviewer** | Existing ATS + gap-to-target, org-branded for candidates | JD-conditioned rewrite suggestions | Auto-updating resume from ledger ("resume as build artifact") |
| **AI Skill Gap Analyzer** | Deterministic (bars − snapshot) + LLM narrative | Team-level scenario narratives | Market-aware: gap vs industry demand curves |
| **AI Career Coach** | Existing strategist, org-aware (internal mobility options) | Promotion-readiness briefs | Longitudinal 3-year plan with quarterly replans |
| **AI Learning Planner** | Existing roadmap engine generalized to org role bars | Calendar-aware pacing (meeting load) | Forgetting-curve-optimized review scheduling |
| **AI Project Reviewer** | Repo-link static review vs rubric (lint+LLM) | Architecture-level feedback w/ diagrams | Simulated-user acceptance runs in sandbox |

**Guardrails:** AI never issues certificates, never fails a candidate, never writes to the ledger directly — it drafts; humans/deterministic criteria commit.

## 21. Hiring Integration (the differentiator)

**Consent first.** Students opt in: `POOL_ANON` (searchable, anonymized until interview accept) or `POOL_FULL`; revocable any time; consent state visible on their profile; orgs see only consented profiles. This is non-negotiable and a trust asset.

**Evidence Profile (what a recruiter sees):** Readiness Index (goal-adaptive, vs *their* role bar — recomputed live), Skill Graph radar, per-company/role-bar readiness %, verified certificates, project portfolio w/ review scores, coding history stats (solved, acceptance, patterns, pressure-mode performance), mock-interview rubric trend, assessment results (EYF-global + this-org's runs), consistency/behavior signals (streaks, integrity scores — never raw proctor footage), achievements. Every number links to its evidence. **Resume becomes the appendix, not the document.**

**Pipeline:** Requisition → role bar → sources (Elite pool search / internal mobility / direct apply / referral) → stages SOURCED→SCREEN→ASSESSMENT→INTERVIEW→DECISION→OFFER→HIRED with per-stage SLAs, kanban + bulk actions. **Ranking:** transparent weighted score = `w1·barFit + w2·assessment + w3·projectReviews + w4·mockTrend + w5·integrity` — weights visible and editable per req; no black-box ranking (explainability is the selling point vs "AI ranking" vendors). **Interview scheduling:** panel availability windows → candidate self-books → rooms (§15.20) → scorecards → decision matrix meeting view. **Offers:** draft → approval chain (§9) → templated letter (PDF, existing renderer) → e-accept in-platform → auto-provision org membership on join date (F10 spine). **Internship Portal:** existing exchange + slots become the top of this same pipeline; PPO conversion = stage transition, metrics feed both org analytics and the student-side employer page. **Referrals:** members refer by email/profile; tracked to hire; reward ledger for payroll export.

**Elite economics:** posting internship slots earns **hiring credits** (the train-for-talent barter, existing flywheel); direct Elite-pool hires above N/quarter move the org to the Hiring add-on tier (§23) — supply is paid for either in slots or in cash.

## 22. Gamification (org-safe)

Reuses the shipped XP/badge/streak/leaderboard engine with an **org overlay and consent-safe defaults**: no public shaming — leaderboards are **opt-in per member** and team-aggregate by default (individual boards allowed only in cohorts that opt in, e.g., intern batches). XP: org XP separate from personal XP (ledger shared, points separate). Badges: org-issuable custom badges (design + criteria, e.g., "Shipped First Service"). Streaks: workday-aware (weekends/holidays don't break; org holiday calendar). **Challenges:** time-boxed team quests ("Team ships the Kafka path by Aug 15") with team-level rewards. **Seasons:** quarterly Season Pass for intern/fresher cohorts — milestone track (labs, certs, mock scores) with cosmetic + real rewards (mentor lunch, conference ticket — org-configured). **Events:** org hackathons/code-sprints on the assessment engine with leaderboards + auto-certificates. **Achievements** map 1:1 to evidence milestones so the fun layer and the ledger never diverge.

---

## 23. Subscription Model

**B2C tiers (existing, unchanged):** Free / Basic / Pro / Elite — Elite remains the Talent-Pool + internship-eligibility tier (demand side of the flywheel).

**Org tiers (new):**

| | **Team** ₹399/user/mo | **Business** ₹799/user/mo | **Enterprise** custom (₹15L+ /yr floor) | **Education** ₹1.8k–8k/seat/yr |
|---|---|---|---|---|
| Min seats | 10 | 25 | 100 | 500 |
| Learn (builder, paths, cohorts, player) | ✅ | ✅ | ✅ | ✅ |
| Global template + content library | ✅ | ✅ | ✅ | ✅ (college pack) |
| Assessments | L0–L1, 50 attempts/user/yr | L0–L2, 200 | L0–L3, custom | L0–L1 |
| Judged exec minutes /user/mo | 100 | 300 | custom | 60 |
| AI credits /user/mo | 20 | 100 | custom pool | 20 |
| Skill matrix + role bars | team-level | full org | full + scenario planning | batch-level |
| Live classes | 25 seats/room | 100 | custom + recording retention | 100 |
| Certificates | 5 templates | unlimited | unlimited + white-label verify | unlimited |
| Talent Pool search | — | view-only | full + pipeline + offers | placement dashboards |
| Hiring add-on | — | ₹25k/hire or slot-credits | included to N hires | — |
| SSO/SCIM | — | SSO | SSO+SCIM+audit export | SSO |
| Branding | logo | logo+colors | white-label + custom domain | co-brand |
| API/webhooks | — | read API | full API + webhooks | read API |
| Support | community | priority | CSM + SLA 99.9% | onboarding pack |

Usage metering (`UsageCounter`): seats, exec-minutes, AI credits, storage, proctored attempts; soft-limit warnings at 80%, hard behavior = graceful queue-down never data loss. Slot-credits: 1 internship slot posted & filled = credits against Hiring add-on (the barter, priced so slots are the cheaper path — supply is the point).

## 24. Enterprise Features

- **SSO:** SAML 2.0 + OIDC (Clerk enterprise connections; org-scoped IdP config; JIT provisioning with default role mapping). **LDAP** via SCIM bridge guidance (no direct LDAP bind in v1 — SCIM is the modern path; documented stance).
- **SCIM 2.0:** users + groups→departments/teams sync; deprovision = offboard flow (access revoked ≤5 min, records retained per policy).
- **Audit log:** extends existing `AuditLog` — every org mutation (who/what/before/after/IP) immutable, 2-yr retention, filter/export UI + API; auth events included.
- **Organizations/Departments/Teams:** §13 tree; org switcher; cross-org isolation absolute.
- **Branding/White-label:** logo/colors on Team+; Enterprise: custom domain (learn.acme.com — CNAME + automated TLS), branded emails, branded certificate verify pages, "powered by EYF" removable.
- **Billing/Invoices:** Razorpay subscriptions per org + usage line items; GST invoices (existing billing rails extended with orgId); PO/NET-30 flow for Enterprise (manual invoice mode).
- **API keys:** org-scoped, capability-subset scopes, hashed at rest, last-used tracking, rotation UI. **Webhooks:** §14 catalog, HMAC signatures, redelivery UI.

## 25. Security

- **Tenant isolation (the big one):** single-DB, orgId-scoped. Enforcement is *layered*: (1) repository layer — all org-scoped Prisma access goes through `orgScoped(orgId)` helpers that inject the filter (code review rule: no raw `prisma.x` on org tables outside the helper); (2) Postgres **Row-Level Security** as backstop — session sets `app.org_id`, RLS policies on every org table (defense against a missed filter); (3) integration tests that attempt cross-tenant reads on every endpoint (CI-blocking). Enterprise single-tenant DB = deployment option, not code fork.
- **RBAC + ABAC:** capabilities (§9) + attribute conditions (own-dept, own-team, own-mentees, consented-only) evaluated in one policy function (`can(member, capability, resource)`) — single choke point, unit-tested truth table.
- **Encryption:** TLS everywhere; at-rest via managed PG + R2 encryption; secrets in platform env (never DB); webhook secrets + API keys hashed (argon2); proctor snapshots encrypted per-org key, auto-purge after retention window (default 90d).
- **Sandbox:** Judge0 isolated boxes, no network egress, per-run cgroup CPU/mem caps, per-org queues; SQL judging on throwaway schemas in an isolated PG instance.
- **Privacy/GDPR/DPDP:** consent registry (TalentConsent + proctoring consent per run), DSR endpoints (export/delete with org-record carve-outs documented), data-residency: primary region India, EU option on Enterprise; processor list published.
- **SOC 2 readiness path:** audit log ✅, RBAC ✅, change management (PR + review + CI gates) ✅, incident runbook, access reviews quarterly, vendor list, backup/restore drills — target Type I by GA+2 quarters, Type II GA+4.
- **Rate limiting:** existing per-plan limiter extended per-org + per-key; assessment endpoints get burst allowances during windows.
- **Abuse:** existing content-protection posture (watermark, session caps) applies inside orgs; proctor media access is dual-control (two staff roles) and fully audited.

## 26. Deployment Architecture

Evolution of the current stack — no rewrite:

```
CDN/Edge:   Vercel (web) + Cloudflare (custom domains, R2 CDN)
Web:        Next.js app (student + /work + /org consoles)
API:        Fastify (Railway → containerized on AWS/GCP at Phase 3) — same codebase,
            org routes are modules; extract "exec" and "media" workers first if load demands
Workers:    BullMQ fleet: judge, cron, ledger-rollup, analytics-rollup, webhook-delivery,
            report-export, proctor-media
DB:         Postgres 16 (managed) — partitioned AnalyticsEvent + ProctorEvent;
            read replica at Phase 3; RLS on
Cache/Q:    Redis (queues, presence, rate limits, guidance cache)
Exec:       Judge0 pool on dedicated hosts, autoscaled by queue depth
Storage:    R2 (course media, submissions, proctor snapshots [separate encrypted bucket],
            certificates, exports)
Realtime:   WS gateway (Phase 2; long-poll fallback pattern already proven)
Live video: Phase 1 provider embed (100ms/Daily rooms per class); Phase 3 evaluate SFU self-host
Search:     PG FTS (proven in Ask EYF) → Meilisearch at Phase 3 for library/talent search
Observab.:  Sentry (web+api) + OpenTelemetry traces + Grafana/Prom (or provider equiv) +
            uptime probes on /verify and assessment runner (the two trust-critical paths)
Analytics:  first-party events in PG partitions; PostHog for product funnels
```

## 27. Scalability (design targets)

| Stage | Users | What changes | What must NOT change |
|---|---|---|---|
| 100 (pilot orgs) | 1–5 orgs | Nothing — current infra carries it | Activation flow quality |
| 1,000 | ~20 orgs | Judge0 pool ×2; rollup workers scheduled off-peak | p95 API <300ms |
| 10,000 | +2 colleges | PG connection pooling (pgbouncer), AnalyticsEvent partitions live, R2 lifecycle rules | Assessment-window burst: pre-warm exec pool per scheduled run (calendar-aware autoscale) |
| 100,000 | college season | API containerized + HPA; read replica for analytics; WS gateway sharded by org; Meilisearch | Tenant isolation guarantees; verify-page uptime |
| 1,000,000 | national scale | Cell-based: shard orgs across DB cells (orgId → cell map at the repo layer — designed in from day 1 via the orgScoped helper); dedicated exec regions; media pipeline offloaded | One codebase; ledger semantics; public verify URLs stable forever |

Assessment bursts are the real scaling event (5k concurrent submitters at a college drive): server-authoritative timers tolerate 30s of queue delay by design; submissions are queued-durable (never lost, verdicts may lag); load-test this scenario as a CI-adjacent quarterly drill.

## 28. Revenue Model (this module as a business)

1. **Enterprise SaaS** — org tiers (§23): the base.
2. **Education SaaS** — college seats + placement dashboards (existing GTM motion).
3. **Hiring SaaS** — add-on per-hire fees + Talent-Pool subscriptions; slot-barter drives supply when cash doesn't.
4. **Certification** — org certs free inside plans; **EYF-verified public certifications** (proctored, standardized) priced per attempt (B2C ₹499–1,999; org bundles) — the "AWS-cert of Indian placement skills" play.
5. **Assessment as a service** — API-only customers (run judged assessments from their ATS) on metered pricing.
6. **Marketplace (Phase 4)** — third-party instructors sell org-ready course packs; EYF takes 20%; quality-gated by evidence outcomes, not star ratings.
7. **Mentorship network** — existing mentor rails sold into orgs (external expert office-hours) with rev-share.
8. **Recruitment intelligence (Phase 4+, consent-gated)** — anonymized market skill-supply reports for employers/colleges; never individual data.

Unit economics sketch (Business tier): ₹799 × 12 = ₹9.6k/user/yr; marginal cost (exec+AI+media+support) modeled < ₹1.4k/user/yr at Stage-3 scale → >85% gross margin; hiring add-on is near-pure margin against slot-barter cost of B2C goodwill.

## 29. Implementation Roadmap

**Phase 0 — Foundations (4 wk):** EPIC-01 Org roles/RBAC+ABAC choke point + org switcher · EPIC-02 orgScoped repo layer + RLS + cross-tenant CI tests · EPIC-03 Departments/Teams + CSV import · EPIC-04 Usage metering + org billing extension. *(Blocks everything.)*

**Phase 1 — Learn MVP (6 wk):** EPIC-05 Course builder v1 (blocks, versions, publish flow) · EPIC-06 Player + progress + stuck detector · EPIC-07 Paths + cohorts + calendar/ics · EPIC-08 Template library (5 flagship templates) · EPIC-09 /work home + notifications. **Gate: first design-partner cohort live.**

**Phase 2 — Assess + Certify (6 wk):** EPIC-10 Banks/blueprints/runner (MCQ/MSQ/coding/SQL/subjective; L0–L1) · EPIC-11 Grading queue + rubrics · EPIC-12 Cert templates/criteria/issue/revoke on /verify · EPIC-13 Skill Ledger v1 (evidence writers from lessons/assessments/judged code; snapshots; member profile) · EPIC-14 Proctoring L2 + integrity review UI + plagiarism pairs. **Gate: an org replaces its HackerRank run.**

**Phase 3 — Matrix + Hire (6 wk):** EPIC-15 Role bars + Skill Matrix + gap proposer · EPIC-16 Talent consent + pool search + evidence profiles · EPIC-17 Requisitions/pipeline/interview rooms/scorecards · EPIC-18 Offers + approvals + F10 profile carry-over · EPIC-19 Analytics dashboards (Owner/HR/LND/EM) + report export. **Gate: first evidence-based hire end-to-end.**

**Phase 4 — Enterprise + Scale (6 wk):** EPIC-20 SSO/SCIM · EPIC-21 White-label + custom domains · EPIC-22 API keys/webhooks/public API · EPIC-23 Live classes (provider embed) + attendance · EPIC-24 AI v1 set (tutor-in-course, quiz gen, course skeleton, AI pre-review) · EPIC-25 Proctoring L3 + SOC2 workstream + burst load drill.

Dependencies: 13→15→16/17; 10→14; 05→07→08; 01/02 before all. Priorities: P0 = EPIC-01..08, 13; P1 = 10..12, 15..19; P2 = rest. Team shape: Squad A platform/tenancy, Squad B learn, Squad C assess/hire; design + PM shared.

## 30. Final Notes — Governance of this Document

- This file (`specs/EYF_Enterprise_Learning_Platform_PRD.md`) is the single source of truth; changes via PR with a `## Changelog` entry.
- Anything ambiguous during build: the tiebreak rule is §0 — *does this strengthen the evidence ledger and the campus→career spine?* If not, cut it.
- Explicit non-goals v1: general project management (bridge to Jira/Linear), Slack replacement (bridge), payroll/HRIS (export), video-conference self-hosting (embed first), keystroke-biometric proctoring (never).
- Open questions tracked at end: pricing elasticity validation (design partners), SFU build-vs-buy at Phase 3, marketplace legal/tax, EU residency demand.

## Changelog
- v1.0 (2026-07-06): Initial canonical version.
