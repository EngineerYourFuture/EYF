/**
 * orgScoped — the tenant-isolation repository layer (PRD §25, layer 1 of 3).
 *
 * CODE-REVIEW RULE: org-scoped tables (OrgMember, Department, Team, OrgInvite,
 * Course, InternshipSlot, UsageCounter, …) are NEVER queried with bare
 * `prisma.x` inside org request handlers — always through `orgDb(orgId)`,
 * which injects the orgId filter into every call so a forgotten `where`
 * cannot leak another tenant's rows. Layer 2 is the Postgres RLS backstop
 * (packages/db/scripts/apply-rls.sql via `withOrgContext`); layer 3 is the
 * cross-tenant integration suite (orgs.integration.test.ts).
 */
import { prisma, Prisma } from "@eyf/db";

export function orgDb(orgId: string) {
  return {
    member: {
      findMany: (args: Omit<Prisma.OrgMemberFindManyArgs, "where"> & { where?: Omit<Prisma.OrgMemberWhereInput, "orgId"> }) =>
        prisma.orgMember.findMany({ ...args, where: { ...args.where, orgId } }),
      findFirst: (args: Omit<Prisma.OrgMemberFindFirstArgs, "where"> & { where?: Omit<Prisma.OrgMemberWhereInput, "orgId"> }) =>
        prisma.orgMember.findFirst({ ...args, where: { ...args.where, orgId } }),
      count: (args?: { where?: Omit<Prisma.OrgMemberWhereInput, "orgId"> }) =>
        prisma.orgMember.count({ where: { ...args?.where, orgId } }),
      // update goes through findFirst-then-update so the orgId check is
      // structural, not left to the caller's where clause.
      updateScoped: async (id: string, data: Prisma.OrgMemberUpdateInput) => {
        const row = await prisma.orgMember.findFirst({ where: { id, orgId }, select: { id: true } });
        if (!row) return null;
        return prisma.orgMember.update({ where: { id }, data });
      },
    },
    department: {
      findMany: (args?: Omit<Prisma.DepartmentFindManyArgs, "where"> & { where?: Omit<Prisma.DepartmentWhereInput, "orgId"> }) =>
        prisma.department.findMany({ ...args, where: { ...args?.where, orgId } }),
      findFirst: (args: Omit<Prisma.DepartmentFindFirstArgs, "where"> & { where?: Omit<Prisma.DepartmentWhereInput, "orgId"> }) =>
        prisma.department.findFirst({ ...args, where: { ...args.where, orgId } }),
      create: (data: Omit<Prisma.DepartmentUncheckedCreateInput, "orgId">) =>
        prisma.department.create({ data: { ...data, orgId } }),
      deleteScoped: async (id: string) => {
        const row = await prisma.department.findFirst({ where: { id, orgId }, select: { id: true } });
        if (!row) return null;
        return prisma.department.delete({ where: { id } });
      },
    },
    team: {
      findMany: (args?: Omit<Prisma.TeamFindManyArgs, "where"> & { where?: Omit<Prisma.TeamWhereInput, "orgId"> }) =>
        prisma.team.findMany({ ...args, where: { ...args?.where, orgId } }),
      findFirst: (args: Omit<Prisma.TeamFindFirstArgs, "where"> & { where?: Omit<Prisma.TeamWhereInput, "orgId"> }) =>
        prisma.team.findFirst({ ...args, where: { ...args.where, orgId } }),
      create: (data: Omit<Prisma.TeamUncheckedCreateInput, "orgId">) =>
        prisma.team.create({ data: { ...data, orgId } }),
    },
    invite: {
      create: (data: Omit<Prisma.OrgInviteUncheckedCreateInput, "orgId">) =>
        prisma.orgInvite.create({ data: { ...data, orgId } }),
      findMany: (args?: Omit<Prisma.OrgInviteFindManyArgs, "where"> & { where?: Omit<Prisma.OrgInviteWhereInput, "orgId"> }) =>
        prisma.orgInvite.findMany({ ...args, where: { ...args?.where, orgId } }),
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
