import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Proves the TPO batch roster + honest calibration (Proof Loop Phase 2). The load-bearing
 * behavior: calibration returns null until the batch is marked cohort-complete (the
 * survivorship-bias guard), then reports a real placement rate with the non-placed denominator.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("TPO batch roster + calibration (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let adminId: string;
  let batchId: string;
  let seededUserIds: string[] = [];
  const s = Date.now();

  const auth = () => {
    const token = app.jwt.sign({ id: adminId, email: "admin@x", name: "Admin", role: "ADMIN", plan: "free" }, { expiresIn: "5m" });
    const gate = app.jwt.sign({ id: adminId, adminGate: true }, { expiresIn: "5m" });
    return { authorization: `Bearer ${token}`, "x-admin-gate": gate, "content-type": "application/json" };
  };

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const admin = await prisma.user.create({ data: { clerkId: `ab_admin_${s}`, email: `ab-admin-${s}@test.eyf`, name: "Admin", role: "ADMIN" } });
    adminId = admin.id;
  });

  afterAll(async () => {
    await prisma.batchMember.deleteMany({ where: { batch: { college: { slug: `iit-testpur` } } } }).catch(() => {});
    await prisma.batchCohort.deleteMany({ where: { college: { slug: `iit-testpur` } } }).catch(() => {});
    await prisma.college.deleteMany({ where: { slug: `iit-testpur` } }).catch(() => {});
    await prisma.placementOutcome.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [adminId, ...seededUserIds] } } }).catch(() => {});
    await app.close();
  });

  it("creates a batch and copies a member's frozen readiness band from their outcome", async () => {
    const create = await app.inject({ method: "POST", url: "/v1/admin/batches", headers: auth(), payload: JSON.stringify({ collegeName: "IIT Testpur", gradYear: 2026 }) });
    expect(create.statusCode).toBe(200);
    batchId = create.json().data.batchId;

    const u = await prisma.user.create({ data: { clerkId: `ab_u_${s}`, email: `ab-u-${s}@test.eyf`, name: "Placed One", college: "IIT Testpur" } });
    seededUserIds.push(u.id);
    await prisma.placementOutcome.create({
      data: { userId: u.id, source: "SELF_REPORT", status: "JOINED", companyName: "Acme", role: "SDE", readinessOverall: 82, readinessBand: "Interview-ready", snapshotVersion: "r1", collegeSlug: "iit-testpur" },
    });
    const add = await app.inject({ method: "POST", url: `/v1/admin/batches/${batchId}/members`, headers: auth(), payload: JSON.stringify({ studentName: "Placed One", userId: u.id, status: "PLACED" }) });
    expect(add.statusCode).toBe(201);
    expect(add.json().data.readinessBand).toBe("Interview-ready"); // copied from the outcome
  });

  it("returns null calibration until the batch is complete, then a real rate with the denominator", async () => {
    // Seed a cohort-complete-able batch directly: 5 PLACED + 2 NOT_PLACED at one band.
    for (let i = 0; i < 6; i++) {
      const status = i < 5 ? "PLACED" : "NOT_PLACED";
      await prisma.batchMember.create({
        data: { batchId, studentName: `Seed ${i}`, status, readinessBand: "Interview-ready", snapshotVersion: "r1" },
      });
    }
    // Now the band has 5 placed + 2 not-placed in-market (incl. the routed member) = 7.

    const before = await app.inject({ method: "GET", url: `/v1/admin/batches/${batchId}/calibration`, headers: auth() });
    expect(before.json().data.calibration).toBeNull(); // not complete → survivorship guard

    const complete = await app.inject({ method: "POST", url: `/v1/admin/batches/${batchId}/complete`, headers: auth(), payload: "{}" });
    expect(complete.statusCode).toBe(200);

    const after = await app.inject({ method: "GET", url: `/v1/admin/batches/${batchId}/calibration`, headers: auth() });
    const cal = after.json().data.calibration;
    expect(cal).not.toBeNull();
    const band = cal.find((b: { band: string }) => b.band === "Interview-ready");
    expect(band.inMarket).toBe(7);
    expect(band.placed).toBe(6);
    expect(band.placementRate).toBeCloseTo(6 / 7);
  });

  it("rejects a non-admin without the manage:users capability", async () => {
    const token = app.jwt.sign({ id: "someone", email: "s@x", name: "S", role: "STUDENT", plan: "free" }, { expiresIn: "5m" });
    const res = await app.inject({ method: "POST", url: "/v1/admin/batches", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, payload: JSON.stringify({ collegeName: "X College", gradYear: 2026 }) });
    expect(res.statusCode).toBe(403);
  });
});
