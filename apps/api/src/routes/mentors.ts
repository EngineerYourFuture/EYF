import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, MockType, MockStatus } from "@eyf/db";
import { settleExpertMockPayout } from "../services/payouts.js";

const listQuery = z.object({
  expertise: z.string().optional(),
  company: z.string().optional(),
  verified: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function mentorRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const { expertise, company, verified, limit } = listQuery.parse(req.query);
    const mentors = await prisma.mentor.findMany({
      where: {
        ...(verified && { verified: true }),
        ...(expertise && { expertise: { has: expertise } }),
        ...(company && { company: { contains: company, mode: "insensitive" } }),
      },
      take: limit,
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
      include: { user: { select: { name: true, profile: { select: { avatar: true } } } } },
    });
    return {
      success: true,
      data: mentors.map((m) => ({
        id: m.id,
        name: m.user.name,
        avatar: m.user.profile?.avatar ?? null,
        company: m.company,
        jobTitle: m.jobTitle,
        yearsExp: m.yearsExp,
        expertise: m.expertise,
        hourlyRateInr: m.hourlyRateInr,
        ratingAvg: m.ratingAvg,
        ratingCount: m.ratingCount,
        verified: m.verified,
      })),
    };
  });

  app.get("/:id", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const m = await prisma.mentor.findUnique({
      where: { id },
      include: { user: { select: { name: true, profile: { select: { avatar: true, bio: true, linkedinUrl: true } } } } },
    });
    if (!m) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Mentor not found" } });
    return { success: true, data: m };
  });

  // ── Slots & booking ───────────────────────────────────────────
  app.get("/:id/slots", async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const slots = await prisma.mentorSlot.findMany({
      where: { mentorId: id, booked: false, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 30,
    });
    return { success: true, data: slots };
  });

  app.post(
    "/me/slots",
    { preHandler: app.requireAuth },
    async (req, reply) => {
      const body = z.object({
        startAt: z.coerce.date(),
        endAt: z.coerce.date(),
      }).parse(req.body);
      const mentor = await prisma.mentor.findUnique({ where: { userId: req.session!.id } });
      if (!mentor) return reply.code(403).send({ success: false, error: { code: "NOT_A_MENTOR", message: "You aren't a registered mentor." } });
      const slot = await prisma.mentorSlot.create({
        data: { mentorId: mentor.id, ...body },
      });
      return { success: true, data: slot };
    },
  );

  app.post(
    "/slots/:slotId/book",
    { preHandler: [app.requireAuth, app.requirePlan(["elite"])] }, // Expert mocks are Elite-tier per spec
    async (req, reply) => {
      const { slotId } = z.object({ slotId: z.string() }).parse(req.params);
      try {
        const result = await prisma.$transaction(async (tx) => {
          const slot = await tx.mentorSlot.findUnique({ where: { id: slotId }, include: { mentor: true } });
          if (!slot || slot.booked) throw new Error("SLOT_UNAVAILABLE");
          const session = await tx.mockSession.create({
            data: {
              type: MockType.EXPERT,
              status: MockStatus.SCHEDULED,
              candidateId: req.session!.id,
              mentorId: slot.mentor.id,
              scheduledFor: slot.startAt,
              durationMin: Math.round((slot.endAt.getTime() - slot.startAt.getTime()) / 60_000),
            },
          });
          await tx.mentorSlot.update({
            where: { id: slotId },
            data: { booked: true, mockSessionId: session.id },
          });
          return session;
        });
        return { success: true, data: result };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "BOOKING_FAILED";
        if (msg === "SLOT_UNAVAILABLE") {
          return reply.code(409).send({ success: false, error: { code: "SLOT_UNAVAILABLE", message: "Someone just grabbed that slot." } });
        }
        throw err;
      }
    },
  );

  // Link a Razorpay Connect account so payouts can settle automatically.
  app.post("/me/razorpay-link", { preHandler: app.requireAuth }, async (req, reply) => {
    const { razorpayAccountId } = z.object({ razorpayAccountId: z.string().min(5) }).parse(req.body);
    const mentor = await prisma.mentor.findUnique({ where: { userId: req.session!.id } });
    if (!mentor) return reply.code(403).send({ success: false, error: { code: "NOT_A_MENTOR", message: "You aren't a registered mentor." } });
    const updated = await prisma.mentor.update({
      where: { id: mentor.id },
      data: { razorpayAccountId },
    });
    return { success: true, data: { linked: true, mentor: updated } };
  });

  // List my payouts (mentor view).
  app.get("/me/payouts", { preHandler: app.requireAuth }, async (req, reply) => {
    const mentor = await prisma.mentor.findUnique({ where: { userId: req.session!.id } });
    if (!mentor) return reply.code(403).send({ success: false, error: { code: "NOT_A_MENTOR", message: "Not a mentor." } });
    const payouts = await prisma.mentorPayout.findMany({
      where: { mentorId: mentor.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { success: true, data: payouts };
  });

  // Mark an expert mock as completed and trigger settlement. Mentor-only.
  app.post("/mocks/:mockId/complete", { preHandler: app.requireAuth }, async (req, reply) => {
    const { mockId } = z.object({ mockId: z.string() }).parse(req.params);
    const mentor = await prisma.mentor.findUnique({ where: { userId: req.session!.id } });
    if (!mentor) return reply.code(403).send({ success: false, error: { code: "NOT_A_MENTOR", message: "Not a mentor." } });
    const mock = await prisma.mockSession.findUnique({ where: { id: mockId } });
    if (!mock || mock.mentorId !== mentor.id) {
      return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Mock not found." } });
    }
    if (mock.type !== MockType.EXPERT) {
      return reply.code(400).send({ success: false, error: { code: "WRONG_TYPE", message: "Not an expert mock." } });
    }
    await prisma.mockSession.update({
      where: { id: mockId },
      data: { status: MockStatus.COMPLETED, endedAt: new Date() },
    });
    await settleExpertMockPayout(mockId);
    return { success: true, data: { settled: true } };
  });

  // Apply to become a mentor — needs Pro+ for spam protection.
  app.post(
    "/apply",
    { preHandler: [app.requireAuth, app.requirePlan(["pro", "elite"])] },
    async (req) => {
      const body = z.object({
        company: z.string(),
        jobTitle: z.string(),
        yearsExp: z.number().int().min(1).max(40),
        expertise: z.array(z.string()).min(1).max(10),
        hourlyRateInr: z.number().int().min(0).max(50_000),
        bio: z.string().min(50).max(2000),
        verificationDocs: z.array(z.string()).default([]),
      }).parse(req.body);
      const created = await prisma.mentor.upsert({
        where: { userId: req.session!.id },
        create: { userId: req.session!.id, ...body, verified: false },
        update: { ...body, verified: false, verifiedAt: null },
      });
      return { success: true, data: created };
    },
  );
}
