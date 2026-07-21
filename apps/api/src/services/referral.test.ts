import { describe, it, expect } from "vitest";
import { newReferralCode, qualifies, validateRedeem, QUALIFY_XP } from "./referral.js";

describe("newReferralCode", () => {
  it("is 8 chars from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = newReferralCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
      expect(code).not.toMatch(/[O0I1]/); // no look-alike characters
    }
  });
});

describe("qualifies", () => {
  it("is true only at or above the XP bar", () => {
    expect(qualifies(0)).toBe(false);
    expect(qualifies(QUALIFY_XP - 1)).toBe(false);
    expect(qualifies(QUALIFY_XP)).toBe(true);
    expect(qualifies(QUALIFY_XP + 500)).toBe(true);
  });
});

describe("validateRedeem", () => {
  const base = { refereeId: "ref", referrerId: "rer", refereeAlreadyReferred: false, refereeXp: 0 };

  it("accepts a valid new referee", () => {
    expect(validateRedeem(base)).toEqual({ ok: true });
  });

  it("rejects an unknown code", () => {
    expect(validateRedeem({ ...base, referrerId: null })).toEqual({ ok: false, reason: "unknown-code" });
  });

  it("rejects referring yourself", () => {
    expect(validateRedeem({ ...base, referrerId: "ref" })).toEqual({ ok: false, reason: "self" });
  });

  it("rejects a referee who was already referred", () => {
    expect(validateRedeem({ ...base, refereeAlreadyReferred: true })).toEqual({ ok: false, reason: "already-referred" });
  });

  it("rejects a non-new referee (already past the XP bar)", () => {
    expect(validateRedeem({ ...base, refereeXp: QUALIFY_XP })).toEqual({ ok: false, reason: "not-new" });
    expect(validateRedeem({ ...base, refereeXp: QUALIFY_XP + 1 })).toEqual({ ok: false, reason: "not-new" });
  });

  it("checks guards in priority order (unknown-code before self)", () => {
    // null referrer AND self would both apply; unknown-code wins.
    expect(validateRedeem({ ...base, referrerId: null, refereeId: "x" })).toEqual({ ok: false, reason: "unknown-code" });
  });
});
