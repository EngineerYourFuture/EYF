import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildOrgClaims } from "../lib/org-token.js";

describe.skipIf(!process.env.DATABASE_URL)("legacy management aliases cannot bypass membership roles", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgId: string, token: string, courseId: string, slotId: string;
  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp();
    const slug = `retired-crud-${Date.now()}`;
    const org = await prisma.organization.create({ data: { name: slug, slug, accessCode: slug } }); orgId = org.id;
    token = app.jwt.sign(buildOrgClaims(org));
    courseId = (await prisma.course.create({ data: { orgId, title: "Private course" } })).id;
    slotId = (await prisma.internshipSlot.create({ data: { orgId, role: "Private slot" } })).id;
  });
  afterAll(async () => { if (orgId) await prisma.organization.delete({ where: { id: orgId } }); await app?.close(); });
  it("denies every old management read and mutation, including the token's own tenant", async () => {
    const cases = [
      ["GET", "/courses"], ["POST", "/courses"], ["PATCH", `/courses/${courseId}`], ["DELETE", `/courses/${courseId}`],
      ["POST", `/courses/${courseId}/lessons`], ["GET", `/courses/${courseId}/enrollments`],
      ["GET", "/internships"], ["POST", "/internships"], ["DELETE", `/internships/${slotId}`],
    ] as const;
    for (const [method, path] of cases) {
      const res = await app.inject({ method, url: `/v1/org${path}`, headers: { authorization: `Bearer ${token}` }, ...(["POST", "PATCH"].includes(method) ? { payload: { title: "Bypass", published: true, role: "Bypass" } } : {}) });
      expect(res.statusCode, `${method} ${path}`).toBe(410);
    }
    expect((await prisma.course.findUniqueOrThrow({ where: { id: courseId } })).title).toBe("Private course");
    expect(await prisma.lesson.count({ where: { courseId } })).toBe(0);
    expect(await prisma.internshipSlot.count({ where: { orgId } })).toBe(1);
  });
});
