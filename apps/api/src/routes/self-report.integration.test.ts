import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Proves the self-report path (docs/PLAN-proof-loop.md, S6): a student can record a
 * placement that happened outside EYF's pipeline, gated by explicit DPDP consent, and the
 * row is stored UNVERIFIED so it never enters a money aggregate.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("self-reported placement (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userId: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const s = Date.now();
    const user = await prisma.user.create({
      data: { clerkId: `sr_${s}`, email: `sr-${s}@test.eyf`, name: "Self Reporter", college: "NIT Trichy" },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (!userId) return;
    await prisma.placementOutcome.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  const post = (payload: unknown) => {
    const token = app.jwt.sign({ id: userId, email: "sr@x", name: "SR", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });
    return app.inject({
      method: "POST",
      url: "/v1/me/placements",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      payload: JSON.stringify(payload),
    });
  };

  it("rejects a report without DPDP consent", async () => {
    const res = await post({ companyName: "Acme", role: "SDE", ctcInr: 900_000, consent: false });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.details.reason).toBe("no-consent");
    expect(await prisma.placementOutcome.count({ where: { userId } })).toBe(0);
  });

  it("records a consented report as an UNVERIFIED self-report with a versioned snapshot", async () => {
    const res = await post({ companyName: "Zoho", role: "SDE-1", ctcInr: 700_000, consent: true });
    expect(res.statusCode).toBe(201);
    const row = await prisma.placementOutcome.findFirst({ where: { userId } });
    expect(row).not.toBeNull();
    expect(row!.source).toBe("SELF_REPORT");
    expect(row!.verifiedAt).toBeNull(); // never verified ⇒ excluded from money stats
    expect(row!.collegeSlug).toBe("nit-trichy");
    expect(row!.snapshotVersion).toBe("r1");
  });

  it("proof endpoint returns the college but null proof below the k-anonymity floor", async () => {
    const token = app.jwt.sign({ id: userId, email: "sr@x", name: "SR", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });
    const res = await app.inject({ method: "GET", url: "/v1/me/placement-proof", headers: { authorization: `Bearer ${token}` } });
    expect(res.statusCode).toBe(200);
    const body = res.json().data;
    expect(body.college).toBe("NIT Trichy");
    expect(body.proof).toBeNull(); // 1 outcome < COHORT_K ⇒ suppressed
  });
});
