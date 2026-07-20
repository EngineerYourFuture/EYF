/**
 * Placement success fee (Innovation Roadmap C1). EYF is the recruiter: when a
 * candidate accepts an offer sourced through EYF, the employer owes a fee — a
 * slice of the annual CTC, quoted in basis points (1000 bps = 10%). Standard
 * recruiting economics; no student liability, no warranty.
 */
export const DEFAULT_FEE_BPS = 1000; // 10%

/**
 * Fee in rupees for a CTC at the given rate. Returns 0 for a non-positive CTC or
 * rate (e.g. an unpaid internship offer — no fee is charged on those).
 */
export function computePlacementFee(ctcInr: number, feeBps: number = DEFAULT_FEE_BPS): number {
  if (ctcInr <= 0 || feeBps <= 0) return 0;
  return Math.round((ctcInr * feeBps) / 10_000);
}
