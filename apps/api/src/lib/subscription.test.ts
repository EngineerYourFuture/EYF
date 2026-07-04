import { describe, it, expect } from "vitest";
import { PlanTier, SubscriptionStatus } from "@eyf/db";
import { resolveActivePlan, decideWebhook } from "./subscription.js";

const now = new Date("2026-07-04T00:00:00Z");
const future = new Date("2026-08-04T00:00:00Z");
const past = new Date("2026-06-04T00:00:00Z");
const sub = (status: SubscriptionStatus, endsAt: Date | null, plan: PlanTier = PlanTier.PRO) => ({ plan, status, endsAt });

describe("resolveActivePlan — plan expiry + cancel gating", () => {
  it("grants an ACTIVE, unexpired subscription", () => {
    expect(resolveActivePlan(sub(SubscriptionStatus.ACTIVE, future), now)).toBe(PlanTier.PRO);
  });
  it("DENIES an expired subscription even though plan is set (the bug this fixes)", () => {
    expect(resolveActivePlan(sub(SubscriptionStatus.ACTIVE, past), now)).toBe(PlanTier.FREE);
  });
  it("keeps a CANCELED subscription until period end (cancel-at-period-end)", () => {
    expect(resolveActivePlan(sub(SubscriptionStatus.CANCELED, future, PlanTier.ELITE), now)).toBe(PlanTier.ELITE);
  });
  it("denies a CANCELED subscription past period end", () => {
    expect(resolveActivePlan(sub(SubscriptionStatus.CANCELED, past, PlanTier.ELITE), now)).toBe(PlanTier.FREE);
  });
  it("grants a TRIALING subscription", () => {
    expect(resolveActivePlan(sub(SubscriptionStatus.TRIALING, future), now)).toBe(PlanTier.PRO);
  });
  it("denies PAST_DUE (money-safe default, no grace)", () => {
    expect(resolveActivePlan(sub(SubscriptionStatus.PAST_DUE, future), now)).toBe(PlanTier.FREE);
  });
  it("denies EXPIRED and PAUSED", () => {
    expect(resolveActivePlan(sub(SubscriptionStatus.EXPIRED, future), now)).toBe(PlanTier.FREE);
    expect(resolveActivePlan(sub(SubscriptionStatus.PAUSED, future), now)).toBe(PlanTier.FREE);
  });
  it("treats null endsAt as perpetual-active (seed/legacy back-compat)", () => {
    expect(resolveActivePlan(sub(SubscriptionStatus.ACTIVE, null), now)).toBe(PlanTier.PRO);
  });
  it("returns FREE for no subscription", () => {
    expect(resolveActivePlan(null, now)).toBe(PlanTier.FREE);
  });
});

describe("decideWebhook — idempotency + ordering", () => {
  it("applies a fresh event", () => {
    expect(decideWebhook({ alreadyProcessed: false, eventCreatedAt: now, lastEventAt: past })).toBe("apply");
  });
  it("no-ops a duplicate delivery (event id already processed)", () => {
    expect(decideWebhook({ alreadyProcessed: true, eventCreatedAt: now, lastEventAt: past })).toBe("duplicate");
  });
  it("applies when there is no prior event", () => {
    expect(decideWebhook({ alreadyProcessed: false, eventCreatedAt: now, lastEventAt: null })).toBe("apply");
  });
  it("no-ops a stale out-of-order event (newer cancel already applied; late activation ignored)", () => {
    expect(decideWebhook({ alreadyProcessed: false, eventCreatedAt: past, lastEventAt: future })).toBe("stale");
  });
  it("applies an equal-timestamp event (>= boundary)", () => {
    expect(decideWebhook({ alreadyProcessed: false, eventCreatedAt: now, lastEventAt: now })).toBe("apply");
  });
});
