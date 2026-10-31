# ADR 0001 — Proof Loop: capture the skill→outcome graph via a sequenced hybrid

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Founder + full review pipeline (CEO/strategy, engineering, design voices)
- **Supersedes:** —

## Context

EYF's defensible moat is the *verified skill → placement-outcome graph* — only EYF sits on
both the training signal (readiness) and the placement outcome. That outcome data was never
systematically captured. The first design fed a "Proof Loop" from **student self-reported
placements**: capture outcomes, calibrate the readiness score against them, and surface
"students like you got offers at X."

Two independent reviews rejected that design:

1. **Calibration is impossible from positives-only self-report.** A predictor needs the
   *denominator* — students at readiness N who did **not** place. Self-report captures only
   winners, so every rate is biased upward by survivorship. This is a data-collection flaw,
   not a sample-size one.
2. **Predictive placement/salary claims are regulated speech in India** (CCPA 2024 ed-tech
   guidance; Consumer Protection Act) and storing employer/CTC is financial PII under the DPDP
   Act 2023. Backing such claims with unverified self-report is misleading-advertising exposure.

## Decision

Adopt a **sequenced hybrid**:

- **Phase 1 (shipped):** build the *verified* outcome spine. Capture placements atomically on
  pipeline offer-accept (employer-set CTC = verified); allow student self-report but store it
  **unverified**, kept out of every money statistic by a hard trust boundary. Public surfaces
  are strictly **descriptive, past-tense, k-anonymity-floored, packages as bands** — never
  predictive. A canonical `collegeSlug` cohort key prevents fragmentation and singleton
  manufacture. Every readiness snapshot is **versioned** so calibration never crosses
  scoring-algorithm changes.
- **Phase 2 (foundation shipped):** make EYF the **TPO placement system-of-record**. A
  cohort-complete batch roster (including non-placed students) provides the denominator.
  Calibration (`packages/types/calibration.ts`) *refuses* any batch not marked
  `dataComplete`, so a survivorship-biased number cannot be produced. Calibration output is
  **internal-only** (publishing a threshold Goodharts the score).
- **Deferred (needs a design-partner college):** self-serve TPO accounts, roster-upload UX,
  NIRF/NAAC/AICTE exports. Not built speculatively.

## Consequences

- **Positive:** claims are legally defensible and statistically honest; the moat data is
  captured from day one via the verified pipeline; the score becomes calibratable once real
  cohort-complete data exists.
- **Negative / cost:** proof surfaces are sparse until Phase-2 data accumulates; the highest-
  value calibration is gated on landing a design-partner TPO (a go-to-market dependency, not
  an engineering one).
- **Reference:** `docs/PLAN-proof-loop.md` (full plan + review record).
