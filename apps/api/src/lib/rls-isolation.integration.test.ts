import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { orgDb, withOrgContext } from "./org-scoped.js";

/**
 * Proves the Postgres RLS backstop (layer 2) actually BLOCKS cross-tenant reads —
 * not just that the app-level `where orgId` filter does. Seeds two orgs, then
 * shows that inside `withOrgContext(A)` a query which omits or wrongly targets
 * org B's rows still returns nothing, because the `org_isolation` policy filters
 * on `app.org_id`. The contrast cases (no context = escape-hatch passes all)
 * prove RLS — not some other filter — is what does the blocking.
 *
 * Requires: DATABASE_URL, RLS applied (`pnpm --filter @eyf/db db:rls`), and a
 * NON-superuser DB role (superusers bypass RLS). Skips without a DB.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("RLS tenant isolation (layer 2)", () => {
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let orgA: string;
  let orgB: string;
  let userA: string;
  let userB: string;
  let memberB: string;

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    const s = Date.now();
    const [a, b] = await Promise.all([
      prisma.organization.create({ data: { name: "RLS A", slug: `rls-a-${s}`, accessCode: `RLSA-${s}` } }),
      prisma.organization.create({ data: { name: "RLS B", slug: `rls-b-${s}`, accessCode: `RLSB-${s}` } }),
    ]);
    orgA = a.id;
    orgB = b.id;
    const [ua, ub] = await Promise.all([
      prisma.user.create({ data: { clerkId: `rls_a_${s}`, email: `rls-a-${s}@test.eyf`, name: "A" } }),
      prisma.user.create({ data: { clerkId: `rls_b_${s}`, email: `rls-b-${s}@test.eyf`, name: "B" } }),
    ]);
    userA = ua.id;
    userB = ub.id;
    await prisma.orgMember.create({ data: { orgId: orgA, userId: userA } });
    memberB = (await prisma.orgMember.create({ data: { orgId: orgB, userId: userB } })).id;
  });

  afterAll(async () => {
    if (!orgA) return;
    await prisma.orgMember.deleteMany({ where: { orgId: { in: [orgA, orgB] } } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } }).catch(() => {});
  });

  it("blocks a wrong-tenant read by id inside the org context (the backstop)", async () => {
    // Query org B's member by its exact id while in org A's context. A forgotten
    // orgId filter like this is exactly what RLS exists to catch.
    const leaked = await withOrgContext(orgA, (tx) =>
      tx.orgMember.findFirst({ where: { id: memberB } }),
    );
    expect(leaked).toBeNull();
  });

  it("returns ONLY the context org's rows even with no where filter", async () => {
    const rows = await withOrgContext(orgA, (tx) => tx.orgMember.findMany({}));
    expect(rows.length).toBeGreaterThan(0);
    // Every row RLS let through belongs to org A — none of org B leaked.
    expect(rows.every((r) => r.orgId === orgA)).toBe(true);
    expect(rows.some((r) => r.id === memberB)).toBe(false);
  });

  it("proves it is RLS doing the blocking: with NO context the same row IS visible", async () => {
    // Escape-hatch: app.org_id unset → the policy passes everything. If this
    // returned null too, the previous test would be meaningless.
    const visible = await prisma.orgMember.findFirst({ where: { id: memberB } });
    expect(visible?.id).toBe(memberB);
  });

  it("orgDb() gives both layers: a cross-tenant lookup returns nothing", async () => {
    // orgDb(A) injects the filter AND sets the RLS context. Asking A's repo for
    // B's member id returns null on both counts.
    const viaRepo = await orgDb(orgA).member.findFirst({ where: { userId: userB } });
    expect(viaRepo).toBeNull();
    const onlyA = await orgDb(orgA).member.findMany({});
    expect(onlyA.every((r) => r.orgId === orgA)).toBe(true);
  });
});
