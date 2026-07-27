import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for the employer portal (`org.ts`) — 9 previously untested
 * write routes.
 *
 * This is the multi-tenant boundary, and it matters more than usual here because
 * the documented isolation layer (`orgDb()`, lib/org-scoped.ts) has ZERO call
 * sites in these handlers: every route hand-writes its own `where: { orgId }`
 * verify-then-act check. Hand-written scoping is correct today but is one
 * forgotten clause away from a cross-tenant leak, and nothing was pinning it.
 *
 * So the assertions below are deliberately adversarial: org A drives its own
 * token at org B's rows and must be told 404 — never 200, and never a mutation
 * that lands. Each negative also re-reads B's row to prove nothing changed.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("employer portal — tenant isolation + CRUD (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgAId = "", orgBId = "", userId = "";
  let tokenA = "", tokenB = "";
  let courseB = "", slotB = "";
  const s = Date.now();

  const hA = () => ({ authorization: `Bearer ${tokenA}`, "content-type": "application/json" });
  const hAnoBody = () => ({ authorization: `Bearer ${tokenA}` });

  const login = async (code: string) => {
    const res = await app.inject({
      method: "POST", url: "/v1/org/verify",
      headers: { "content-type": "application/json" }, payload: JSON.stringify({ code }),
    });
    expect(res.statusCode).toBe(200);
    return res.json().data.token as string;
  };

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [a, b, u] = await Promise.all([
      prisma.organization.create({ data: { name: "Org A", slug: `org-a-${s}`, accessCode: `code-a-${s}` } }),
      prisma.organization.create({ data: { name: "Org B", slug: `org-b-${s}`, accessCode: `code-b-${s}` } }),
      prisma.user.create({ data: { clerkId: `org_u_${s}`, email: `org-u-${s}@test.eyf`, name: "Student" } }),
    ]);
    orgAId = a.id; orgBId = b.id; userId = u.id;
    tokenA = await login(`code-a-${s}`);
    tokenB = await login(`code-b-${s}`);

    // Rows owned by B — the targets org A will be pointed at.
    const c = await prisma.course.create({ data: { orgId: orgBId, title: "B private course", description: "secret" } });
    courseB = c.id;
    const slot = await prisma.internshipSlot.create({ data: { orgId: orgBId, role: "B intern", seats: 2 } });
    slotB = slot.id;
  });

  afterAll(async () => {
    await prisma.lesson.deleteMany({ where: { course: { orgId: { in: [orgAId, orgBId] } } } }).catch(() => {});
    await prisma.course.deleteMany({ where: { orgId: { in: [orgAId, orgBId] } } }).catch(() => {});
    await prisma.internshipSlot.deleteMany({ where: { orgId: { in: [orgAId, orgBId] } } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: { in: [orgAId, orgBId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  // ── authentication ───────────────────────────────────────────────
  it("rejects an unknown access code", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/org/verify",
      headers: { "content-type": "application/json" }, payload: JSON.stringify({ code: `nope-${s}` }),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("INVALID_ORG_CODE");
  });

  it("refuses org routes with no token, and with a USER token", async () => {
    const anon = await app.inject({ method: "GET", url: "/v1/org/courses" });
    expect(anon.statusCode).toBe(401);
    expect(anon.json().error.code).toBe("ORG_UNAUTHORIZED");

    // A normal student session is signed with the same secret but is not an org
    // token — it must not be accepted here.
    const userToken = app.jwt.sign({ id: userId, email: "u@x", name: "U", role: "STUDENT_FREE", plan: "free" }, { expiresIn: "5m" });
    const asUser = await app.inject({ method: "GET", url: "/v1/org/courses", headers: { authorization: `Bearer ${userToken}` } });
    expect(asUser.statusCode).toBe(401);
    expect(asUser.json().error.code).toBe("ORG_UNAUTHORIZED");
  });

  // ── tenant isolation (the point of this file) ────────────────────
  it("scopes the course listing to the calling tenant — B sees its row, A does not", async () => {
    const a = await app.inject({ method: "GET", url: "/v1/org/courses", headers: hAnoBody() });
    expect(a.statusCode).toBe(200);
    expect(a.json().data.map((c: { id: string }) => c.id)).not.toContain(courseB);

    // The rightful owner CAN see it. Without this the 404s asserted below would
    // also pass against a route that is simply broken for everyone.
    const b = await app.inject({ method: "GET", url: "/v1/org/courses", headers: { authorization: `Bearer ${tokenB}` } });
    expect(b.statusCode).toBe(200);
    expect(b.json().data.map((c: { id: string }) => c.id)).toContain(courseB);
  });

  it("org A cannot PATCH org B's course — 404, and B's row is untouched", async () => {
    const res = await app.inject({
      method: "PATCH", url: `/v1/org/courses/${courseB}`, headers: hA(),
      payload: JSON.stringify({ title: "Hijacked by A", published: true }),
    });
    expect(res.statusCode).toBe(404);

    const row = await prisma.course.findUnique({ where: { id: courseB }, select: { title: true, published: true } });
    expect(row!.title).toBe("B private course");
    expect(row!.published).toBe(false);
  });

  it("org A cannot DELETE org B's course", async () => {
    const res = await app.inject({ method: "DELETE", url: `/v1/org/courses/${courseB}`, headers: hAnoBody() });
    expect(res.statusCode).toBe(404);
    expect(await prisma.course.count({ where: { id: courseB } })).toBe(1);
  });

  it("org A cannot inject a lesson into org B's course", async () => {
    const res = await app.inject({
      method: "POST", url: `/v1/org/courses/${courseB}/lessons`, headers: hA(),
      payload: JSON.stringify({ title: "A's lesson in B's course", content: "x" }),
    });
    expect(res.statusCode).toBe(404);
    expect(await prisma.lesson.count({ where: { courseId: courseB } })).toBe(0);
  });

  it("org A cannot DELETE org B's internship slot", async () => {
    const res = await app.inject({ method: "DELETE", url: `/v1/org/internships/${slotB}`, headers: hAnoBody() });
    expect(res.statusCode).toBe(404);
    expect(await prisma.internshipSlot.count({ where: { id: slotB } })).toBe(1);
  });

  // ── the happy path still works within a tenant ───────────────────
  it("org A can run the full course lifecycle on its own rows", async () => {
    const created = await app.inject({
      method: "POST", url: "/v1/org/courses", headers: hA(),
      payload: JSON.stringify({ title: "A's course" }),
    });
    expect(created.statusCode).toBe(200);
    const id = created.json().data.id;
    expect(created.json().data.orgId).toBe(orgAId); // ownership comes from the token, not the body

    const patched = await app.inject({
      method: "PATCH", url: `/v1/org/courses/${id}`, headers: hA(),
      payload: JSON.stringify({ published: true }),
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().data.published).toBe(true);

    // Lessons append with a monotonic orderIndex derived from the existing count.
    for (const [i, title] of ["Lesson one", "Lesson two"].entries()) {
      const l = await app.inject({
        method: "POST", url: `/v1/org/courses/${id}/lessons`, headers: hA(),
        payload: JSON.stringify({ title }),
      });
      expect(l.statusCode).toBe(200);
      expect(l.json().data.orderIndex).toBe(i);
    }

    const del = await app.inject({ method: "DELETE", url: `/v1/org/courses/${id}`, headers: hAnoBody() });
    expect(del.statusCode).toBe(200);
    expect(await prisma.course.count({ where: { id } })).toBe(0);
  });

  it("a created internship slot is stamped with the caller's org, not a body-supplied one", async () => {
    const res = await app.inject({
      method: "POST", url: "/v1/org/internships", headers: hA(),
      payload: JSON.stringify({ role: "A intern", seats: 3, orgId: orgBId }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.orgId).toBe(orgAId); // the orgId in the body is ignored
  });
});
