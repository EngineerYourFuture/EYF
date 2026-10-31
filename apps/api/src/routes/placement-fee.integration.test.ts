import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Proves the employer placement fee (Roadmap C1) is recorded when a candidate
 * accepts a PAID offer — and NOT for an unpaid one — end to end through the
 * real accept endpoint.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("placement fee on offer accept (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgId: string;
  let candId: string;
  let drafterUserId: string;
  let paidOfferId: string;
  let unpaidOfferId: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();

    const s = Date.now();
    const org = await prisma.organization.create({ data: { name: "Fee Co", slug: `fee-${s}`, accessCode: `FEE-${s}` } });
    orgId = org.id;
    const [cand, drafter] = await Promise.all([
      prisma.user.create({ data: { clerkId: `fee_c_${s}`, email: `fee-c-${s}@test.eyf`, name: "Cand" } }),
      prisma.user.create({ data: { clerkId: `fee_d_${s}`, email: `fee-d-${s}@test.eyf`, name: "Drafter" } }),
    ]);
    candId = cand.id;
    drafterUserId = drafter.id;
    const drafterMember = await prisma.orgMember.create({ data: { orgId, userId: drafter.id } });
    const req1 = await prisma.jobRequisition.create({ data: { orgId, title: "SDE" } });
    const paid = await prisma.offer.create({
      data: { reqId: req1.id, userId: candId, title: "SDE", ctcInr: 1_200_000, status: "SENT", draftedById: drafterMember.id, sentAt: new Date() },
    });
    paidOfferId = paid.id;
    const req2 = await prisma.jobRequisition.create({ data: { orgId, title: "Intern" } });
    const unpaid = await prisma.offer.create({
      data: { reqId: req2.id, userId: candId, title: "Intern", ctcInr: 0, status: "SENT", draftedById: drafterMember.id, sentAt: new Date() },
    });
    unpaidOfferId = unpaid.id;
  });

  afterAll(async () => {
    if (!orgId) return;
    await prisma.placementFee.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.offer.deleteMany({ where: { req: { orgId } } }).catch(() => {});
    await prisma.jobRequisition.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.orgMember.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [candId, drafterUserId] } } }).catch(() => {});
    await app.close();
  });

  const acceptAs = (userId: string, name: string, offerId: string) => {
    const token = app.jwt.sign({ id: userId, email: `${name}@x`, name, role: "STUDENT", plan: "free" }, { expiresIn: "5m" });
    return app.inject({
      method: "POST",
      url: `/v1/talent/offers/${offerId}/respond`,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      payload: JSON.stringify({ accept: true }),
    });
  };

  it("records a 10% fee when a paid offer is accepted", async () => {
    const res = await acceptAs(candId, "Cand", paidOfferId);
    expect(res.statusCode).toBe(200);

    const fee = await prisma.placementFee.findUnique({ where: { offerId: paidOfferId } });
    expect(fee).not.toBeNull();
    expect(fee!.ctcInr).toBe(1_200_000);
    expect(fee!.feeInr).toBe(120_000); // 10% of 12L
    expect(fee!.status).toBe("PENDING");

    const offer = await prisma.offer.findUnique({ where: { id: paidOfferId }, select: { status: true } });
    expect(offer!.status).toBe("ACCEPTED");
  });

  it("records NO fee for an unpaid (₹0) offer", async () => {
    const res = await acceptAs(candId, "Cand", unpaidOfferId);
    expect(res.statusCode).toBe(200);
    const fee = await prisma.placementFee.findUnique({ where: { offerId: unpaidOfferId } });
    expect(fee).toBeNull();
  });
});
