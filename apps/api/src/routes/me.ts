import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";

const profileSelect = {
  id: true,
  email: true,
  phone: true,
  name: true,
  college: true,
  graduationYear: true,
  targetRole: true,
  role: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  createdAt: true,
  profile: true,
  subscription: {
    select: {
      plan: true,
      status: true,
      startedAt: true,
      endsAt: true,
      intervalMonths: true,
    },
  },
} as const;

export async function meRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: app.requireAuth }, async (req) => {
    // Explicit select — never ship clerkId, deletedAt, or razorpay ids to the client.
    const user = await prisma.user.findUnique({
      where: { id: req.session!.id },
      select: profileSelect,
    });
    return { success: true, data: { user } };
  });

  // Update editable profile fields (name, college, graduation year, target role).
  // Used by the onboarding flow and the settings page.
  app.patch("/", { preHandler: app.requireAuth }, async (req) => {
    const body = z
      .object({
        name: z.string().trim().min(1).max(80).optional(),
        college: z.string().trim().max(120).nullish(),
        graduationYear: z.coerce.number().int().min(2000).max(2100).nullish(),
        targetRole: z.string().trim().max(80).nullish(),
      })
      .parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.session!.id },
      data: body,
      select: profileSelect,
    });
    return { success: true, data: { user } };
  });
}
