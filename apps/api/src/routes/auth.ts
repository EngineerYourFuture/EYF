import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Webhook } from "svix";
import { prisma } from "@eyf/db";
import { env } from "../env.js";
import { upsertUserFromClerk } from "../services/clerk.js";
import { resolveActivePlan } from "../lib/subscription.js";

// Concurrent-session cap per account (account-sharing control). A login beyond
// this evicts the oldest session, logging that device out.
const MAX_SESSIONS = 3;

export async function authRoutes(app: FastifyInstance) {
  // ─── Dev-only: log in seed users by email ───────────────────────
  app.post("/dev-login", async (req, reply) => {
    // Fail-closed: requires the explicit opt-in flag AND a non-production env.
    // Either guard alone blocks it; a misconfigured NODE_ENV can't reopen it.
    if (!env.DEV_LOGIN_ENABLED || env.NODE_ENV === "production") {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
    }
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });
    if (!user) {
      return reply.code(404).send({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "No user with that email." },
      });
    }
    const plan = resolveActivePlan(user.subscription).toLowerCase();

    // Evict the oldest sessions so this login stays within the cap.
    const existing = await prisma.userSession.findMany({
      where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true },
    });
    const overflow = existing.length - (MAX_SESSIONS - 1);
    if (overflow > 0) {
      await prisma.userSession.deleteMany({ where: { id: { in: existing.slice(0, overflow).map((s) => s.id) } } });
    }
    const sess = await prisma.userSession.create({
      data: { userId: user.id, userAgent: (req.headers["user-agent"] as string | undefined) ?? null, ip: req.ip },
    });

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan,
      sid: sess.id,
    });
    const refreshToken = await reply.refreshJwtSign({ sid: sess.id, uid: user.id });
    return reply.send({
      success: true,
      data: { token, refreshToken, user: { id: user.id, email: user.email, role: user.role, plan } },
    });
  });

  // ─── Rotate a short-lived access token from a refresh token ──────
  // Client sends the refresh token as `Authorization: Bearer <refresh>`. We
  // verify it (separate secret), confirm the session row still exists (so an
  // evicted/again-capped session can't be revived), then issue a fresh access
  // token AND a rotated refresh token.
  app.post("/refresh", async (req, reply) => {
    let claims: { sid?: string; uid?: string };
    try {
      claims = await req.refreshJwtVerify<{ sid?: string; uid?: string }>();
    } catch {
      return reply.code(401).send({ success: false, error: { code: "INVALID_REFRESH", message: "Session expired. Please sign in again." } });
    }
    if (!claims.sid || !claims.uid) {
      return reply.code(401).send({ success: false, error: { code: "INVALID_REFRESH", message: "Invalid refresh token." } });
    }
    const sess = await prisma.userSession.findUnique({ where: { id: claims.sid }, select: { id: true, userId: true } });
    if (!sess || sess.userId !== claims.uid) {
      return reply.code(401).send({ success: false, error: { code: "SESSION_REVOKED", message: "This session is no longer active." } });
    }
    const user = await prisma.user.findUnique({ where: { id: claims.uid }, include: { subscription: true } });
    if (!user || user.deletedAt) {
      return reply.code(401).send({ success: false, error: { code: "SESSION_REVOKED", message: "This session is no longer active." } });
    }
    const plan = resolveActivePlan(user.subscription).toLowerCase();
    await prisma.userSession.update({ where: { id: sess.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    const token = await reply.jwtSign({ id: user.id, email: user.email, name: user.name, role: user.role, plan, sid: sess.id });
    const refreshToken = await reply.refreshJwtSign({ sid: sess.id, uid: user.id });
    return reply.send({ success: true, data: { token, refreshToken } });
  });

  // ─── Explicit sign-out: evict the session row (kills access + refresh) ──
  app.post("/logout", async (req, reply) => {
    try {
      const claims = await req.refreshJwtVerify<{ sid?: string }>();
      if (claims.sid) await prisma.userSession.delete({ where: { id: claims.sid } }).catch(() => {});
    } catch { /* no/expired refresh token — nothing to evict */ }
    return reply.send({ success: true, data: { ok: true } });
  });

  // ─── Clerk webhook (verified via svix) ──────────────────────────
  app.post(
    "/clerk-webhook",
    {
      config: { rawBody: true },
    },
    async (req, reply) => {
      if (!env.CLERK_WEBHOOK_SECRET) {
        return reply.code(503).send({
          success: false,
          error: { code: "WEBHOOK_NOT_CONFIGURED", message: "CLERK_WEBHOOK_SECRET not set." },
        });
      }
      const headers = {
        "svix-id": req.headers["svix-id"] as string,
        "svix-timestamp": req.headers["svix-timestamp"] as string,
        "svix-signature": req.headers["svix-signature"] as string,
      };
      const rawBody = req.rawBody ?? JSON.stringify(req.body);
      let event: { type: string; data: Record<string, unknown> };
      try {
        event = new Webhook(env.CLERK_WEBHOOK_SECRET).verify(rawBody, headers) as typeof event;
      } catch (err) {
        req.log.warn({ err }, "clerk webhook signature failed");
        return reply.code(400).send({
          success: false,
          error: { code: "INVALID_SIGNATURE", message: "Webhook signature failed." },
        });
      }

      if (event.type === "user.created" || event.type === "user.updated") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await upsertUserFromClerk(event.data as any);
      } else if (event.type === "user.deleted") {
        await prisma.user.updateMany({
          where: { clerkId: event.data.id as string },
          data: { deletedAt: new Date() },
        });
      }
      return reply.send({ success: true, data: { handled: event.type } });
    },
  );
}
