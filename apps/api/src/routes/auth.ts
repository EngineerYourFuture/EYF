import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Webhook } from "svix";
import { prisma } from "@eyf/db";
import { env } from "../env.js";
import { upsertUserFromClerk } from "../services/clerk.js";

export async function authRoutes(app: FastifyInstance) {
  // ─── Dev-only: log in seed users by email ───────────────────────
  app.post("/dev-login", async (req, reply) => {
    if (env.NODE_ENV === "production") {
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
    const plan = (user.subscription?.plan ?? "FREE").toLowerCase();
    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan,
    });
    return reply.send({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role, plan } },
    });
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
