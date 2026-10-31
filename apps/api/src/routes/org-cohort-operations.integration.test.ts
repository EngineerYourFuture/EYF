import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
describe.skipIf(!process.env.DATABASE_URL)("cohort operations access and evidence", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>, prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = `${Date.now()}-cohort-ops`, users: { id: string; email: string; token: string }[] = [];
  let orgId: string, cohortId: string, memberId: string, lessonId: string, base: string;
  const call = (who: number, method: "GET" | "POST" | "PATCH", path: string, payload?: object) => app.inject({ method, url: `/v1${base}${path}`, headers: { authorization: `Bearer ${users[who]!.token}` }, ...(payload ? { payload } : {}) });
  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp(); await app.ready();
    for (const tag of ["owner", "manager", "learner", "outside"]) { const u = await prisma.user.create({ data: { clerkId: `${stamp}-${tag}`, email: `${stamp}-${tag}@test.eyf`, name: tag === "learner" ? "=SUM(1)" : tag } }); users.push({ ...u, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_FREE", plan: "free" }) }); }
    const org = await prisma.organization.create({ data: { name: stamp, slug: stamp, accessCode: stamp, members: { create: [{ userId: users[0]!.id, roles: ["OWNER"] }, { userId: users[1]!.id, roles: ["ENG_MANAGER"] }, { userId: users[2]!.id, roles: ["MEMBER"] }] } }, include: { members: true } }); orgId = org.id; memberId = org.members.find((m) => m.userId === users[2]!.id)!.id;
    const course = await prisma.course.create({ data: { orgId, title: stamp, status: "PUBLISHED", published: true, lessons: { create: { title: "Required", blocks: [] } } }, include: { lessons: true } }); lessonId = course.lessons[0]!.id;
    const path = await prisma.learningPath.create({ data: { orgId, title: stamp, published: true, items: { create: { courseId: course.id } } } });
    cohortId = (await prisma.cohort.create({ data: { orgId, pathId: path.id, name: stamp, startsAt: new Date() } })).id; base = `/orgs/${orgId}/cohorts/${cohortId}`;
  });
  afterAll(async () => { if (orgId) await prisma.organization.delete({ where: { id: orgId } }); for (const u of users) await prisma.user.delete({ where: { id: u.id } }); await app?.close(); });
  it("previews mixed rows without leaking users outside the visible scope; commits only eligible members", async () => {
    const csv = `email\n${users[2]!.email.toUpperCase()}\n${users[2]!.email}\n${users[3]!.email}\ninvalid`;
    const preview = await call(0, "POST", "/import", { csv }); expect(preview.statusCode).toBe(200); expect(preview.json().data.rows.map((r: { status: string }) => r.status)).toEqual(["ready", "duplicate", "unavailable", "invalid"]);
    expect((await call(0, "POST", "/import", { csv, commit: true, previewHash: "wrong" })).statusCode).toBe(409);
    const committed = await call(0, "POST", "/import", { csv, commit: true, previewHash: preview.json().data.previewHash }); expect(committed.json().data.enrolled).toBe(1);
    const again = await call(0, "POST", "/import", { csv }); expect(again.json().data.ready).toBe(0);
    expect((await call(0, "POST", "/enroll", { memberIds: [memberId] })).json().data.enrolled).toBe(0);
  });
  it("enforces role, tenant and department restrictions on imports, reports and follow-ups", async () => {
    for (const path of ["/funnel", "/export"]) { expect((await call(2, "GET", path)).statusCode).toBe(403); expect((await call(3, "GET", path)).statusCode).toBe(404); expect((await call(1, "GET", path)).statusCode).toBe(200); }
    expect((await call(1, "GET", "/funnel")).json().data.rows).toEqual([]);
    const row = (await call(0, "GET", "/funnel")).json().data.rows[0];
    expect((await call(1, "PATCH", `/follow-ups/${row.enrollmentId}`, { status: "OPEN", note: "Wrong scope", dueAt: null })).statusCode).toBe(404);
    expect((await call(1, "PATCH", "/drive", { driveTitle: "Drive", driveDeadline: null, minimumProgress: 0 })).statusCode).toBe(403);
    expect((await call(1, "POST", "/import", { csv: `email\n${users[2]!.email}` })).json().data.rows[0].status).toBe("unavailable");
  });
  it("computes eligibility from completed lessons at the actual deadline", async () => {
    await prisma.lessonProgress.create({ data: { userId: users[2]!.id, lessonId, completedAt: new Date() } });
    expect((await call(0, "GET", "/funnel")).json().data.rows[0].eligibility.eligible).toBe(true);
    expect((await call(0, "PATCH", "/drive", { driveTitle: "October drive", driveDeadline: new Date(Date.now() - 86_400_000).toISOString(), minimumProgress: 100 })).statusCode).toBe(200);
    const report = (await call(0, "GET", "/funnel")).json().data; expect(report.rows[0].progressPct).toBe(100); expect(report.rows[0].eligibility.eligible).toBe(false);
    expect((await call(0, "PATCH", "/drive", { driveTitle: null, driveDeadline: null, minimumProgress: 101 })).statusCode).toBe(400);
  });
  it("persists follow-ups, marks overdue items and neutralizes formulas in exports", async () => {
    const row = (await call(0, "GET", "/funnel")).json().data.rows[0];
    expect((await call(0, "PATCH", `/follow-ups/${row.enrollmentId}`, { status: "CONTACTED", note: "=HYPERLINK(1)", dueAt: new Date(Date.now() - 1000).toISOString() })).statusCode).toBe(200);
    expect((await call(0, "GET", "/funnel")).json().data.rows[0].followUp.overdue).toBe(true);
    const exported = await call(0, "GET", "/export"); expect(exported.headers["cache-control"]).toBe("private, no-store"); expect(exported.json().data.csv).toContain('"\'=SUM(1)"'); expect(exported.json().data.csv).toContain('"\'=HYPERLINK(1)"');
  });
});
