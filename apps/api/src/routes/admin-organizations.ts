import type { FastifyInstance } from "fastify";
import { prisma } from "@eyf/db";
import { z } from "zod";
import { requirePermission } from "../middleware/permissions.js";
import { accountError, lockOrganization } from "../lib/org-accounts.js";
import { recordAudit } from "../lib/audit.js";

export async function adminOrganizationsRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireAuth, requirePermission("manage:users")] };
  app.get("/", guard, async (req) => {
    const { q } = z.object({ q: z.string().trim().max(120).default("") }).parse(req.query);
    const orgs = await prisma.organization.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {}, take: 100, orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, plan: true, seatsLicensed: true, _count: { select: { members: { where: { status: "ACTIVE" } } } } },
    });
    return { success: true, data: orgs };
  });
  app.patch("/:orgId/seats", guard, async (req) => {
    const { orgId } = z.object({ orgId: z.string() }).parse(req.params);
    const { seatsLicensed } = z.object({ seatsLicensed: z.number().int().min(1).max(100000) }).strict().parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      await lockOrganization(tx, orgId);
      if (!await tx.organization.findUnique({ where: { id: orgId }, select: { id: true } })) throw accountError(404, "NOT_FOUND", "Organization not found.");
      const used = await tx.orgMember.count({ where: { orgId, status: "ACTIVE" } });
      if (seatsLicensed < used) throw accountError(409, "SEATS_IN_USE", `There are ${used} active members. Suspend or offboard members before reducing seats.`);
      return tx.organization.update({ where: { id: orgId }, data: { seatsLicensed }, select: { id: true, seatsLicensed: true } });
    });
    await recordAudit(req, { action: "update", entity: "organization", entityId: orgId, summary: `Set licensed seats to ${seatsLicensed}; no payment taken` });
    return { success: true, data: result };
  });
}
