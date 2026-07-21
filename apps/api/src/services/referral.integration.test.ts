import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { settleReferralFor, grantPromoPro, REWARD_DAYS, QUALIFY_XP } from "./referral.js";
import { resolveActivePlan } from "../lib/subscription.js";

/**
 * Proves the referral reward actually pays out: a PENDING referral only settles
 * once the referee crosses the XP bar, and settlement grants BOTH parties promo
 * Pro. Also checks the billing-safety rule (a paid plan is never clobbered).
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("referral reward settlement (integration)", () => {
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let PlanTier: (typeof import("@eyf/db"))["PlanTier"];
  let SubscriptionStatus: (typeof import("@eyf/db"))["SubscriptionStatus"];
  let referrerId: string;
  let refereeId: string;
  let paidId: string;

  beforeAll(async () => {
    ({ prisma, PlanTier, SubscriptionStatus } = await import("@eyf/db"));
    const s = Date.now();
    const mk = (tag: string) =>
      prisma.user.create({ data: { clerkId: `ref_${tag}_${s}`, email: `ref-${tag}-${s}@test.eyf`, name: tag } });
    const [a, b, c] = await Promise.all([mk("rer"), mk("ree"), mk("paid")]);
    referrerId = a.id; refereeId = b.id; paidId = c.id;
    // Referee starts new (0 XP); referrer has a profile too.
    await prisma.userProfile.createMany({
      data: [{ userId: referrerId, currentXp: 0 }, { userId: refereeId, currentXp: 0 }, { userId: paidId, currentXp: 0 }],
    });
    await prisma.referral.create({ data: { referrerId, refereeId, rewardDays: REWARD_DAYS } });
  });

  afterAll(async () => {
    if (!referrerId) return;
    const ids = [referrerId, refereeId, paidId];
    await prisma.referral.deleteMany({ where: { refereeId: { in: ids } } }).catch(() => {});
    await prisma.subscription.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.userProfile.deleteMany({ where: { userId: { in: ids } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
  });

  it("does NOT pay out while the referee is below the XP bar", async () => {
    const settled = await settleReferralFor(refereeId);
    expect(settled).toBe(false);
    const r = await prisma.referral.findUnique({ where: { refereeId } });
    expect(r?.status).toBe("PENDING");
  });

  it("pays out both parties once the referee qualifies", async () => {
    await prisma.userProfile.update({ where: { userId: refereeId }, data: { currentXp: QUALIFY_XP } });
    const settled = await settleReferralFor(refereeId);
    expect(settled).toBe(true);

    const r = await prisma.referral.findUnique({ where: { refereeId } });
    expect(r?.status).toBe("REWARDED");
    expect(r?.rewardedAt).not.toBeNull();

    for (const id of [referrerId, refereeId]) {
      const sub = await prisma.subscription.findUnique({ where: { userId: id }, select: { plan: true, status: true, endsAt: true } });
      expect(resolveActivePlan(sub)).toBe(PlanTier.PRO); // both now have Pro access
    }
  });

  it("is idempotent — a second settle does nothing", async () => {
    expect(await settleReferralFor(refereeId)).toBe(false);
  });

  it("never clobbers a paid plan (billing-safe grant)", async () => {
    // A user with a real paid ELITE plan should be left untouched by a promo grant.
    const future = new Date(Date.now() + 90 * 86_400_000);
    await prisma.subscription.create({
      data: { userId: paidId, plan: PlanTier.ELITE, status: SubscriptionStatus.ACTIVE, endsAt: future, amountInr: 99900, razorpayPlanId: "plan_paid" },
    });
    const granted = await grantPromoPro(paidId, REWARD_DAYS);
    expect(granted).toBe(false);
    const sub = await prisma.subscription.findUnique({ where: { userId: paidId } });
    expect(sub?.plan).toBe(PlanTier.ELITE);        // still Elite
    expect(sub?.amountInr).toBe(99900);            // paid state intact
    expect(sub?.endsAt?.getTime()).toBe(future.getTime()); // untouched
  });
});
