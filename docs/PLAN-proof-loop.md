<!-- /autoplan plan file -->
# EYF Plan — The Proof Loop (close the skill → outcome graph)

Status: Phase 1 SHIPPED (2026-07-21) · Sequenced Hybrid · Author: Praneeth
Phase 1 delivered: PlacementOutcome spine + migration, collegeSlug cohort key, versioned
snapshot, verified-pipeline capture, self-report + DPDP consent, TPO + student proof
surfaces. ~40 tests. Phase 2 (TPO system-of-record + calibration) is the next project.
Builds on: shipped readiness engine, org-hire pipeline (requisitions/candidates/offers),
placement success fees (C1), TPO college analytics (A1 v1), parent digest (B3),
warm referrals (A2). Grounds in `docs/INNOVATION-ROADMAP.md` +
the `lms-internship-flywheel` design doc (2026-07-20).

## The one-line thesis

EYF measures *readiness* and runs a *hire pipeline*, but it never systematically captures
**what actually happened** (did the student get placed, where, at what package, and did the
readiness score predict it) and feeds that back into the product. That outcome data is,
per both strategy docs, **the one defensible asset no competitor can copy** — only EYF sits
on both the training signal and the placement outcome. Today that asset is leaking on the
floor. This plan builds the spine that captures it and the four surfaces that consume it.

One data spine, four consuming surfaces. Every existing feature gets more valuable; the
moat compounds.

## Why this is the highest-impact move (not just another feature)

- **Retention risk (#3 in flywheel doc):** the ~95% who won't crack the internship top-N
  churn unless the product stands alone. "Students like you at your college reached these
  offers" is believable proof the training works — for everyone, not just the top-N.
- **Score integrity (existential risk #4):** calibrating readiness against real outcomes is
  the only way the score becomes *predictive* rather than a vanity number. The recent
  coverage/Sonar hardening protected the engine; this makes it *honest*.
- **Employer trust (C1 depth):** success fees only scale if employers trust the ranking.
  Outcome-calibrated "hire-fit" is what makes them pay.
- **TPO pitch (A1 v2):** batch *outcome* stats (placed count, median package, top hirers)
  are the actual thing that closes a placement-cell partnership — not readiness alone.

## Scope — what we build

### Spine (net-new)
1. **`PlacementOutcome` capture.** On offer-accept (already hooked for the success-fee
   transaction in `talent.ts`), write an outcome row: company/org, role, package (CTC),
   source (EYF pipeline / referral / self-reported), and a **frozen readiness snapshot** at
   placement time. Add a light "where are you now" self-report so outcomes outside the EYF
   pipeline (most early placements) are still captured — student confirms "joined / got an
   offer" with company + package.
2. **Calibration service (pure + tested).** Correlate the frozen readiness signals with
   outcomes to produce cohort statements: "readiness ≥ N predicts an offer within M weeks at
   P% for students at colleges like yours." Pure function over outcome rows → testable, no
   per-request cost (precomputed/cached).

### Surfaces (consume the spine)
3. **Student "Proof" panel.** "At your college, students who reached your readiness band
   received offers from [companies]; median package ₹X." Anonymized, k-anonymity floor
   (never show a cohort smaller than K to protect individuals). Drives retention + Pro
   conversion.
4. **B1 Path-to-Offer (bundled quick win).** The ranked minimal action set (top 3–5 moves)
   to a target offer, each move's projected readiness delta, backed by the calibration data
   so "do X → students like you reached Y" is evidenced, not hand-wavy. Extends the existing
   `/offer` + readiness-coach surface, not a rebuild.
5. **TPO outcome stats (A1 v2 lite).** Add placement outcomes to the existing admin/colleges
   batch view: placed count, median package, top hiring companies. The pitch data.
6. **Employer hire-fit.** On a requisition candidate, show readiness percentile + the
   outcome-calibrated hire-fit band, so the ranking employers pay for is trustworthy.

## NOT in scope (deferred, with reason)
- Full auto-apply agent (B4) — larger external-surface build; separate plan.
- Vernacular/Bharat (A3) — content effort; sequence after this proves out.
- TPO self-serve accounts — this pass is admin-gated stats; self-serve is A1 v3.
- Any placement *guarantee* or ISA framing — legal knife-edge (India), explicitly shelved.
- Predictive ML model — v1 calibration is transparent cohort statistics, not a black box.

## What already exists (reuse, don't rebuild)
- Offer-accept transaction hook (`apps/api/src/routes/talent.ts`) — extend, don't add a path.
- Readiness engine (`computeUserReadiness`) — snapshot its output; do not recompute.
- Admin/colleges batch analytics (`college-analytics.ts` + view) — add outcome columns.
- Placement-fee service/model — the outcome row and the fee row share the offer event.
- Email/push infra — reuse for the self-report nudge.

## Success signals
- % of accepted offers with a captured outcome row (target > 80%).
- Calibration coverage: cohorts with ≥ K outcomes producing a proof statement.
- Student proof-panel → Pro conversion lift; TPO view → outreach conversion.

## Open questions for review
- K-anonymity floor value (protect individuals vs. show proof early) — propose K = 5.
- Self-report trust: how do we keep self-reported packages honest (verification vs. friction)?
- Package (CTC) sensitivity — show bands (₹6–9L) not exact figures on student-facing surfaces?

---

## Review (auto-decisions logged; independent voices reconciled at the gate)

### Strategy (CEO)
- **Right problem: yes.** Highest completeness-per-rupee: it's mostly *instrumentation of an
  event that already fires* (offer-accept) plus one self-report surface. The moat both
  strategy docs name is exactly this graph. Auto-decide: build (P1 completeness, P2 blast
  radius — the accept hook already exists).
- **CRITICAL — cold-start.** On day one there are ~0 outcomes; calibration has nothing to
  calibrate. The plan must **sequence CAPTURE first**, and every surface must degrade
  gracefully: no cohort data → "we're gathering this"; thin data → platform-wide stat;
  college-level only once the cohort crosses the K floor. Self-report is the bootstrap.
- **CRITICAL — statistical honesty / India placement-claim law.** Small cohorts make
  "students like you got offers at X" noise, and predictive framing ("you will be placed")
  is the regulated placement-guarantee claim. Fix: K-anonymity floor K = 5; show *bands*,
  not point estimates; strictly **descriptive past-tense** framing ("students who reached
  band X *received* offers from…"), never predictive; never attach to an enrollment pitch.
- **6-month regret:** building elaborate calibration before outcome volume exists. Mitigation
  is the sequencing above — cheap capture ships first, surfaces light up as cohorts fill.

### Engineering (grounded in the code)
- **Model shape — no duplication with `PlacementFee`.** `PlacementOutcome` is the canonical
  "a student got placed" record across ALL sources (PIPELINE | REFERRAL | SELF_REPORT), with
  nullable `offerId` (unique when present) and a snapshotted `readinessSnapshot Int` +
  `evidenceSnapshot Json` + `collegeAtPlacement`. `PlacementFee` stays purely the billing row
  (pipeline-only). Pipeline placement → both rows exist, linked by `offerId`, CTC read from
  the offer; self-report → outcome stands alone.
- **Snapshot latency — SOLVED by reuse.** `PipelineCandidate.fitScore` + `evidenceSnapshot`
  are already written at sourcing (`org-hire.ts:152`). The accept hook (`talent.ts:67`, inside
  the existing `tx`) copies them into the outcome — zero new compute in the accept path. Self-
  report snapshots current readiness once, off the hot path (user-initiated).
- **Calibration cost.** Pure aggregator over outcome rows, precomputed on a daily cron and
  cached per (normalized-college, readiness-band). No per-request compute, no N+1.
- **HIGH — college is free-text.** Cohort grouping fragments on "IIT-D" vs "IIT Delhi" (the
  existing TPO analytics already hits this). Needs a normalization step or cohorts splinter
  and every stat is wrong. Shared fix with A1.
- **Tests (highest value):** calibration aggregator (empty cohort, below-K → null, null
  package, band bucketing), k-anonymity gate, path-to-offer ranking; integration: outcome
  written atomically on accept, self-report validation.

### Design
- Proof panel degrades gracefully (gathering → platform-wide → college), never renders a
  cohort < K, shows CTC bands not exact figures. Emotional arc: proof as hope, not pressure.
- Self-report: company + package-band + confirm, one nudge, never nag, explicit consent to
  use the outcome in anonymized cohort stats.
- Path-to-offer: 3–5 concrete moves, each with a projected readiness delta + evidence.

### Cross-phase theme (high-confidence signal)
The **small-cohort / cold-start problem** independently surfaces in strategy (misleading
claims + legal), engineering (below-K handling), and design (graceful degradation). That
convergence is the load-bearing constraint: **sequence capture before surfaces, and gate
every surface on the K-anonymity floor.**

---

## LOCKED DECISION (autoplan gate, 2026-07-21): Sequenced Hybrid

Original student-self-report → calibration plan **rejected** by both independent voices
(survivorship bias makes calibration mathematically impossible from positives-only data;
package/placement claims from unverified self-report are India misleading-ad + DPDP risk).

**Phase 1 (build now — safe, verified, shippable):**
1. `PlacementOutcome` model — canonical placement record, keyed on `userId`, `offerId String? @unique`
   (null for non-pipeline), `source` (PIPELINE|REFERRAL|SELF_REPORT), `status`
   (OFFERED|JOINED|RENEGED), `orgId String?` + `companyName`, `role`, `ctcInr Int?`,
   `verifiedAt DateTime?`, denormalized `readinessOverall Int` + `readinessBand String` +
   `snapshotVersion String` + `snapshot Json`, `collegeSlug String`, `placedAt`.
   PlacementFee stays billing-only; for pipeline rows CTC is read from the Offer, not copied.
2. Canonical **college identity** — `collegeSlug` normalization util (pure, tested); group all
   cohort math on the slug, never raw free-text. Backfill the existing TPO analytics onto it.
3. **Snapshot** computed OUTSIDE the offer-accept tx (reuse `PipelineCandidate.evidenceSnapshot`
   for pipeline; compute once off-hot-path for others), written inside the same `$transaction`
   as the fee. Carries `snapshotVersion` (bump on any `WEIGHTS` change) so calibration never
   compares across algorithm versions.
4. **Descriptive-verified proof only** — service (pure, tested) that emits "verified alumni
   placed at [companies]" with a per-cell k-floor (K=5; suppress any company/cohort below it)
   and CTC **bands**, strictly past-tense. NO statistical/predictive claims, NO path-to-offer
   causal framing (Goodhart + legal). Predictive thresholds stay internal.
5. **DPDP consent** at outcome capture for storing employer/CTC/placement (financial PII).
6. Extend the admin/colleges TPO view with verified placed-count + top hirers (descriptive).

**Split success metrics:** capture-rate (any outcome) vs calibratable-rate (outcome WITH a
same-era versioned snapshot). Backfilled outcomes power descriptive proof, not calibration.

**Phase 2 (the moat, next):** EYF as the TPO placement system-of-record — cohort-complete
verified outcomes (incl. the non-placed denominator) as a byproduct of the cell's NIRF/NAAC
reporting workflow. Only THEN do calibration + statistical proof + employer hire-fit become
defensible. Materialized `CohortCalibration` table refreshed by a scheduled job; t0 capture
(first persisted snapshot) for any time-to-offer claim.

### Build order (Phase 1)
S1 schema+migration → S2 college-slug util (+test) → S3 snapshot version const →
S4 capture hook in talent.ts (+integration test) → S5 descriptive-proof service (+test) →
S6 consent gate → S7 TPO view extension. S1–S5 are the spine; S6–S7 the first surface.
