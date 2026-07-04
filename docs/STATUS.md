# EYF — Current State Report

_Last updated: 2026-07-04. Branch `main`, all green (typecheck 6/6, 68 tests,
production build 57 pages)._

## 1. What EYF is
Two products in one platform:
- **B2C student app** — the integrated "placement operating system": every student
  screen from first concept to first offer, with an intelligence layer (readiness
  + guidance) as the moat.
- **B2B LMS wedge** — a white-label LMS for companies; in return companies post
  (unpaid, seats-limited) internships that the **top Elite students by EYF score**
  earn. This is the scaling flywheel content-only competitors can't copy.

**Stack:** Turborepo monorepo (`apps/web` Next.js 14, `apps/api` Fastify 5,
`apps/mobile` Expo, `packages/{db,types,ui,config}`), Prisma 5 + Postgres, Clerk
auth, Razorpay, Judge0, Anthropic.

---

## 2. BUILT — Student app
Legend: ✅ built & deep · 🟡 built, more depth possible · 🔒 shell built, core needs a key

### Practice
| Screen | State | Highlights |
|---|---|---|
| Today | ✅ | daily plan, coach, **micro-commitment focus card** |
| Dashboard | ✅ | readiness cockpit, journey, **company-fit radar**, level/XP, streak heatmap |
| Readiness | ✅ | **goal-adaptive score**, **funnel simulation**, **Offer Predictor**, **per-company readiness + gap** |
| Skill Graph | ✅ | dimension radar, **DSA pattern prerequisite tree** (root-cause detection) |
| Problems | ✅ | 2k+ problems, **Pattern Mastery + adaptive next-rep**, **blind mode**; 🔒 run/submit needs Judge0 |
| Visualizer | 🟡 | algorithm animations |
| Cognitive Games | ✅ | 5 games + peer **percentile** + **Complexity Blitz** |
| Pressure Mode | ✅ | timed sim + **resilience debrief** (degradation under pressure) |

### Learn
| Screen | State | Highlights |
|---|---|---|
| Career Tracks | 🟡 | role-specific tracks |
| Core Subjects | ✅ | SM-2 flashcards, **weakness-targeted SRS**, **concept map** (OS/DBMS/CN/OOP) |
| Assessment | ✅ | full assessment + **adaptive diagnostic** (finds mastery boundary) |
| MCQ Tests | ✅ | timed sections + **real-company sims** (TCS NQT/AMCAT/InfyTQ/CoCubes) |
| Roadmap | ✅ | personalized week-by-week, timeline + sticky overview |

### Interview
| Screen | State | Highlights |
|---|---|---|
| AI Mocks | 🔒✅ | flow + **composure trend** built; interviewer brain needs Anthropic |
| Communication | ✅ | HR drills + **STAR story bank** |
| Peer Mocks | 🟡 | matching + session; 🔒 video needs Daily.co |
| Code DNA | ✅ | language/pattern/difficulty mix + **speed-vs-accuracy** read |
| OA Fingerprint | 🟡 | company OA prep |
| Interview Experiences | 🟡 | structured DB; 🔒 AI synthesis needs Anthropic |
| Company Prep | ✅ | per-company readiness + gap + **hiring-process funnel** |

### Career
| Screen | State | Highlights |
|---|---|---|
| Resume | ✅ | ATS score + **gap-to-target** rewrite guidance; 🔒 AI bullet-rewrite needs Anthropic |
| Projects | 🟡 | portfolio |
| Internships | ✅ | listings + **merit exchange** (partner slots, Elite-gated) |
| Jobs | 🟡 | board; 🔒 live scraping pending |
| Pipeline | ✅ | kanban + **conversion funnel analytics** |
| Offer Predictor | ✅ | tier-calibrated offer probability per company |
| Mentors | 🟡 | booking |

### More / platform
- Community 🟡 · Leaderboard ✅ (+ **weekly-improvement**) · Wrapped 🟡 · Certificates ✅ (+ **public verify page**) · Roast 🔒 (needs Anthropic)
- **Design** ✅ — light Apple/Google palette, **glassmorphism**, soft elevation, immersive landing showcasing all pillars
- **Security** ✅ — capability-RBAC admin portal, admin access-gate, content protection, dev-login fail-closed, hardening (see `security-posture`)

---

## 3. BUILT — LMS scaling wedge (complete, end-to-end)
- **Schema** — Organization, Course/Lesson (staff/candidate/both), InternshipSlot
- **API** — org access-code auth, course + internship CRUD, Elite-gated merit feed
- **Employer portal** (`/org`) — companies manage courses + post internship slots
- **Student exchange** (`/internships`) — unpaid, seats-limited, top-Elite-by-score earn them
- Flow verified: company posts slot → Elite students ranked by EYF score compete → top within seats "in contention", others "climb the score"

---

## 4. PLANNED — needs YOUR keys (all pre-wired; see `ACTIVATION.md`)
| Key / service | Unlocks |
|---|---|
| **Anthropic** | AI-mock personas + tone analysis, Roast + Offer, interview-experience synthesis, resume bullet-rewriter, LLM coach note |
| **Razorpay** | student tiers (Core/Pro/Elite/Guarantee) + payments + LMS deal billing |
| **Judge0** | real code execution (submit/run), complexity analyzer, test-gen, OA coding sim |
| **Clerk** | real auth (replaces dev-login); employer portal → Clerk orgs |
| **Scrapers/data** | live jobs, OA fingerprint DB, interview-experiences ingest, placement calendars |
| **Daily.co** | video peer mocks |

## 5. PLANNED — buildable now (pure-logic backlog)
- Cognitive games: Bug Hunt + remaining spec games (Complexity Blitz done)
- Dashboard: skill-decay curve, time-ROI, week-over-week momentum
- LMS depth: enrollment/progress tracking, cohorts, company analytics dashboard, B2B billing UI
- Today: energy-aware scheduling, accountability pairs
- Assessment: national-ranking event · Community: channels/reputation/AMA depth

---

## 6. Repo & quality
- **40 PRs merged this session**, all on `main`, all green.
- Docs: `PRODUCT-ROADMAP.md` (full spec ↔ status), `ACTIVATION.md` (key runbook),
  `GO-LIVE.md` (deploy + security checklist), this `STATUS.md`.
- Certified: typecheck 6/6 · lint clean · 68 tests · production build (57 pages).
- **Note:** Prisma client is gitignored + project uses `db push` (no migration
  files) — after pulling, run `pnpm --filter @eyf/db prisma:generate` + `db push`.

---

## 7. Recommended path forward
1. **Provide the Anthropic + Razorpay keys** → the single biggest leap (AI half +
   monetization light up in one pass). This matters more than any remaining panel.
2. **Deploy** per `GO-LIVE.md` (Clerk keys, prod env, real CORS, admin gate).
3. **Get first users** — the product is complete enough to launch and learn.
4. **Scale via LMS deals** — sign companies for the LMS ↔ internship exchange
   (portal + flywheel already built); upgrade employer auth to Clerk orgs.
5. Optionally, clear the pure-logic backlog (§5) in parallel.

**Bottom line:** the product *and* the scaling engine are built. What stands
between EYF and shipping is keys + deploy + users — not more building.
