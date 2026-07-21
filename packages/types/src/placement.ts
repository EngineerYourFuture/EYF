/**
 * Proof Loop — pure cohort logic (docs/PLAN-proof-loop.md, Phase 1).
 *
 * Two responsibilities, both deliberately un-clever so a new reader gets them in 30s:
 *  1. `collegeSlug` — the canonical cohort key. All cohort math groups on this slug,
 *     NEVER the raw free-text `User.college`, so "IIT Bombay" / "iit  bombay " /
 *     "IIT, Bombay" collapse to one cohort and a student can't manufacture a singleton
 *     cohort (which would defeat k-anonymity). Full institutional alias mapping
 *     ("IIT-B" → "iit-bombay") is a Phase-2 canonical `College` table; this handles the
 *     common case/punctuation/whitespace/diacritic variants.
 *  2. `descriptiveCohortProof` — the ONLY student/TPO-facing statistic in Phase 1. It is
 *     strictly descriptive and past-tense ("verified alumni were placed at…"), NEVER
 *     predictive ("you will be placed"), because predictive placement/salary claims are
 *     regulated speech in India (CCPA 2024 ed-tech guidance) and because self-report data
 *     can't support them anyway (survivorship bias). Every output is gated on a
 *     k-anonymity floor and packages are shown as BANDS, never exact figures.
 */

/** k-anonymity floor: never render a cohort — or name a company — below this many people. */
export const COHORT_K = 5;

/** Normalize a raw college string to a stable cohort slug. `null`/blank → "unknown". */
export function collegeSlug(raw: string | null | undefined): string {
  if (!raw) return "unknown";
  const cleaned = raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ") // punctuation → space
    .trim()
    .replace(/\s+/g, "-");
  return cleaned || "unknown";
}

// Annual CTC bands (INR). Student-facing surfaces show the band, never the exact figure.
const CTC_BANDS: readonly [number, number, string][] = [
  [0, 300_000, "< ₹3L"],
  [300_000, 600_000, "₹3–6L"],
  [600_000, 1_000_000, "₹6–10L"],
  [1_000_000, 1_500_000, "₹10–15L"],
  [1_500_000, 2_500_000, "₹15–25L"],
  [2_500_000, Infinity, "₹25L+"],
];

/** The band label an annual CTC falls into. */
export function ctcBand(ctcInr: number): string {
  const hit = CTC_BANDS.find(([lo, hi]) => ctcInr >= lo && ctcInr < hi);
  return hit ? hit[2] : "₹25L+";
}

/** One placement, as the aggregator needs it (already scoped to a single cohort). */
export type ProofRow = {
  companyName: string;
  ctcInr: number | null;
  status: "OFFERED" | "JOINED" | "RENEGED";
  /** True only for provenance-verified rows (employer-set CTC). Self-reports are false. */
  verified: boolean;
};

export type CohortProof = {
  /** JOINED placements in the cohort (verified + self-reported both count toward this). */
  placed: number;
  /** Companies that hired ≥ COHORT_K from this cohort (per-cell k-floor). Alphabetical. */
  companies: string[];
  /** Band of the median VERIFIED package, or null when fewer than COHORT_K verified packages. */
  medianPackageBand: string | null;
};

/**
 * Descriptive proof for ONE cohort. Returns null when the cohort itself is below the
 * k-floor (nothing renders — the caller shows "gathering"). Money (package band) is
 * computed ONLY from verified rows; self-reports move placed-count and company presence
 * but never a package figure. A company is named only if ≥ COHORT_K joined there.
 */
export function descriptiveCohortProof(rows: readonly ProofRow[]): CohortProof | null {
  const joined = rows.filter((r) => r.status === "JOINED");
  if (joined.length < COHORT_K) return null; // whole-cohort k-anonymity floor

  const byCompany = new Map<string, number>();
  for (const r of joined) byCompany.set(r.companyName, (byCompany.get(r.companyName) ?? 0) + 1);
  const companies = [...byCompany.entries()]
    .filter(([, count]) => count >= COHORT_K) // per-company k-floor: no singling-out
    .map(([name]) => name)
    .sort((a, b) => (a < b ? -1 : 1));

  const verifiedPkgs = joined
    .filter((r) => r.verified && r.ctcInr != null && r.ctcInr > 0)
    .map((r) => r.ctcInr as number)
    .sort((a, b) => a - b);
  const medianPackageBand =
    verifiedPkgs.length >= COHORT_K ? ctcBand(verifiedPkgs[Math.floor(verifiedPkgs.length / 2)]!) : null;

  return { placed: joined.length, companies, medianPackageBand };
}

/** Sanity cap on a self-reported annual CTC (₹10 crore) — rejects fat-finger/garbage input. */
export const MAX_SELF_REPORT_CTC = 100_000_000;

export type SelfReportInput = {
  companyName: string;
  role: string;
  ctcInr?: number | null;
  status?: "OFFERED" | "JOINED";
  /** Explicit DPDP consent to store employer/CTC/placement (financial PII). Required true. */
  consent: boolean;
};

export type SelfReportCheck =
  | { ok: true; value: { companyName: string; role: string; ctcInr: number | null; status: "OFFERED" | "JOINED" } }
  | { ok: false; reason: "no-consent" | "no-company" | "no-role" | "bad-ctc" };

/**
 * Pure guard for a student-submitted placement. Enforces the DPDP consent gate and basic
 * hygiene in one testable place. A self-report is ALWAYS unverified (never sets verifiedAt),
 * so a passing check here still keeps the row out of every money aggregate until an offer
 * letter verifies it — the trust boundary lives in `descriptiveCohortProof`, not here.
 */
export function validateSelfReport(input: SelfReportInput): SelfReportCheck {
  if (input.consent !== true) return { ok: false, reason: "no-consent" };
  const companyName = input.companyName?.trim() ?? "";
  if (companyName.length < 2) return { ok: false, reason: "no-company" };
  const role = input.role?.trim() ?? "";
  if (role.length < 2) return { ok: false, reason: "no-role" };
  const ctc = input.ctcInr ?? null;
  if (ctc !== null && (!Number.isInteger(ctc) || ctc < 0 || ctc > MAX_SELF_REPORT_CTC)) {
    return { ok: false, reason: "bad-ctc" };
  }
  return { ok: true, value: { companyName, role, ctcInr: ctc, status: input.status ?? "JOINED" } };
}
