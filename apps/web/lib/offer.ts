/**
 * Offer Predictor — projects an expected package from the user's Placement
 * Readiness, the target role's salary band, and the target company's tier.
 * Pure + deterministic. Grounded in real signals (readiness + CareerTrack
 * bands + company tier), not a gimmick — and it points at the lever that
 * raises the number most.
 */
import type { CompanyTier } from "./company-readiness";

// How a tier scales a role's base band. Top-tier pays a real premium.
const TIER_MULT: Record<CompanyTier, number> = { service: 0.75, mass: 1.0, product: 1.3, elite: 1.7 };

export type OfferPrediction = {
  lowLpa: number;
  highLpa: number;
  expectedLpa: number;
  ceilingLpa: number;   // what full readiness at this tier could yield
  pctOfCeiling: number; // how close the expected offer is to the ceiling
};

export function predictOffer(opts: { readiness: number; minLpa: number; maxLpa: number; tier: CompanyTier }): OfferPrediction {
  const r = Math.max(0, Math.min(1, opts.readiness / 100));
  const mult = TIER_MULT[opts.tier];
  // Readiness interpolates within the band; tier scales the whole thing.
  const expected = (opts.minLpa + (opts.maxLpa - opts.minLpa) * r) * mult;
  const ceiling = opts.maxLpa * mult;
  const floor = opts.minLpa * mult * 0.9;
  const spread = expected * 0.12;
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    lowLpa: round(Math.max(floor, expected - spread)),
    highLpa: round(expected + spread),
    expectedLpa: round(expected),
    ceilingLpa: round(ceiling),
    pctOfCeiling: Math.min(100, Math.round((expected / ceiling) * 100)),
  };
}
