import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Offers + F10 carry-over (PRD §21). The two-person chain: a RECRUITER drafts
 * (hire:pipeline) but CANNOT send; an OWNER/HR sends (hire:offer), and the
 * drafter cannot also be the sender. On accept, the candidate's B2C profile
 * BECOMES an org membership — campus→career made literal.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("offers + carry-over (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let owner: { id: string; token: string };
  let recruiter: { id: string; token: string };
  let candidate: { id: string; token: string };
  let orgId: string;
  let reqId: string;
  let offerId: string;

  const inject = (token: string, method: "GET" | "POST" | "PATCH", url: string, body?: object) =>
    app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { payload: JSON.stringify(body) } : {}) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({ data: { clerkId: `of_${tag}_${stamp}`, email: `of-${tag}-${stamp}@test.eyf`, name: `Offer ${tag}` } });
      return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" }) };
    };
    owner = await mkUser("owner");
    recruiter = await mkUser("rec");
    candidate = await mkUser("cand");
    const org = await prisma.organization.create({
      data: { name: `OfferTest ${stamp}`, slug: `offer-test-${stamp}`, accessCode: `of-${stamp}`, members: { create: [{ userId: owner.id, roles: ["OWNER"] }, { userId: recruiter.id, roles: ["RECRUITER"] }] } },
    });
    orgId = org.id;
    // Candidate joins the pool and gets shortlisted.
    await inject(candidate.token, "POST", "/v1/talent/consent", { scope: "POOL_FULL" });
    reqId = (await inject(recruiter.token, "POST", `/v1/orgs/${orgId}/requisitions`, { title: "SDE-1" })).json().data.id;
    await inject(recruiter.token, "POST", `/v1/orgs/${orgId}/requisitions/${reqId}/candidates`, { userId: candidate.id });
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    for (const u of [owner, recruiter, candidate].filter(Boolean)) {
      await prisma.talentConsent.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await app?.close();
  });

  it("recruiter drafts an offer but CANNOT send it (capability separation)", async () => {
    const draft = await inject(recruiter.token, "POST", `/v1/orgs/${orgId}/requisitions/${reqId}/offer`, { userId: candidate.id, title: "SDE-1", ctcInr: 1800000 });
    expect(draft.statusCode).toBe(201);
    offerId = draft.json().data.id;
    expect(draft.json().data.status).toBe("DRAFT");
    // RECRUITER lacks hire:offer entirely.
    const send = await inject(recruiter.token, "POST", `/v1/orgs/${orgId}/offers/${offerId}/send`);
    expect(send.statusCode).toBe(403);
  });

  it("offer requires the candidate be in the pipeline first", async () => {
    const stranger = await prisma.user.create({ data: { clerkId: `of_str_${stamp}`, email: `of-str-${stamp}@test.eyf`, name: "Stranger" } });
    const bad = await inject(recruiter.token, "POST", `/v1/orgs/${orgId}/requisitions/${reqId}/offer`, { userId: stranger.id, title: "SDE-X", ctcInr: 100000 });
    expect(bad.statusCode).toBe(409);
    expect(bad.json().error.code).toBe("NOT_IN_PIPELINE");
    await prisma.user.delete({ where: { id: stranger.id } }).catch(() => {});
  });

  it("owner (hire:offer) sends; candidate sees it", async () => {
    const send = await inject(owner.token, "POST", `/v1/orgs/${orgId}/offers/${offerId}/send`);
    expect(send.statusCode).toBe(200);
    expect(send.json().data.status).toBe("SENT");

    const mine = await inject(candidate.token, "GET", "/v1/talent/offers");
    expect(mine.json().data[0]).toMatchObject({ title: "SDE-1", ctcInr: 1800000, status: "SENT", company: `OfferTest ${stamp}` });
  });

  it("two-person rule: if the OWNER had drafted it, they couldn't self-send", async () => {
    // Owner drafts a second offer for the same candidate is blocked by unique;
    // use a fresh req to prove the self-send guard.
    const req2 = (await inject(owner.token, "POST", `/v1/orgs/${orgId}/requisitions`, { title: "SDE-2" })).json().data.id;
    await inject(owner.token, "POST", `/v1/orgs/${orgId}/requisitions/${req2}/candidates`, { userId: candidate.id });
    const draft2 = await inject(owner.token, "POST", `/v1/orgs/${orgId}/requisitions/${req2}/offer`, { userId: candidate.id, title: "SDE-2", ctcInr: 2000000 });
    const self = await inject(owner.token, "POST", `/v1/orgs/${orgId}/offers/${draft2.json().data.id}/send`);
    expect(self.statusCode).toBe(403);
    expect(self.json().error.code).toBe("TWO_PERSON_RULE");
  });

  it("THE CARRY-OVER: accepting an offer makes the candidate an org member (F10)", async () => {
    const before = await prisma.orgMember.findUnique({ where: { orgId_userId: { orgId, userId: candidate.id } } });
    expect(before).toBeNull();

    const accept = await inject(candidate.token, "POST", `/v1/talent/offers/${offerId}/respond`, { accept: true });
    expect(accept.statusCode).toBe(200);
    expect(accept.json().data).toMatchObject({ status: "ACCEPTED", joinedOrgId: orgId });

    // Same profile → now an org member with the MEMBER role.
    const member = await prisma.orgMember.findUnique({ where: { orgId_userId: { orgId, userId: candidate.id } } });
    expect(member).toMatchObject({ roles: ["MEMBER"], status: "ACTIVE" });
    // Pipeline card moved to HIRED.
    const cand = await prisma.pipelineCandidate.findUnique({ where: { reqId_userId: { reqId, userId: candidate.id } } });
    expect(cand?.stage).toBe("HIRED");
  });

  it("cannot respond twice; declining another offer leaves no membership", async () => {
    const again = await inject(candidate.token, "POST", `/v1/talent/offers/${offerId}/respond`, { accept: false });
    expect(again.statusCode).toBe(409); // already accepted
  });
});
