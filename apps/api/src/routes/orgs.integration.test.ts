import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Tenant-isolation integration tests (PRD §25 — the CI-blocking cross-tenant
 * guarantee, EPIC-02). Two orgs, two owners: every attempt by org B's owner to
 * read or mutate org A through the org routes must come back 404 (never data,
 * never 403-that-confirms-existence). Also covers the role-grant hierarchy and
 * the invite email binding. Skips cleanly without DATABASE_URL.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("org tenant isolation (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let userA: { id: string; token: string };
  let userB: { id: string; token: string };
  let orgA: string;
  let orgB: string;
  let orgAMemberId: string;

  const inject = (token: string, method: "GET" | "POST" | "PATCH" | "DELETE", url: string, body?: object) =>
    app.inject({
      method,
      url,
      headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      ...(body ? { payload: JSON.stringify(body) } : {}),
    });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();

    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({
        data: { clerkId: `org_int_${tag}_${stamp}`, email: `org-int-${tag}-${stamp}@test.eyf`, name: `Org ${tag}` },
      });
      // No `sid` claim: sid-carrying tokens are validated against UserSession
      // (account-sharing cap); a bare token skips that check for tests.
      const token = app.jwt.sign(
        { id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" },
        { expiresIn: "10m" },
      );
      return { id: u.id, token };
    };
    userA = await mkUser("a");
    userB = await mkUser("b");

    const resA = await inject(userA.token, "POST", "/v1/orgs", { name: `TenantTest A ${stamp}` });
    const resB = await inject(userB.token, "POST", "/v1/orgs", { name: `TenantTest B ${stamp}` });
    expect(resA.statusCode).toBe(201);
    expect(resB.statusCode).toBe(201);
    orgA = resA.json().data.id;
    orgB = resB.json().data.id;

    const m = await prisma.orgMember.findUniqueOrThrow({
      where: { orgId_userId: { orgId: orgA, userId: userA.id } },
      select: { id: true },
    });
    orgAMemberId = m.id;
  });

  afterAll(async () => {
    for (const orgId of [orgA, orgB].filter(Boolean)) {
      await prisma.usageCounter.deleteMany({ where: { orgId } }).catch(() => {});
      await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    }
    for (const u of [userA, userB].filter(Boolean)) {
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await app?.close();
  });

  it("creator becomes OWNER and can read their own org", async () => {
    const res = await inject(userA.token, "GET", `/v1/orgs/${orgA}`);
    expect(res.statusCode).toBe(200);
    expect(res.json().data._count.members).toBe(1);
  });

  it("cross-tenant reads are 404, not 403 — existence is not confirmed", async () => {
    for (const url of [
      `/v1/orgs/${orgA}`,
      `/v1/orgs/${orgA}/members`,
      `/v1/orgs/${orgA}/departments`,
      `/v1/orgs/${orgA}/teams`,
    ]) {
      const res = await inject(userB.token, "GET", url);
      expect(res.statusCode, url).toBe(404);
    }
  });

  it("cross-tenant mutations are 404 too", async () => {
    const create = await inject(userB.token, "POST", `/v1/orgs/${orgA}/departments`, { name: "Infil" });
    expect(create.statusCode).toBe(404);
    const patch = await inject(userB.token, "PATCH", `/v1/orgs/${orgA}/members/${orgAMemberId}`, { roles: ["ADMIN"] });
    expect(patch.statusCode).toBe(404);
    // And nothing leaked in:
    const depts = await prisma.department.count({ where: { orgId: orgA } });
    expect(depts).toBe(0);
  });

  it("invite binds to email: another user cannot accept it", async () => {
    const inv = await inject(userA.token, "POST", `/v1/orgs/${orgA}/invites`, {
      email: `someone-else-${stamp}@test.eyf`,
      roles: ["MEMBER"],
    });
    expect(inv.statusCode).toBe(201);
    const accept = await inject(userB.token, "POST", "/v1/orgs/invites/accept", { token: inv.json().data.token });
    expect(accept.statusCode).toBe(403);
    expect(accept.json().error.code).toBe("INVITE_EMAIL_MISMATCH");
  });

  it("invite for the right email joins the org with the invited roles", async () => {
    const inv = await inject(userA.token, "POST", `/v1/orgs/${orgA}/invites`, {
      email: `org-int-b-${stamp}@test.eyf`,
      roles: ["INSTRUCTOR"],
    });
    const accept = await inject(userB.token, "POST", "/v1/orgs/invites/accept", { token: inv.json().data.token });
    expect(accept.statusCode).toBe(200);
    expect(accept.json().data.roles).toEqual(["INSTRUCTOR"]);
    // Instructor may author, but org:members surfaces stay closed:
    const members = await inject(userB.token, "GET", `/v1/orgs/${orgA}/members`);
    expect(members.statusCode).toBe(403);
  });

  it("role-grant hierarchy: HR-level grant path refuses ADMIN escalation by non-owner", async () => {
    // userB (INSTRUCTOR in orgA) has no org:members at all → 403 above covers reach.
    // Now verify the ceremony: even the OWNER's HR can't mint an ADMIN — simulate by
    // giving userB HR, then having userB try to self-escalate to ADMIN.
    await prisma.orgMember.update({
      where: { orgId_userId: { orgId: orgA, userId: userB.id } },
      data: { roles: ["HR"] },
    });
    const self = await prisma.orgMember.findUniqueOrThrow({
      where: { orgId_userId: { orgId: orgA, userId: userB.id } },
      select: { id: true },
    });
    const escalate = await inject(userB.token, "PATCH", `/v1/orgs/${orgA}/members/${self.id}`, { roles: ["ADMIN"] });
    expect(escalate.statusCode).toBe(403);
    const lastOwner = await inject(userA.token, "PATCH", `/v1/orgs/${orgA}/members/${orgAMemberId}`, { roles: ["MEMBER"] });
    expect(lastOwner.statusCode).toBe(400);
    expect(lastOwner.json().error.code).toBe("LAST_OWNER");
  });

  it("seat cap returns 402 when licensed seats are exhausted", async () => {
    await prisma.organization.update({ where: { id: orgA }, data: { seatsLicensed: 2 } }); // A + B occupy both
    const inv = await inject(userA.token, "POST", `/v1/orgs/${orgA}/invites`, { email: `third-${stamp}@test.eyf` });
    expect(inv.statusCode).toBe(402);
    expect(inv.json().error.code).toBe("SEATS_EXHAUSTED");
  });

  it("RLS backstop: an UNFILTERED query inside org A's context cannot see org B", async () => {
    // Simulates the bug class the backstop exists for — application code that
    // forgot the orgId filter entirely. Requires apply-rls.ts policies.
    //
    // Postgres SKIPS RLS for superuser / BYPASSRLS roles. The local + CI dev
    // container connects as the superuser `eyf`, so a naive query here would see
    // both tenants and the test would be a false negative. To exercise the
    // policy for real regardless of the session role, when the current role
    // bypasses RLS we run the unfiltered query under a throwaway non-superuser
    // role via `SET LOCAL ROLE` (RLS is evaluated against the *effective* role).
    // A properly-configured production role (non-superuser) takes the direct
    // withOrgContext path — the real runtime behaviour.
    const roleRows = await prisma.$queryRawUnsafe<{ bypasses: boolean }[]>(
      `SELECT COALESCE(rolsuper OR rolbypassrls, false) AS bypasses
         FROM pg_roles WHERE rolname = current_user`,
    );
    const bypasses = roleRows[0]?.bypasses ?? false;

    let leaked: { orgId: string }[];
    if (bypasses) {
      const PROBE = "eyf_rls_test_probe";
      await prisma.$executeRawUnsafe(`DROP ROLE IF EXISTS ${PROBE}`);
      await prisma.$executeRawUnsafe(`CREATE ROLE ${PROBE} NOSUPERUSER`);
      await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${PROBE}`);
      await prisma.$executeRawUnsafe(`GRANT SELECT ON org_members TO ${PROBE}`);
      try {
        leaked = await prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE ${PROBE}`);
          await tx.$executeRawUnsafe(`SET LOCAL app.org_id = '${orgA}'`);
          return tx.$queryRawUnsafe<{ orgId: string }[]>(
            `SELECT "orgId" FROM org_members`, // deliberately no where!
          );
        });
      } finally {
        await prisma.$executeRawUnsafe(`REVOKE ALL ON org_members FROM ${PROBE}`);
        await prisma.$executeRawUnsafe(`REVOKE USAGE ON SCHEMA public FROM ${PROBE}`);
        await prisma.$executeRawUnsafe(`DROP ROLE IF EXISTS ${PROBE}`);
      }
    } else {
      const { withOrgContext } = await import("../lib/org-scoped.js");
      leaked = await withOrgContext(orgA, (tx) =>
        tx.orgMember.findMany({ select: { orgId: true } }), // deliberately no where!
      );
    }

    expect(leaked.length).toBeGreaterThan(0); // org A's own rows visible
    expect(leaked.every((m) => m.orgId === orgA)).toBe(true); // org B invisible
  });

  it("RLS is a tripwire, not a wall: no-context queries still see everything (workers/admin)", async () => {
    const all = await prisma.orgMember.findMany({
      where: { orgId: { in: [orgA, orgB] } },
      select: { orgId: true },
    });
    expect(new Set(all.map((m) => m.orgId)).size).toBe(2);
  });

  it("usage metering: invites bump the counter; /usage reports seats + counters", async () => {
    const { currentPeriod } = await import("../lib/usage.js");
    const counter = await prisma.usageCounter.findUnique({
      where: { orgId_metric_period: { orgId: orgA, metric: "invites_sent", period: currentPeriod() } },
    });
    expect(counter?.value).toBeGreaterThanOrEqual(2); // two successful invites above
    const res = await inject(userA.token, "GET", `/v1/orgs/${orgA}/usage`);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.seats).toEqual({ used: 2, licensed: 2 });
    expect(res.json().data.counters.invites_sent).toBeGreaterThanOrEqual(2);
    // org:billing is OWNER-only — HR-role userB is refused:
    const denied = await inject(userB.token, "GET", `/v1/orgs/${orgA}/usage`);
    expect(denied.statusCode).toBe(403);
  });
});
