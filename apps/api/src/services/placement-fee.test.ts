import { describe, it, expect } from "vitest";
import { computePlacementFee, DEFAULT_FEE_BPS } from "./placement-fee.js";

describe("computePlacementFee", () => {
  it("takes the default 10% of the CTC", () => {
    expect(computePlacementFee(1_200_000)).toBe(120_000); // ₹12L → ₹1.2L
    expect(DEFAULT_FEE_BPS).toBe(1000);
  });

  it("honours a custom rate in basis points", () => {
    expect(computePlacementFee(1_000_000, 1500)).toBe(150_000); // 15%
    expect(computePlacementFee(1_000_000, 800)).toBe(80_000); // 8%
  });

  it("rounds to the nearest rupee", () => {
    expect(computePlacementFee(999_999, 1000)).toBe(100_000); // 99999.9 → 100000
  });

  it("charges nothing on a zero or unpaid CTC (no fee on unpaid internships)", () => {
    expect(computePlacementFee(0)).toBe(0);
    expect(computePlacementFee(-5000)).toBe(0);
  });

  it("charges nothing at a zero/negative rate", () => {
    expect(computePlacementFee(1_000_000, 0)).toBe(0);
    expect(computePlacementFee(1_000_000, -100)).toBe(0);
  });
});
