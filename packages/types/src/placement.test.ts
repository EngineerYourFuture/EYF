import { describe, it, expect } from "vitest";
import { collegeSlug, ctcBand, descriptiveCohortProof, COHORT_K, type ProofRow } from "./placement";

describe("collegeSlug", () => {
  it("collapses case, punctuation, and whitespace variants to one slug", () => {
    const variants = ["IIT Bombay", "iit  bombay ", "IIT, Bombay", "IIT.Bombay", "Iit—Bombay"];
    const slugs = new Set(variants.map(collegeSlug));
    expect(slugs.size).toBe(1);
    expect([...slugs][0]).toBe("iit-bombay");
  });

  it("strips diacritics and normalizes ampersand", () => {
    expect(collegeSlug("Ecolé & Tech")).toBe("ecole-and-tech");
  });

  it("maps null/blank/punctuation-only to 'unknown' (never an empty key)", () => {
    expect(collegeSlug(null)).toBe("unknown");
    expect(collegeSlug("")).toBe("unknown");
    expect(collegeSlug("   ")).toBe("unknown");
    expect(collegeSlug("—")).toBe("unknown");
  });
});

describe("ctcBand", () => {
  it("buckets annual CTC into the right band", () => {
    expect(ctcBand(250_000)).toBe("< ₹3L");
    expect(ctcBand(600_000)).toBe("₹6–10L"); // boundary is inclusive-low
    expect(ctcBand(900_000)).toBe("₹6–10L");
    expect(ctcBand(1_200_000)).toBe("₹10–15L");
    expect(ctcBand(5_000_000)).toBe("₹25L+");
  });
});

describe("descriptiveCohortProof — k-anonymity + provenance", () => {
  const joined = (companyName: string, ctcInr: number | null, verified: boolean): ProofRow => ({
    companyName,
    ctcInr,
    status: "JOINED",
    verified,
  });

  it("suppresses a cohort below the k-floor (returns null → UI shows 'gathering')", () => {
    const rows = Array.from({ length: COHORT_K - 1 }, () => joined("Acme", 800_000, true));
    expect(descriptiveCohortProof(rows)).toBeNull();
  });

  it("renders at exactly the k-floor (boundary is inclusive)", () => {
    const rows = Array.from({ length: COHORT_K }, () => joined("Acme", 800_000, true));
    const proof = descriptiveCohortProof(rows);
    expect(proof).not.toBeNull();
    expect(proof!.placed).toBe(COHORT_K);
  });

  it("names a company only when ≥ K joined there (no singling-out)", () => {
    const rows = [
      ...Array.from({ length: COHORT_K }, () => joined("BigCo", 900_000, true)),
      joined("Rare Startup", 3_000_000, true), // only 1 → must be suppressed
    ];
    const proof = descriptiveCohortProof(rows)!;
    expect(proof.companies).toEqual(["BigCo"]);
    expect(proof.companies).not.toContain("Rare Startup");
  });

  it("computes the package band from VERIFIED rows only; self-reports never move money", () => {
    // 5 verified at ₹6–10L; a self-reported ₹80L that must NOT reach the band.
    const rows = [
      ...Array.from({ length: COHORT_K }, () => joined("BigCo", 800_000, true)),
      joined("BigCo", 8_000_000, false), // self-reported inflation attempt
    ];
    const proof = descriptiveCohortProof(rows)!;
    expect(proof.medianPackageBand).toBe("₹6–10L");
    expect(proof.placed).toBe(COHORT_K + 1); // still counts toward placed-count
  });

  it("returns a null package band when there are fewer than K verified packages", () => {
    const rows = [
      ...Array.from({ length: COHORT_K }, () => joined("BigCo", null, true)), // unpaid/undisclosed
      joined("BigCo", 900_000, true),
    ];
    const proof = descriptiveCohortProof(rows)!;
    expect(proof.medianPackageBand).toBeNull();
    expect(proof.placed).toBe(COHORT_K + 1);
  });

  it("takes the median of an even-length verified package set without dividing by zero", () => {
    const pkgs = [400_000, 500_000, 700_000, 900_000, 1_100_000, 1_300_000];
    const rows = pkgs.map((c) => joined("BigCo", c, true));
    const proof = descriptiveCohortProof(rows)!;
    // 6 packages → index 3 (0-based) = 900_000 → ₹6–10L band
    expect(proof.medianPackageBand).toBe("₹6–10L");
  });

  it("excludes OFFERED/RENEGED from placed-count (only JOINED counts)", () => {
    const rows: ProofRow[] = [
      ...Array.from({ length: COHORT_K }, () => joined("BigCo", 800_000, true)),
      { companyName: "BigCo", ctcInr: 800_000, status: "OFFERED", verified: true },
      { companyName: "BigCo", ctcInr: 800_000, status: "RENEGED", verified: true },
    ];
    const proof = descriptiveCohortProof(rows)!;
    expect(proof.placed).toBe(COHORT_K);
  });
});
