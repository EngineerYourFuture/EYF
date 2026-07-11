import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Persona } from "@eyf/db";

const profileSelect = {
  id: true,
  email: true,
  phone: true,
  name: true,
  college: true,
  graduationYear: true,
  targetRole: true,
  persona: true,
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
        persona: z.nativeEnum(Persona).nullish(),
      })
      .parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.session!.id },
      data: body,
      select: profileSelect,
    });
    return { success: true, data: { user } };
  });

  // ─── GDPR / DPDP: data portability (Right of Access) ────────────
  // Returns a machine-readable copy of the personal data we hold for the caller.
  app.get("/export", { preHandler: app.requireAuth }, async (req, reply) => {
    const id = req.session!.id;
    const [user, profile, submissions, subscription, sessions] = await Promise.all([
      prisma.user.findUnique({ where: { id }, select: profileSelect }),
      prisma.userProfile.findUnique({ where: { userId: id } }),
      prisma.problemSolution.findMany({ where: { userId: id }, select: { problemId: true, verdict: true, language: true, submittedAt: true } }),
      prisma.subscription.findUnique({ where: { userId: id }, select: { plan: true, status: true, startedAt: true, endsAt: true } }),
      prisma.userSession.findMany({ where: { userId: id }, select: { userAgent: true, ip: true, createdAt: true, lastSeenAt: true } }),
    ]);
    reply.header("content-disposition", `attachment; filename="eyf-data-export-${id}.json"`);
    return reply.send({
      success: true,
      data: { exportedAt: new Date().toISOString(), user, profile, subscription, submissions, sessions },
    });
  });

  // ─── GDPR / DPDP: Right to Erasure ──────────────────────────────
  // Soft-deletes the account and evicts all sessions immediately. PII is purged
  // on the retention schedule (see docs). Requires typing the exact confirmation.
  app.post("/delete", { preHandler: app.requireAuth }, async (req, reply) => {
    const { confirm } = z.object({ confirm: z.literal("DELETE") }).parse(req.body);
    void confirm;
    const id = req.session!.id;
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
      prisma.userSession.deleteMany({ where: { userId: id } }),
    ]);
    return reply.send({ success: true, data: { deleted: true } });
  });
}
