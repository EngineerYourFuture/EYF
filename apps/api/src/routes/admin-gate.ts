import type { FastifyInstance } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { isStaffRole } from "@eyf/types";
import { env } from "../env.js";
import { hasValidAdminGate } from "../middleware/permissions.js";

/** Constant-time string compare (avoids leaking the code length/prefix via timing). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Still do a compare against self to keep timing roughly constant.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

/**
 * The admin access gate. Staff log in normally, then exchange the shared access
 * code for a short-lived gate token that unlocks the admin API (see
 * requirePermission → hasValidAdminGate). Not gated by the code itself.
 */
export async function adminGateRoutes(app: FastifyInstance) {
  // Whether the gate is on, and whether this request already holds a valid token.
  app.get("/status", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!isStaffRole(req.session!.role)) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Staff only." } });
    }
    return reply.send({
      success: true,
      data: { required: !!env.ADMIN_ACCESS_CODE, passed: hasValidAdminGate(req) },
    });
  });

  // Exchange the access code for an 8h gate token.
  app.post("/", { preHandler: app.requireAuth }, async (req, reply) => {
    if (!isStaffRole(req.session!.role)) {
      return reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "Staff only." } });
    }
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body);

    if (!env.ADMIN_ACCESS_CODE) {
      // Gate not configured — nothing to unlock.
      return reply.send({ success: true, data: { required: false, token: null } });
    }
    if (!safeEqual(code, env.ADMIN_ACCESS_CODE)) {
      return reply.code(401).send({
        success: false,
        error: { code: "INVALID_ACCESS_CODE", message: "Incorrect access code." },
      });
    }
    const token = await reply.jwtSign({ id: req.session!.id, adminGate: true }, { expiresIn: "8h" });
    return reply.send({ success: true, data: { required: true, token } });
  });
}
