import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Proves the warm-referral endpoint (Roadmap A2): an active alum refers a
 * consented student into an OPEN requisition → the student enters the pipeline
 * as source=REFERRAL with the alum recorded; a non-consented student is rejected.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("warm alumni referral (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgId: string;
  let alumId: string;
  let alumMemberId: string;
  let consentedId: string;
  let noConsentId: string;
  let reqId: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const s = Date.now();
    const org = await prisma.organization.create({ data: { name: "Warm Co", slug: `warm-${s}`, accessCode: `WARM-${s}` } });
    orgId = org.id;
    const [alum, c1, c2] = await Promise.all([
      prisma.user.create({ data: { clerkId: `w_a_${s}`, email: `w-a-${s}@test.eyf`, name: "Alum" } }),
      prisma.user.create({ data: { clerkId: `w_c_${s}`, email: `w-c-${s}@test.eyf`, name: "Junior" } }),
      prisma.user.create({ data: { clerkId: `w_n_${s}`, email: `w-n-${s}@test.eyf`, name: "NoConsent" } }),
    ]);
    alumId = alum.id; consentedId = c1.id; noConsentId = c2.id;
    const m = await prisma.orgMember.create({ data: { orgId, userId: alumId, status: "ACTIVE" } });
    alumMemberId = m.id;
    await prisma.talentConsent.create({ data: { userId: consentedId } });
    const r = await prisma.jobRequisition.create({ data: { orgId, title: "SDE", status: "OPEN" } });
    reqId = r.id;
  });

  afterAll(async () => {
    if (!orgId) return;
    await prisma.pipelineCandidate.deleteMany({ where: { req: { orgId } } }).catch(() => {});
    await prisma.jobRequisition.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.talentConsent.deleteMany({ where: { userId: { in: [consentedId, noConsentId] } } }).catch(() => {});
    await prisma.orgMember.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [alumId, consentedId, noConsentId] } } }).catch(() => {});
    await app.close();
  });

  const refer = (userId: string) => {
    const token = app.jwt.sign({ id: alumId, email: "alum@x", name: "Alum", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });
    return app.inject({
      method: "POST",
      url: `/v1/orgs/${orgId}/referrals`,
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      payload: JSON.stringify({ reqId, userId }),
    });
  };

  it("adds a consented student to the pipeline as a REFERRAL by the alum", async () => {
    const res = await refer(consentedId);
    expect(res.statusCode).toBe(201);
    const cand = await prisma.pipelineCandidate.findFirst({ where: { reqId, userId: consentedId } });
    expect(cand?.source).toBe("REFERRAL");
    expect(cand?.referredById).toBe(alumMemberId);
  });

  it("rejects referring a student who hasn't opted into the talent pool", async () => {
    const res = await refer(noConsentId);
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("REFERRAL_INVALID");
  });
});
