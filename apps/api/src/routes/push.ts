import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, PushPlatform } from "@eyf/db";
import { sendPushToUser } from "../services/push.js";

export async function pushRoutes(app: FastifyInstance) {
  // Mobile / web client registers its push token here.
  app.post("/register", { preHandler: app.requireAuth }, async (req) => {
    const body = z.object({
      token: z.string().min(10).max(200),
      platform: z.nativeEnum(PushPlatform),
      lang: z.string().min(2).max(5).default("en"),
    }).parse(req.body);
    const row = await prisma.pushToken.upsert({
      where: { token: body.token },
      create: { ...body, userId: req.session!.id },
      update: { userId: req.session!.id, lastSeenAt: new Date(), lang: body.lang },
    });
    return { success: true, data: row };
  });

  app.post("/unregister", { preHandler: app.requireAuth }, async (req) => {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    await prisma.pushToken.deleteMany({ where: { token, userId: req.session!.id } });
    return { success: true, data: { ok: true } };
  });

  // Self-test: dev/staff users can send a push to themselves.
  app.post("/test", { preHandler: app.requireAuth }, async (req) => {
    const result = await sendPushToUser(req.session!.id, {
      title: "EYF push test",
      body: "If you see this, your device is registered.",
      data: { route: "/dashboard", test: true },
    });
    return { success: true, data: result };
  });
}
