# EYF Product Roadmap — spec ↔ current state

The canonical feature spec (Practice / Learn / Interview / Career / More + monetization
+ architecture). Status is against what's actually in the repo today.

> [!IMPORTANT]
> **Sibling roadmaps:** [ROADMAP.md](ROADMAP.md) (technical debt/security/perf) ·
> [INNOVATION-ROADMAP.md](INNOVATION-ROADMAP.md) (growth strategy) · active initiatives in
> plan docs like [PLAN-proof-loop.md](PLAN-proof-loop.md).
> **Freshness caveat:** the highest-confidence stale entries have been reconciled (Offer Predictor
> ✅, Proof Loop added). Other ⬜/🟡 marks may still lag the code — treat them as needing
> re-verification before planning. A full per-feature status pass remains pending (KI-3 in
> [KNOWN-ISSUES.md](KNOWN-ISSUES.md)).

**Legend:** ✅ shipped · 🟡 exists, spec-depth pending · ⬜ not built yet
**Note on stack:** the spec names a Supabase/Vite stack; EYF already implements the
equivalents on **Next.js + Fastify + Prisma/Postgres + Turborepo** — no migration needed.
LLM-dependent items (AI mock brain, roast, synthesis) are gated on the Anthropic key
(deferred to launch); everything marked "pure-logic" ships without keys.

## 1 · Practice
| Feature | Status | Gap to spec |
|---|---|---|
| Today | 🟡 | energy-aware scheduling, micro-commitment goal, skill-coverage heatmap, accountability pair |
| Dashboard | 🟡 | company-fit radar, momentum (rate-of-improvement), skill-decay curve, time-ROI, peer benchmarks |
| Readiness | ✅🟡 | **goal-adaptive done**; add funnel simulation, readiness gate, mock funnel runs, "ready by <date>" |
| Skill Graph | 🟡 | D3 prerequisite tree, Bloom's layers, cluster-root detection, velocity pulse, share snapshot |
| Problems | ✅🟡 | **Pattern Mastery + next-rep done**; add approach-first mode, 5-level hint ladder, struggle detection, blind mode |
| Visualizer | 🟡 | step-scrubber, variable lens, custom-input execution, comparison mode, viz→flashcard |
| Cognitive Games | ✅🟡 | **peer percentile done**; add spec games (Pattern Flash, Complexity Blitz, Bug Hunt, Edge-Case Oracle) |
| Pressure Mode | 🟡 | stressor escalation, panic protocol, post-session debrief, pressure percentile |

## 2 · Learn
| Feature | Status | Gap |
|---|---|---|
| Career Tracks | 🟡 | branching milestone map, cohorts, track-switch intelligence, completion certificate |
| Core Subjects | ✅🟡 | **weakness-SRS done**; add concept dependency map, active-recall gate, one-page cram export |
| Assessment | 🟡 | adaptive generation, multi-modal items, national ranking event, employer-shareable |
| MCQ Tests | ✅🟡 | **real-company sims done**; add mistake-pattern analysis, live battle mode, flashcard sync |
| Roadmap | ✅🟡 | **2-col rebuild done**; add branching (aggressive/balanced/MVP), Gantt deps, placement-calendar ingest |

## 3 · Interview
| Feature | Status | Gap |
|---|---|---|
| AI Mocks | ✅🟡 | **composure trend done**; add interviewer personas, real-time code observation, tone analysis (LLM) |
| Communication | 🟡 | think-aloud analysis, STAR builder, debate mode, vocabulary tracker |
| Peer Mocks | 🟡 | competency-matched pairing, role enforcement, evaluation calibration, observer mode |
| Code DNA | 🟡 | personal pattern map, anti-pattern registry, style-consistency score, target-profile compare |
| OA Fingerprint | 🟡 | crowdsourced OA DB, pattern analysis, simulated OA, readiness predictor |
| Interview Experiences | 🟡 | structured submission, offer-letter verification, semantic search, AI synthesis |
| Company Prep | ✅🟡 | **per-company readiness + gap done**; add hiring-funnel viz, salary bands, alumni network |

## 4 · Career
| Feature | Status | Gap |
|---|---|---|
| Resume | ✅🟡 | **gap-to-target done**; add JD-paste ATS analyzer, bullet rewriter (LLM), variants, peer-review queue |
| Projects | 🟡 | idea generator, interview-readiness score, GitHub analysis, project→resume mapper |
| Project Prep | ⬜ | interrogation simulator, question bank by project type, contribution-clarity trainer |
| Internships | ⬜ | fit score, application tracker, stipend benchmarking, cover-letter generator |
| Jobs | 🟡 | daily scraping, readiness gate per job, referral network, JD analyzer |
| Pipeline | 🟡 | kanban, follow-up intelligence, funnel analytics, offer comparison calculator |
| **Offer Predictor** | ✅ | **shipped** — `/offer` page + `offerProbability` (per-company offer probability, pure-logic over the goal-adaptive engine) |
| **Proof Loop** | ✅🟡 | **spine shipped** — verified `PlacementOutcome` capture, TPO batch roster + honest calibration (`docs/PLAN-proof-loop.md`); self-serve TPO product deferred (needs a design-partner college) |
| Mentors | 🟡 | pre-session context pack, session types, recordings, group mentorship, emergency session |

## 5 · More
| Feature | Status | Gap |
|---|---|---|
| Community | 🟡 | topic channels, reputation, expert badges, AMA, college chapters |
| Leaderboard | 🟡 | PRI/college/track/weekly-improvement boards, anti-gaming normalization |
| Wrapped | 🟡 | annual + monthly recap, shareable card |
| Certificates | 🟡 | verifiable URL + QR, LinkedIn add-to-profile, proctored issuance |
| **Roast + Offer** | ⬜ | **viral AI roast + offer blueprint (LLM; needs Anthropic key)** |

## Recommended build order (highest leverage first)
1. **Offer Predictor** — pure-logic, reuses the goal-adaptive engine; a headline "will I get in?" number nobody else has.
2. **Readiness funnel simulation** — resume→OA→tech→HR stage bars; deepens the moat page.
3. **Dashboard intelligence** — company-fit radar + skill-decay + time-ROI (pure-logic).
4. **Problems depth** — 5-level hint ladder + approach-first + blind mode (engagement + anti-copy).
5. **Roast + Offer** — the viral loop (hold for the Anthropic key; deterministic fallback possible).

Everything LLM-gated moves the moment the Anthropic key is set (see GO-LIVE.md).
