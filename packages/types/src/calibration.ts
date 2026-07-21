/**
 * Proof Loop — honest readiness calibration (docs/PLAN-proof-loop.md, Phase 2).
 *
 * The Phase-1 reviewers proved calibration is impossible from self-reported placements:
 * you only capture winners, so every "readiness N → offer at P%" is biased upward. The fix
 * is not statistical, it is a data-collection change — you need the DENOMINATOR: the students
 * at readiness N who did NOT place. A cohort-complete TPO batch roster provides exactly that.
 *
 * This engine encodes the reviewers' constraints as CODE so they cannot be bypassed:
 *  - it refuses to calibrate a batch that isn't marked cohort-complete (no survivorship bias);
 *  - the denominator is the people who were actually in the job market — HIGHER_STUDIES and
 *    OPTED_OUT students are excluded (they weren't seeking placement, so counting them as
 *    "not placed" would understate the rate);
 *  - it only pools members whose snapshot was taken under the SAME algorithm version (bands
 *    computed under different WEIGHTS are not comparable);
 *  - every reported band is k-anonymity floored.
 *
 * Output is INTERNAL-only: publishing an exact "readiness ≥ N → offer" threshold lets students
 * grind to it and Goodharts the score. Callers expose coarse guidance, never these numbers.
 */

/** Where a batch member ended up. The denominator hinges on this being the WHOLE batch. */
export type PlacementStatus = "PLACED" | "SEARCHING" | "NOT_PLACED" | "HIGHER_STUDIES" | "OPTED_OUT";

/** "In the job market" — the honest denominator. Higher-studies / opted-out never sought a job. */
const IN_MARKET: ReadonlySet<PlacementStatus> = new Set(["PLACED", "SEARCHING", "NOT_PLACED"]);

/** k-anonymity floor for a reported band (reuse the placement floor). */
export const CALIBRATION_K = 5;

export type CalibrationMember = {
  /** Frozen readiness band at snapshot time; null for members with no EYF readiness snapshot. */
  readinessBand: string | null;
  /** Algorithm version the band was computed under; null if unknown/legacy. */
  snapshotVersion: string | null;
  status: PlacementStatus;
};

export type BandCalibration = {
  band: string;
  inMarket: number; // denominator: in-market members in this band
  placed: number; // numerator
  placementRate: number; // placed / inMarket, 0..1
};

/**
 * Calibrate ONE batch. Returns null unless the batch is cohort-complete — the guard that makes
 * the denominator real. Only members with a band computed under `version` are counted, and only
 * bands whose in-market denominator clears CALIBRATION_K are reported.
 */
export function calibrateBatch(
  members: readonly CalibrationMember[],
  opts: { version: string; dataComplete: boolean },
): BandCalibration[] | null {
  if (!opts.dataComplete) return null; // no calibration on incomplete batches — kills survivorship bias

  const byBand = new Map<string, { inMarket: number; placed: number }>();
  for (const m of members) {
    if (m.readinessBand == null || m.snapshotVersion !== opts.version) continue; // version-consistent only
    if (!IN_MARKET.has(m.status)) continue; // exclude higher-studies / opted-out from the denominator
    const cell = byBand.get(m.readinessBand) ?? { inMarket: 0, placed: 0 };
    cell.inMarket += 1;
    if (m.status === "PLACED") cell.placed += 1;
    byBand.set(m.readinessBand, cell);
  }

  const bands = [...byBand.entries()]
    .filter(([, c]) => c.inMarket >= CALIBRATION_K) // k-floor on the denominator
    .map(([band, c]) => ({ band, inMarket: c.inMarket, placed: c.placed, placementRate: c.placed / c.inMarket }))
    .sort((a, b) => (a.band < b.band ? -1 : 1));

  return bands.length > 0 ? bands : null;
}

/**
 * Pool several cohort-complete batches into one calibration (more batches → tighter, less
 * college-confounded estimates). Incomplete batches are dropped, not partially counted.
 */
export function pooledCalibration(
  batches: readonly { members: readonly CalibrationMember[]; dataComplete: boolean }[],
  version: string,
): BandCalibration[] | null {
  const complete = batches.filter((b) => b.dataComplete);
  if (complete.length === 0) return null;
  const allMembers = complete.flatMap((b) => b.members);
  // dataComplete already vetted per batch; pool as one complete set.
  return calibrateBatch(allMembers, { version, dataComplete: true });
}
