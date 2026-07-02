/**
 * Admin audit log — read-only trail of staff back-office actions. Gated on
 * view:analytics, so only ADMIN (authority) can see who changed what.
 */
import type { FastifyInstance } from "fastify";
import { prisma } from "@eyf/db";
import { requirePermission } from "../middleware/permissions.js";

export async function adminAuditRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.requireAuth, requirePermission("view:analytics")] }, async (req) => {
    const { entity } = req.query as { entity?: string };
    const logs = await prisma.auditLog.findMany({
      where: entity ? { entity } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { success: true, data: logs };
  });
}
