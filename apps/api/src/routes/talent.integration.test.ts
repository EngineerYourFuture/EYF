import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for the candidate side of consent-first hiring (`talent.ts`).
 *
 * Two things here are consequential beyond CRUD:
 *
 *   1. Consent is what puts a student into the recruiter-searchable pool. Revoke
 *      has to actually take them out, and re-granting after a revoke has to clear
 *      `revokedAt` — the route does that through an upsert, so a regression there
 *      would leave a student permanently un-searchable (or, worse, searchable
 *      after they opted out).
 *   2. An offer belongs to exactly one candidate. Responding is keyed off the
 *      session, so another user must not be able to accept or decline it.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("talent — consent lifecycle + offer response (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let meId = "", otherId = "", orgId = "", reqId = "", reqId2 = "", memberId = "";
  let sentOfferId = "", draftOfferId = "";
  const s = Date.now();

  const auth = (id: string) => ({
    authorization: `Bearer ${app.jwt.sign({ id, email: `t${id}@x`, name: "T", role: "STUDENT_ELITE", plan: "elite" }, { expiresIn: "5m" })}`,
    "content-type": "application/json",
  });
  const consentState = async (id: string) => {
    const res = await app.inject({ method: "GET", url: "/v1/talent/consent", headers: { authorization: auth(id).authorization } });
    expect(res.statusCode).toBe(200);
    return res.json().data as { inPool: boolean; scope?: string };
  };

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [me, other, org] = await Promise.all([
      prisma.user.create({ data: { clerkId: `tl_me_${s}`, email: `tl-me-${s}@test.eyf`, name: "Candidate" } }),
      prisma.user.create({ data: { clerkId: `tl_ot_${s}`, email: `tl-ot-${s}@test.eyf`, name: "Other" } }),
      prisma.organization.create({ data: { name: "Hirer", slug: `hirer-${s}`, accessCode: `hire-${s}` } }),
    ]);
    meId = me.id; otherId = other.id; orgId = org.id;

    // Offer carries @@unique([reqId, userId]) — one offer per requisition per
    // candidate — so the SENT and DRAFT fixtures need separate requisitions.
    const [jr, jr2, member] = await Promise.all([
      prisma.jobRequisition.create({ data: { orgId, title: "Backend Engineer" } }),
      prisma.jobRequisition.create({ data: { orgId, title: "Platform Engineer" } }),
      prisma.orgMember.create({ data: { orgId, userId: otherId } }),
    ]);
    reqId = jr.id; reqId2 = jr2.id; memberId = member.id;

    const [sent, draft] = await Promise.all([
      prisma.offer.create({ data: { reqId, userId: meId, title: "Backend Engineer", ctcInr: 1800000, status: "SENT", draftedById: memberId, sentAt: new Date() } }),
      prisma.offer.create({ data: { reqId: reqId2, userId: meId, title: "Second offer", ctcInr: 1000000, status: "DRAFT", draftedById: memberId } }),
    ]);
    sentOfferId = sent.id; draftOfferId = draft.id;
  });

  afterAll(async () => {
    await prisma.offer.deleteMany({ where: { reqId: { in: [reqId, reqId2] } } }).catch(() => {});
    await prisma.jobRequisition.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.orgMember.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.talentConsent.deleteMany({ where: { userId: { in: [meId, otherId] } } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [meId, otherId] } } }).catch(() => {});
    await app.close();
  });

  // ── consent ──────────────────────────────────────────────────────
  it("starts out of the pool", async () => {
    expect((await consentState(meId)).inPool).toBe(false);
  });

  it("defaults to the anonymous scope when none is supplied", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/talent/consent", headers: auth(meId), payload: JSON.stringify({}) });
    expect(res.statusCode).toBe(200);
    // POOL_ANON, not POOL_FULL — opting in must not silently expose identity.
    expect(res.json().data.scope).toBe("POOL_ANON");
    expect((await consentState(meId)).inPool).toBe(true);
  });

  it("honours an explicit full-visibility scope", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/talent/consent", headers: auth(meId), payload: JSON.stringify({ scope: "POOL_FULL" }) });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.scope).toBe("POOL_FULL");
  });

  it("revoke takes the student out of the pool and stamps revokedAt", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/talent/consent/revoke", headers: auth(meId), payload: JSON.stringify({}) });
    expect(res.statusCode).toBe(200);
    expect((await consentState(meId)).inPool).toBe(false);

    const row = await prisma.talentConsent.findUnique({ where: { userId: meId }, select: { revokedAt: true } });
    expect(row!.revokedAt).not.toBeNull();
  });

  it("re-granting after a revoke clears revokedAt rather than leaving them excluded", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/talent/consent", headers: auth(meId), payload: JSON.stringify({ scope: "POOL_ANON" }) });
    expect(res.statusCode).toBe(200);
    expect((await consentState(meId)).inPool).toBe(true);

    const row = await prisma.talentConsent.findUnique({ where: { userId: meId }, select: { revokedAt: true } });
    expect(row!.revokedAt).toBeNull();
  });

  // ── offer response ───────────────────────────────────────────────
  it("another user cannot respond to an offer that isn't theirs", async () => {
    const res = await app.inject({
      method: "POST", url: `/v1/talent/offers/${sentOfferId}/respond`,
      headers: auth(otherId), payload: JSON.stringify({ accept: true }),
    });
    expect(res.statusCode).toBe(404);

    const row = await prisma.offer.findUnique({ where: { id: sentOfferId }, select: { status: true, respondedAt: true } });
    expect(row!.status).toBe("SENT");        // untouched
    expect(row!.respondedAt).toBeNull();
  });

  it("refuses to respond to an offer that was never sent", async () => {
    const res = await app.inject({
      method: "POST", url: `/v1/talent/offers/${draftOfferId}/respond`,
      headers: auth(meId), payload: JSON.stringify({ accept: true }),
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("BAD_STATE");
  });

  it("declines a sent offer and refuses a second response", async () => {
    const first = await app.inject({
      method: "POST", url: `/v1/talent/offers/${sentOfferId}/respond`,
      headers: auth(meId), payload: JSON.stringify({ accept: false }),
    });
    expect(first.statusCode).toBe(200);
    expect(first.json().data.status).toBe("DECLINED");

    const row = await prisma.offer.findUnique({ where: { id: sentOfferId }, select: { status: true, respondedAt: true } });
    expect(row!.status).toBe("DECLINED");
    expect(row!.respondedAt).not.toBeNull();

    // Replaying the same response must not re-open a settled offer.
    const again = await app.inject({
      method: "POST", url: `/v1/talent/offers/${sentOfferId}/respond`,
      headers: auth(meId), payload: JSON.stringify({ accept: true }),
    });
    expect(again.statusCode).toBe(409);
  });
});
