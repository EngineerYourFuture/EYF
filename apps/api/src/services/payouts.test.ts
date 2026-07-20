import { describe, it, expect } from "vitest";
import { computePayoutSplit, PLATFORM_FEE_PCT } from "./payouts.js";

describe("computePayoutSplit", () => {
  it("splits a full-hour session 80/20 (mentor/platform) in paisa", () => {
    // ₹1000/hr × 60min = ₹1000 = 100000 paisa
    const { platformFeeInr, mentorShareInr } = computePayoutSplit(1000, 60);
    expect(platformFeeInr).toBe(20000);  // 20%
    expect(mentorShareInr).toBe(80000);  // 80%
    expect(platformFeeInr + mentorShareInr).toBe(100000);
  });

  it("pro-rates a half-hour session", () => {
    const { platformFeeInr, mentorShareInr } = computePayoutSplit(1000, 30);
    expect(platformFeeInr).toBe(10000);
    expect(mentorShareInr).toBe(40000);
  });

  it("rounds to whole paisa and keeps fee = PLATFORM_FEE_PCT of total", () => {
    const { platformFeeInr, mentorShareInr } = computePayoutSplit(999, 45);
    const total = platformFeeInr + mentorShareInr;
    expect(platformFeeInr).toBe(Math.round(total * PLATFORM_FEE_PCT));
    expect(Number.isInteger(platformFeeInr)).toBe(true);
    expect(Number.isInteger(mentorShareInr)).toBe(true);
  });
});
