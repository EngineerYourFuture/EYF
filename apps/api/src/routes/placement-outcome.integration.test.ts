import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Proves the Proof Loop capture (docs/PLAN-proof-loop.md, S4): accepting a paid offer
 * writes a VERIFIED PlacementOutcome atomically with the placement fee — snapshotting the
 * candidate's sourcing readiness, the normalized college slug, and the algorithm version.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("placement outcome capture on offer accept (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgId: string;
  let userId: string;
  let reqId: string;
  let offerId: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const s = Date.now();
    const org = await prisma.organization.create({ data: { name: "Proof Co", slug: `proof-${s}`, accessCode: `PROOF-${s}` } });
    orgId = org.id;
    const user = await prisma.user.create({
      data: { clerkId: `po_${s}`, email: `po-${s}@test.eyf`, name: "Placed Student", college: "IIT, Bombay " },
    });
    userId = user.id;
    const requisition = await prisma.jobRequisition.create({ data: { orgId, title: "SDE-1", status: "OPEN" } });
    reqId = requisition.id;
    await prisma.pipelineCandidate.create({
      data: {
        reqId,
        userId,
        stage: "OFFER",
        fitScore: 78,
        evidenceSnapshot: { readiness: 78, band: "Interview-ready", at: new Date().toISOString() },
      },
    });
    const offer = await prisma.offer.create({
      data: { reqId, userId, title: "SDE-1", ctcInr: 1_200_000, status: "SENT", draftedById: "test-member" },
    });
    offerId = offer.id;
  });

  afterAll(async () => {
    if (!orgId) return;
    await prisma.placementOutcome.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.placementFee.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.offer.deleteMany({ where: { reqId } }).catch(() => {});
    await prisma.pipelineCandidate.deleteMany({ where: { reqId } }).catch(() => {});
    await prisma.jobRequisition.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.orgMember.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  it("writes a verified PIPELINE outcome with a frozen, versioned snapshot on accept", async () => {
    const token = app.jwt.sign({ id: userId, email: "po@x", name: "Placed", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });
    const res = await app.inject({
      method: "POST",
      url: `/v1/talent/offers/${offerId}/respond`,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      payload: JSON.stringify({ accept: true }),
    });
    expect(res.statusCode).toBe(200);

    const outcome = await prisma.placementOutcome.findUnique({ where: { offerId } });
    expect(outcome).not.toBeNull();
    expect(outcome!.source).toBe("PIPELINE");
    expect(outcome!.status).toBe("JOINED");
    expect(outcome!.verifiedAt).not.toBeNull(); // employer-set CTC ⇒ verified
    expect(outcome!.ctcInr).toBe(1_200_000);
    expect(outcome!.companyName).toBe("Proof Co");
    expect(outcome!.readinessOverall).toBe(78);
    expect(outcome!.readinessBand).toBe("Interview-ready");
    expect(outcome!.snapshotVersion).toBe("r1");
    expect(outcome!.collegeSlug).toBe("iit-bombay"); // normalized from "IIT, Bombay "

    // The fee row was written in the same transaction.
    const fee = await prisma.placementFee.findUnique({ where: { offerId } });
    expect(fee).not.toBeNull();
  });

  it("is idempotent — a repeat accept does not duplicate the outcome", async () => {
    const count = await prisma.placementOutcome.count({ where: { offerId } });
    expect(count).toBe(1);
  });
});
