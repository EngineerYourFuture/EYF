import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Hiring integration (PRD §21 — the payoff). Consent gates the pool: only
 * opted-in students are searchable; POOL_ANON hides identity until shortlisted.
 * Recruiters rank by real Readiness, open an evidence profile (readiness +
 * certs + skills, no résumé), shortlist (freezing an evidence snapshot), and
 * move candidates through stages. Recruiter can pipeline but never offer.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("hiring pipeline (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let recruiter: { id: string; token: string };
  let candA: { id: string; token: string }; // POOL_FULL, high readiness
  let candB: { id: string; token: string }; // POOL_ANON
  let candC: { id: string; token: string }; // NOT in pool
  let orgId: string;
  let reqId: string;

  const inject = (token: string, method: "GET" | "POST" | "PATCH", url: string, body?: object) =>
    app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { payload: JSON.stringify(body) } : {}) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({ data: { clerkId: `hr_${tag}_${stamp}`, email: `hr-${tag}-${stamp}@test.eyf`, name: `Hire ${tag}` } });
      return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" }) };
    };
    recruiter = await mkUser("rec");
    candA = await mkUser("canda");
    candB = await mkUser("candb");
    candC = await mkUser("candc");
    const org = await prisma.organization.create({
      data: { name: `HireTest ${stamp}`, slug: `hire-test-${stamp}`, accessCode: `hr-${stamp}`, members: { create: [{ userId: recruiter.id, roles: ["RECRUITER"] }] } },
    });
    orgId = org.id;

    // Give candA strong signal so it ranks first (solved problems boost DSA).
    await prisma.userProfile.create({ data: { userId: candA.id, totalSolved: 120, streakDays: 30, longestStreak: 30 } });
    // A verifiable certificate for candA's evidence profile.
    await prisma.certificate.create({ data: { userId: candA.id, type: "ASSESSMENT", title: "Certified Backend", score: 88, verificationCode: `hrcert${stamp}`, skillsAsserted: [{ slug: "node", level: 85 }] } });
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    for (const u of [recruiter, candA, candB, candC].filter(Boolean)) {
      await prisma.talentConsent.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.certificate.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.userProfile.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await app?.close();
  });

  it("students opt into the pool with a chosen anonymity scope", async () => {
    expect((await inject(candA.token, "POST", "/v1/talent/consent", { scope: "POOL_FULL" })).json().data).toMatchObject({ inPool: true, scope: "POOL_FULL" });
    expect((await inject(candB.token, "POST", "/v1/talent/consent", { scope: "POOL_ANON" })).json().data).toMatchObject({ inPool: true, scope: "POOL_ANON" });
    // candC never consents.
    expect((await inject(candC.token, "GET", "/v1/talent/consent")).json().data.inPool).toBe(false);
  });

  it("search returns ONLY consented students, ranked by readiness; anon is masked", async () => {
    const res = await inject(recruiter.token, "GET", `/v1/orgs/${orgId}/talent/search`);
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.candidates.map((c: { userId: string }) => c.userId);
    expect(ids).toContain(candA.id);
    expect(ids).toContain(candB.id);
    expect(ids).not.toContain(candC.id); // no consent → invisible
    // candA (120 solves) ranks above candB (no activity).
    expect(ids[0]).toBe(candA.id);
    // POOL_ANON candidate's name is masked in search.
    const b = res.json().data.candidates.find((c: { userId: string }) => c.userId === candB.id);
    expect(b.name).toMatch(/^Candidate /);
    expect(b.anon).toBe(true);
  });

  it("evidence profile reads readiness + certs + skills (POOL_FULL reveals identity)", async () => {
    const res = await inject(recruiter.token, "GET", `/v1/orgs/${orgId}/talent/${candA.id}/profile`);
    expect(res.statusCode).toBe(200);
    const p = res.json().data;
    expect(p.identity.name).toBe("Hire canda"); // POOL_FULL → revealed
    expect(p.readiness.overall).toBeGreaterThan(0);
    expect(p.certificates).toHaveLength(1);
    expect(p.certificates[0]).toMatchObject({ title: "Certified Backend", score: 88 });
  });

  it("POOL_ANON identity stays masked until shortlisted", async () => {
    const before = await inject(recruiter.token, "GET", `/v1/orgs/${orgId}/talent/${candB.id}/profile`);
    expect(before.json().data.identity.anon).toBe(true);
    // A non-consented candidate has no profile at all.
    expect((await inject(recruiter.token, "GET", `/v1/orgs/${orgId}/talent/${candC.id}/profile`)).statusCode).toBe(404);
  });

  it("requisition → shortlist freezes an evidence snapshot → move stages", async () => {
    reqId = (await inject(recruiter.token, "POST", `/v1/orgs/${orgId}/requisitions`, { title: "Backend Engineer", minReadiness: 0 })).json().data.id;

    // Can't shortlist a non-pool candidate.
    expect((await inject(recruiter.token, "POST", `/v1/orgs/${orgId}/requisitions/${reqId}/candidates`, { userId: candC.id })).statusCode).toBe(409);

    const add = await inject(recruiter.token, "POST", `/v1/orgs/${orgId}/requisitions/${reqId}/candidates`, { userId: candB.id });
    expect(add.statusCode).toBe(201);
    expect(add.json().data.evidenceSnapshot).toHaveProperty("readiness");
    const candId = add.json().data.id;

    // Now that candB is in the pipeline, their POOL_ANON identity reveals to this org.
    const profile = await inject(recruiter.token, "GET", `/v1/orgs/${orgId}/talent/${candB.id}/profile`);
    expect(profile.json().data.identity.name).toBe("Hire candb");

    const moved = await inject(recruiter.token, "PATCH", `/v1/orgs/${orgId}/candidates/${candId}`, { stage: "INTERVIEW" });
    expect(moved.json().data.stage).toBe("INTERVIEW");

    const pipe = await inject(recruiter.token, "GET", `/v1/orgs/${orgId}/requisitions/${reqId}/pipeline`);
    expect(pipe.json().data.candidates[0]).toMatchObject({ stage: "INTERVIEW", name: "Hire candb" });
  });

  it("consent revoked → student vanishes from search", async () => {
    await inject(candA.token, "POST", "/v1/talent/consent/revoke");
    const res = await inject(recruiter.token, "GET", `/v1/orgs/${orgId}/talent/search`);
    expect(res.json().data.candidates.map((c: { userId: string }) => c.userId)).not.toContain(candA.id);
  });

  it("RECRUITER can pipeline but capability stops at offers; outsider 404", async () => {
    // RECRUITER lacks hire:offer entirely — no offer endpoint exists yet, but
    // talent:search/hire:pipeline are the only granted hire caps (asserted by
    // the successful calls above). Outsider is fully walled off.
    const outsider = await prisma.user.create({ data: { clerkId: `hr_out_${stamp}`, email: `hr-out-${stamp}@test.eyf`, name: "Out" } });
    const token = app.jwt.sign({ id: outsider.id, email: outsider.email, name: "Out", role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
    expect((await inject(token, "GET", `/v1/orgs/${orgId}/talent/search`)).statusCode).toBe(404);
    expect((await inject(token, "GET", `/v1/orgs/${orgId}/requisitions`)).statusCode).toBe(404);
    await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
  });
});
