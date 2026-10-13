import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { OrgRole, Role } from "@eyf/db";

describe.skipIf(!process.env.DATABASE_URL)("private LMS account and privilege boundaries", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = `access-${Date.now()}`;
  const users: { id: string; email: string; token: string; gate: string }[] = [];
  const orgIds: string[] = [];
  const call = (who: number, method: "GET" | "POST" | "PATCH", path: string, payload?: object) => app.inject({ method, url: `/v1${path}`, headers: { authorization: `Bearer ${users[who]!.token}`, "x-admin-gate": users[who]!.gate }, ...(payload ? { payload } : {}) });
  async function organization(roles: [number, OrgRole][], seats = 10) {
    const id = `${stamp}-${orgIds.length}`;
    const org = await prisma.organization.create({ data: { name: id, slug: id, accessCode: id, seatsLicensed: seats, members: { create: roles.map(([who, role]) => ({ userId: users[who]!.id, roles: [role] })) } } });
    orgIds.push(org.id); return org.id;
  }
  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp(); await app.ready();
    for (let i = 0; i < 7; i++) {
      const role: Role = i === 0 ? "ADMIN" : "STUDENT_FREE";
      const u = await prisma.user.create({ data: { clerkId: `${stamp}-${i}`, email: `${stamp}-${i}@test.eyf`, name: `Access ${i}`, role } });
      users.push({ ...u, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role, plan: "free" }), gate: app.jwt.sign({ id: u.id, adminGate: true }) });
    }
  });
  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await prisma.usageCounter.deleteMany({ where: { orgId: { in: orgIds } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    await app?.close();
  });

  it("only a platform admin provisions workspaces, without gaining customer membership", async () => {
    const body = { name: stamp, ownerEmail: users[1]!.email, seatsLicensed: 5 };
    expect((await call(1, "POST", "/orgs", body)).statusCode).toBe(403);
    const created = await call(0, "POST", "/orgs", body); expect(created.statusCode).toBe(201);
    const id = created.json().data.id; orgIds.push(id);
    expect((await call(1, "GET", `/orgs/${id}`)).statusCode).toBe(200);
    expect((await call(0, "GET", `/orgs/${id}/members`)).statusCode).toBe(404);
    expect((await call(1, "GET", "/admin/users")).statusCode).toBe(403);
    expect((await call(1, "PATCH", `/admin/organizations/${id}/seats`, { seatsLicensed: 500 })).statusCode).toBe(403);
    expect((await call(0, "PATCH", `/admin/organizations/${id}/seats`, { seatsLicensed: 8 })).statusCode).toBe(200);
  });

  it("does not trust stale roles, suspended accounts, or admin-gate tokens as sessions", async () => {
    expect((await call(0, "GET", "/admin/users")).statusCode).toBe(200);
    await prisma.user.update({ where: { id: users[0]!.id }, data: { role: "STUDENT_FREE" } });
    expect((await call(0, "GET", "/admin/users")).statusCode).toBe(403);
    await prisma.user.update({ where: { id: users[0]!.id }, data: { role: "ADMIN", deletedAt: new Date() } });
    expect((await call(0, "GET", "/admin/users")).statusCode).toBe(401);
    await prisma.user.update({ where: { id: users[0]!.id }, data: { deletedAt: null } });
    expect((await app.inject({ method: "GET", url: "/v1/me", headers: { authorization: `Bearer ${users[0]!.gate}` } })).statusCode).toBe(401);
  });

  it("HR cannot mint staff powers, and suspended learners cannot use any course alias", async () => {
    const id = await organization([[1, "OWNER"], [2, "HR"], [3, "MEMBER"]]);
    for (const role of ["OWNER", "ADMIN", "LND", "INSTRUCTOR", "REVIEWER", "HR"]) {
      expect((await call(2, "POST", `/orgs/${id}/invites`, { email: users[4]!.email, roles: [role] })).statusCode).toBe(403);
    }
    const course = await prisma.course.create({ data: { orgId: id, title: "Confidential", audience: "BOTH", published: true, status: "PUBLISHED", lessons: { create: { title: "Private text", content: "Secret", orderIndex: 0 } } }, include: { lessons: true } });
    expect((await call(4, "GET", `/org/courses/${course.id}/learn`)).statusCode).toBe(404);
    const allowed = await call(3, "GET", `/orgs/${id}/work/courses/${course.id}`);
    expect(allowed.statusCode).toBe(200); expect(allowed.headers["cache-control"]).toBe("private, no-store");
    await prisma.orgMember.update({ where: { orgId_userId: { orgId: id, userId: users[3]!.id } }, data: { status: "SUSPENDED" } });
    for (const path of [`/orgs/${id}/work/courses/${course.id}`, `/org/courses/${course.id}/learn`]) expect((await call(3, "GET", path)).statusCode).toBe(404);
    expect((await call(3, "POST", `/org/lessons/${course.lessons[0]!.id}/complete`)).statusCode).toBe(404);
    expect((await call(3, "POST", `/org/courses/${course.id}/enroll`)).statusCode).toBe(404);
    expect((await call(3, "GET", "/org/catalog")).json().data).not.toContainEqual(expect.objectContaining({ id: course.id }));
    const inv = await call(1, "POST", `/orgs/${id}/invites`, { email: users[3]!.email });
    expect((await call(3, "POST", "/orgs/invites/accept", { token: inv.json().data.token })).statusCode).toBe(403);
  });

  it("concurrent invitation acceptance cannot exceed the license; reactivation checks it too", async () => {
    const id = await organization([[1, "OWNER"]], 2);
    const invites = await Promise.all([4, 5].map((who) => call(1, "POST", `/orgs/${id}/invites`, { email: users[who]!.email })));
    const accepted = await Promise.all(invites.map((r, i) => call(i + 4, "POST", "/orgs/invites/accept", { token: r.json().data.token })));
    expect(accepted.map((r) => r.statusCode).sort()).toEqual([200, 402]);
    expect(await prisma.orgMember.count({ where: { orgId: id, status: "ACTIVE" } })).toBe(2);
    const m = await prisma.orgMember.create({ data: { orgId: id, userId: users[6]!.id, roles: ["MEMBER"], status: "SUSPENDED" } });
    expect((await call(1, "PATCH", `/orgs/${id}/members/${m.id}`, { status: "ACTIVE" })).statusCode).toBe(402);
    expect((await call(0, "PATCH", `/admin/organizations/${id}/seats`, { seatsLicensed: 1 })).statusCode).toBe(409);
  });

  it("concurrent owner demotions preserve one active owner", async () => {
    const id = await organization([[1, "OWNER"], [2, "OWNER"]]);
    const members = await prisma.orgMember.findMany({ where: { orgId: id } });
    const results = await Promise.all(members.map((m) => call(m.userId === users[1]!.id ? 1 : 2, "PATCH", `/orgs/${id}/members/${m.id}`, { roles: ["MEMBER"] })));
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 400]);
    expect(await prisma.orgMember.count({ where: { orgId: id, status: "ACTIVE", roles: { has: "OWNER" } } })).toBe(1);
  });

  it("an invitation loses authority if the inviter loses the right to grant its roles", async () => {
    const id = await organization([[1, "OWNER"], [2, "ADMIN"]]);
    const inv = await call(2, "POST", `/orgs/${id}/invites`, { email: users[6]!.email, roles: ["INSTRUCTOR"] });
    await prisma.orgMember.update({ where: { orgId_userId: { orgId: id, userId: users[2]!.id } }, data: { roles: ["MEMBER"] } });
    expect((await call(6, "POST", "/orgs/invites/accept", { token: inv.json().data.token })).statusCode).toBe(403);
    expect(await prisma.orgMember.count({ where: { orgId: id } })).toBe(2);
  });
});
