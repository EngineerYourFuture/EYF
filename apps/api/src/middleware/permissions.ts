import type { FastifyRequest, FastifyReply } from "fastify";
import { hasCapability, type Capability } from "@eyf/types";

/**
 * Capability gate for admin/staff routes. Use AFTER app.requireAuth in the
 * preHandler chain (it reads req.session). Replaces scattered
 * requireRole(["ADMIN"]) checks — routes now declare the capability they need,
 * and authority is defined once in @eyf/types/permissions.
 *
 *   preHandler: [app.requireAuth, requirePermission("manage:content")]
 */
export function requirePermission(cap: Capability) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.session) {
      return reply.code(401).send({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Sign in to continue." },
      });
    }
    if (!hasCapability(req.session.role, cap)) {
      return reply.code(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission for this." },
      });
    }
  };
}
