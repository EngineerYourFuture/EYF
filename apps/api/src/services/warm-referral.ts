/**
 * Warm alumni referral (Innovation Roadmap A2). A placed alum (an active org
 * member) refers a consented student into an OPEN requisition at their company.
 * The candidate enters the normal hiring pipeline as source=REFERRAL with the
 * referrer recorded — warm referral is the #1 real-world hiring channel, and
 * only EYF can attach verified readiness to the vouch.
 *
 * This is the pure guard; the endpoint does the DB reads and the create.
 */
export type ReferralCheck =
  | { ok: true }
  | { ok: false; reason: "req-closed" | "self" | "no-consent" | "already-in-pipeline" };

export function validateWarmReferral(input: {
  /** Status of the target requisition (already confirmed to belong to the org). */
  reqStatus: string;
  referrerUserId: string;
  refereeUserId: string;
  /** The student has an active talent-pool consent. */
  hasConsent: boolean;
  /** The student is already a candidate on this requisition. */
  alreadyCandidate: boolean;
}): ReferralCheck {
  if (input.reqStatus !== "OPEN") return { ok: false, reason: "req-closed" };
  if (input.referrerUserId === input.refereeUserId) return { ok: false, reason: "self" };
  if (!input.hasConsent) return { ok: false, reason: "no-consent" };
  if (input.alreadyCandidate) return { ok: false, reason: "already-in-pipeline" };
  return { ok: true };
}
