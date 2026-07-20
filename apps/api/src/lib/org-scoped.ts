/**
 * orgScoped — the tenant-isolation repository layer (PRD §25).
 *
 * CODE-REVIEW RULE: org-scoped tables (OrgMember, Department, Team, OrgInvite,
 * Course, InternshipSlot, UsageCounter, …) are NEVER queried with bare
 * `prisma.x` inside org request handlers — always through `orgDb(orgId)`.
 *
 * `orgDb` now provides BOTH isolation layers on every call:
 *   layer 1 — injects the `orgId` filter so a forgotten `where` can't leak.
 *   layer 2 — runs the query inside `withOrgContext` (a transaction with
 *             `SET LOCAL app.org_id`), so the Postgres RLS `org_isolation`
 *             policy actively blocks any row from another tenant even if the
 *             filter is wrong. Before, orgDb was filter-only and RLS stayed
 *             dormant (app.org_id never set) — the backstop wasn't live.
 * Layer 3 is the cross-tenant integration suite (org-scoped.integration.test.ts).
 *
 * Cost: each call is its own short transaction (BEGIN/SET LOCAL/…/COMMIT). Org
 * admin surfaces are low-QPS, so correctness wins over the extra round-trips.
 */
import { prisma, Prisma } from "@eyf/db";

export function orgDb(orgId: string) {
  return {
    member: {
      findMany: (args: Omit<Prisma.OrgMemberFindManyArgs, "where"> & { where?: Omit<Prisma.OrgMemberWhereInput, "orgId"> }) =>
        withOrgContext(orgId, (tx) => tx.orgMember.findMany({ ...args, where: { ...args.where, orgId } })),
      findFirst: (args: Omit<Prisma.OrgMemberFindFirstArgs, "where"> & { where?: Omit<Prisma.OrgMemberWhereInput, "orgId"> }) =>
        withOrgContext(orgId, (tx) => tx.orgMember.findFirst({ ...args, where: { ...args.where, orgId } })),
      count: (args?: { where?: Omit<Prisma.OrgMemberWhereInput, "orgId"> }) =>
        withOrgContext(orgId, (tx) => tx.orgMember.count({ where: { ...args?.where, orgId } })),
      // update goes through findFirst-then-update (one transaction) so the orgId
      // check is structural, not left to the caller's where clause.
      updateScoped: (id: string, data: Prisma.OrgMemberUpdateInput) =>
        withOrgContext(orgId, async (tx) => {
          const row = await tx.orgMember.findFirst({ where: { id, orgId }, select: { id: true } });
          if (!row) return null;
          return tx.orgMember.update({ where: { id }, data });
        }),
    },
    department: {
      findMany: (args?: Omit<Prisma.DepartmentFindManyArgs, "where"> & { where?: Omit<Prisma.DepartmentWhereInput, "orgId"> }) =>
        withOrgContext(orgId, (tx) => tx.department.findMany({ ...args, where: { ...args?.where, orgId } })),
      findFirst: (args: Omit<Prisma.DepartmentFindFirstArgs, "where"> & { where?: Omit<Prisma.DepartmentWhereInput, "orgId"> }) =>
        withOrgContext(orgId, (tx) => tx.department.findFirst({ ...args, where: { ...args.where, orgId } })),
      create: (data: Omit<Prisma.DepartmentUncheckedCreateInput, "orgId">) =>
        withOrgContext(orgId, (tx) => tx.department.create({ data: { ...data, orgId } })),
      deleteScoped: (id: string) =>
        withOrgContext(orgId, async (tx) => {
          const row = await tx.department.findFirst({ where: { id, orgId }, select: { id: true } });
          if (!row) return null;
          return tx.department.delete({ where: { id } });
        }),
    },
    team: {
      findMany: (args?: Omit<Prisma.TeamFindManyArgs, "where"> & { where?: Omit<Prisma.TeamWhereInput, "orgId"> }) =>
        withOrgContext(orgId, (tx) => tx.team.findMany({ ...args, where: { ...args?.where, orgId } })),
      findFirst: (args: Omit<Prisma.TeamFindFirstArgs, "where"> & { where?: Omit<Prisma.TeamWhereInput, "orgId"> }) =>
        withOrgContext(orgId, (tx) => tx.team.findFirst({ ...args, where: { ...args.where, orgId } })),
      create: (data: Omit<Prisma.TeamUncheckedCreateInput, "orgId">) =>
        withOrgContext(orgId, (tx) => tx.team.create({ data: { ...data, orgId } })),
    },
    invite: {
      create: (data: Omit<Prisma.OrgInviteUncheckedCreateInput, "orgId">) =>
        withOrgContext(orgId, (tx) => tx.orgInvite.create({ data: { ...data, orgId } })),
      findMany: (args?: Omit<Prisma.OrgInviteFindManyArgs, "where"> & { where?: Omit<Prisma.OrgInviteWhereInput, "orgId"> }) =>
        withOrgContext(orgId, (tx) => tx.orgInvite.findMany({ ...args, where: { ...args?.where, orgId } })),
    },
  };
}

/**
 * RLS backstop context (layer 2). Runs `fn` inside a transaction with
 * `app.org_id` set, so the escape-hatch policies in apply-rls.sql actively
 * filter any query that slipped past orgDb. Use for the highest-risk reads
 * (member/people/talent surfaces). SET LOCAL scopes to the transaction, so
 * pooled connections stay clean.
 */
export async function withOrgContext<T>(orgId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // cuids are [a-z0-9]; guard anyway — GUC values can't be parameterized.
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(orgId)) throw new Error("invalid orgId");
    await tx.$executeRawUnsafe(`SET LOCAL app.org_id = '${orgId}'`);
    return fn(tx);
  });
}
