import type { FastifyRequest, FastifyReply } from "fastify";
import { hasCapability, type Capability } from "@eyf/types";
import { env } from "../env.js";

/**
 * Capability gate for admin/staff routes. Use AFTER app.requireAuth in the
 * preHandler chain (it reads req.session). Routes declare the capability they
 * need; authority is defined once in @eyf/types/permissions.
 *
 *   preHandler: [app.requireAuth, requirePermission("manage:content")]
 *
 * When ADMIN_ACCESS_CODE is configured, this ALSO enforces the admin access
 * gate: the request must carry a valid `x-admin-gate` token (issued by
 * POST /admin/gate after the staff member enters the code). A second factor on
 * top of the role — stolen staff credentials alone can't reach admin data
 * without the code.
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
    if (env.ADMIN_ACCESS_CODE && !hasValidAdminGate(req)) {
      return reply.code(403).send({
        success: false,
        error: { code: "ADMIN_GATE_REQUIRED", message: "Enter your admin access code to continue." },
      });
    }
  };
}

/** True when the request carries a valid, unexpired admin-gate token for this user. */
export function hasValidAdminGate(req: FastifyRequest): boolean {
  const token = req.headers["x-admin-gate"];
  if (typeof token !== "string" || !token) return false;
  try {
    const claims = req.server.jwt.verify<{ id?: string; adminGate?: boolean }>(token);
    return claims.adminGate === true && claims.id === req.session?.id;
  } catch {
    return false;
  }
}
