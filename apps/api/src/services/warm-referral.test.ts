import { describe, it, expect } from "vitest";
import { validateWarmReferral } from "./warm-referral.js";

const base = {
  reqStatus: "OPEN", referrerUserId: "alum", refereeUserId: "junior",
  hasConsent: true, alreadyCandidate: false,
};

describe("validateWarmReferral", () => {
  it("accepts a valid warm referral", () => {
    expect(validateWarmReferral(base)).toEqual({ ok: true });
  });

  it("rejects a closed/paused requisition", () => {
    expect(validateWarmReferral({ ...base, reqStatus: "CLOSED" })).toEqual({ ok: false, reason: "req-closed" });
    expect(validateWarmReferral({ ...base, reqStatus: "PAUSED" })).toEqual({ ok: false, reason: "req-closed" });
  });

  it("rejects referring yourself", () => {
    expect(validateWarmReferral({ ...base, refereeUserId: "alum" })).toEqual({ ok: false, reason: "self" });
  });

  it("rejects a student who hasn't consented to the talent pool", () => {
    expect(validateWarmReferral({ ...base, hasConsent: false })).toEqual({ ok: false, reason: "no-consent" });
  });

  it("rejects a duplicate (already in this pipeline)", () => {
    expect(validateWarmReferral({ ...base, alreadyCandidate: true })).toEqual({ ok: false, reason: "already-in-pipeline" });
  });

  it("checks status before consent (closed req wins over missing consent)", () => {
    expect(validateWarmReferral({ ...base, reqStatus: "CLOSED", hasConsent: false })).toEqual({ ok: false, reason: "req-closed" });
  });
});
