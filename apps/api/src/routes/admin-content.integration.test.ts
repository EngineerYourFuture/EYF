import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for the staff content back-office (`admin-content.ts`).
 *
 * The read side of this vertical was already exercised by the route sweep, but all
 * 12 write routes were untested. This walks the full jobs lifecycle — the pattern
 * every other content kind (problems, career-tracks, experiences) repeats — and
 * pins the three behaviours that are easy to regress and expensive to lose:
 *
 *   1. authorization: `manage:content` is required, so a student is refused;
 *   2. the slug-uniqueness and referential guards (409s), not just the happy path;
 *   3. the audit trail, which is the record of who changed student-facing content.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("admin content — jobs write lifecycle (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let adminId: string;
  let studentId: string;
  let jobId: string;
  const s = Date.now();
  const slug = `acme-sde-${s}`;

  // Bodyless verbs (GET/DELETE) must NOT carry a JSON content-type: Fastify
  // rejects an empty body against it with FST_ERR_CTP_EMPTY_JSON_BODY (400).
  const adminHeaders = () => ({
    authorization: `Bearer ${app.jwt.sign({ id: adminId, email: "ac-admin@x", name: "Admin", role: "ADMIN", plan: "free" }, { expiresIn: "5m" })}`,
    "x-admin-gate": app.jwt.sign({ id: adminId, adminGate: true }, { expiresIn: "5m" }),
  });
  const adminAuth = () => ({ ...adminHeaders(), "content-type": "application/json" });
  const studentAuth = () => ({
    authorization: `Bearer ${app.jwt.sign({ id: studentId, email: "ac-stu@x", name: "Stu", role: "STUDENT_ELITE", plan: "elite" }, { expiresIn: "5m" })}`,
    "content-type": "application/json",
  });

  const body = {
    slug,
    company: "Acme",
    title: "SDE 1",
    role: "SDE",
    location: "Bengaluru",
    description: "Build things.",
    applyUrl: "https://example.com/apply",
  };

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [admin, student] = await Promise.all([
      prisma.user.create({ data: { clerkId: `ac_admin_${s}`, email: `ac-admin-${s}@test.eyf`, name: "Admin", role: "ADMIN" } }),
      prisma.user.create({ data: { clerkId: `ac_stu_${s}`, email: `ac-stu-${s}@test.eyf`, name: "Stu" } }),
    ]);
    adminId = admin.id;
    studentId = student.id;
  });

  afterAll(async () => {
    await prisma.jobApplication.deleteMany({ where: { userId: studentId } }).catch(() => {});
    await prisma.job.deleteMany({ where: { slug: { startsWith: "acme-sde-" } } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { actorId: adminId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [adminId, studentId] } } }).catch(() => {});
    await app.close();
  });

  it("refuses a student without manage:content — before anything is created", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/admin/content/jobs", headers: studentAuth(), payload: JSON.stringify(body) });
    expect(res.statusCode).toBe(403);
    // And nothing was written as a side effect of the rejected call.
    expect(await prisma.job.count({ where: { slug } })).toBe(0);
  });

  it("rejects invalid input (bad slug, non-URL apply link)", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/admin/content/jobs", headers: adminAuth(),
      payload: JSON.stringify({ ...body, slug: "Not A Slug", applyUrl: "not-a-url" }),
    });
    expect(res.statusCode).toBe(400);
  });

  it("creates a job and writes an audit entry naming the actor", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/admin/content/jobs", headers: adminAuth(), payload: JSON.stringify(body) });
    expect(res.statusCode).toBe(201);
    jobId = res.json().data.id;
    expect(res.json().data.slug).toBe(slug);
    // Defaults from the schema are applied, not left undefined.
    expect(res.json().data.isActive).toBe(true);
    expect(res.json().data.remote).toBe(false);

    const audit = await prisma.auditLog.findFirst({ where: { entityId: jobId, action: "create" } });
    expect(audit).not.toBeNull();
    expect(audit!.actorId).toBe(adminId);
    expect(audit!.entity).toBe("job");
  });

  it("reads the created job back", async () => {
    const res = await app.inject({ method: "GET", url: `/v1/admin/content/jobs/${jobId}`, headers: adminHeaders() });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.company).toBe("Acme");
  });

  it("refuses a duplicate slug with 409 rather than creating a second row", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/admin/content/jobs", headers: adminAuth(), payload: JSON.stringify(body) });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("SLUG_TAKEN");
    expect(await prisma.job.count({ where: { slug } })).toBe(1);
  });

  it("patches only the supplied fields and leaves the rest intact", async () => {
    const res = await app.inject({
      method: "PATCH", url: `/v1/admin/content/jobs/${jobId}`, headers: adminAuth(),
      payload: JSON.stringify({ title: "SDE 2", remote: true }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.title).toBe("SDE 2");
    expect(res.json().data.remote).toBe(true);
    // Untouched fields survive a partial update.
    expect(res.json().data.company).toBe("Acme");
    expect(res.json().data.slug).toBe(slug);
  });

  it("404s a patch against an id that does not exist", async () => {
    const res = await app.inject({
      method: "PATCH", url: "/v1/admin/content/jobs/cl00000000000000000000000", headers: adminAuth(),
      payload: JSON.stringify({ title: "ghost" }),
    });
    expect(res.statusCode).toBe(404);
  });

  it("refuses to delete a job students have already applied to", async () => {
    await prisma.jobApplication.create({ data: { jobId, userId: studentId } });

    const res = await app.inject({ method: "DELETE", url: `/v1/admin/content/jobs/${jobId}`, headers: adminHeaders() });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("HAS_DEPENDENTS");
    // The job is still there — the guard protects the application's FK, so a
    // student's application history can't be silently destroyed.
    expect(await prisma.job.count({ where: { id: jobId } })).toBe(1);
  });

  it("deletes once the dependent application is gone", async () => {
    await prisma.jobApplication.deleteMany({ where: { jobId } });

    const res = await app.inject({ method: "DELETE", url: `/v1/admin/content/jobs/${jobId}`, headers: adminHeaders() });
    expect(res.statusCode).toBe(200);
    expect(await prisma.job.count({ where: { id: jobId } })).toBe(0);

    const gone = await app.inject({ method: "GET", url: `/v1/admin/content/jobs/${jobId}`, headers: adminHeaders() });
    expect(gone.statusCode).toBe(404);
  });
});
