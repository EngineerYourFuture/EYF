import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { orgDb } from "./org-scoped.js";

/**
 * Exercises the tenant-scoping repository — every orgDb method injects the orgId
 * so a forgotten `where` can't leak another tenant's rows. Seeds one org and
 * calls each scoped method against the real DB.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("orgDb — tenant-scoped repository", () => {
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgId: string;
  let userId: string;
  let memberId: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    const stamp = Date.now();
    const org = await prisma.organization.create({
      data: { name: "OrgScoped Co", slug: `os-${stamp}`, accessCode: `OSAC-${stamp}` },
    });
    orgId = org.id;
    const u = await prisma.user.create({ data: { clerkId: `os_${stamp}`, email: `os-${stamp}@test.eyf`, name: "OS" } });
    userId = u.id;
    const m = await prisma.orgMember.create({ data: { orgId, userId } });
    memberId = m.id;
  });

  afterAll(async () => {
    if (!orgId) return;
    await prisma.orgInvite.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.team.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.department.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.orgMember.deleteMany({ where: { orgId } }).catch(() => {});
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it("scopes member reads and updates to the org", async () => {
    const db = orgDb(orgId);
    expect(await db.member.count()).toBe(1);
    expect(await db.member.count({ where: { userId } })).toBe(1);
    expect(await db.member.findMany({})).toHaveLength(1);
    expect(await db.member.findFirst({ where: { userId } })).not.toBeNull();

    const updated = await db.member.updateScoped(memberId, { title: "Lead" });
    expect(updated?.title).toBe("Lead");
    // an id outside the org is a no-op
    expect(await db.member.updateScoped("does-not-exist", { title: "x" })).toBeNull();
  });

  it("scopes department create / read / delete", async () => {
    const db = orgDb(orgId);
    const dept = await db.department.create({ name: "Engineering" });
    expect(dept.orgId).toBe(orgId);
    expect((await db.department.findMany()).length).toBeGreaterThanOrEqual(1);
    expect(await db.department.findFirst({ where: { name: "Engineering" } })).not.toBeNull();
    expect(await db.department.deleteScoped(dept.id)).not.toBeNull();
    expect(await db.department.deleteScoped("does-not-exist")).toBeNull();
  });

  it("scopes team and invite creation + reads", async () => {
    const db = orgDb(orgId);
    const team = await db.team.create({ name: "Platform" });
    expect(team.orgId).toBe(orgId);
    expect((await db.team.findMany()).length).toBeGreaterThanOrEqual(1);
    expect(await db.team.findFirst({ where: { name: "Platform" } })).not.toBeNull();

    const invite = await db.invite.create({
      email: "invitee@test.eyf", token: `tok-${Date.now()}`, invitedById: userId,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    expect(invite.orgId).toBe(orgId);
    expect((await db.invite.findMany()).length).toBeGreaterThanOrEqual(1);
  });
});
