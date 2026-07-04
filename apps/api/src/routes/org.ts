import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";

/**
 * Employer / LMS portal API (the B2B scaling wedge). Access-code auth for now
 * (an `x-org-code` header → the Organization), upgraded to Clerk orgs later.
 * Orgs manage courses (STAFF | CANDIDATE | BOTH) + post internship slots; the
 * student side reads published slots, Elite-gated.
 */
type Org = { id: string; name: string; slug: string };

async function orgCtx(req: FastifyRequest, reply: FastifyReply): Promise<Org | null> {
  const code = (req.headers["x-org-code"] as string | undefined)?.trim();
  const org = code ? await prisma.organization.findUnique({ where: { accessCode: code }, select: { id: true, name: true, slug: true } }) : null;
  if (!org) { reply.code(401).send({ success: false, error: { code: "INVALID_ORG_CODE", message: "Invalid or missing organisation access code." } }); return null; }
  return org;
}

export async function orgRoutes(app: FastifyInstance) {
  // ── Login: validate an access code ──
  app.post("/verify", async (req, reply) => {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body);
    const org = await prisma.organization.findUnique({ where: { accessCode: code }, select: { id: true, name: true, slug: true } });
    if (!org) return reply.code(401).send({ success: false, error: { code: "INVALID_ORG_CODE", message: "No organisation with that code." } });
    return { success: true, data: org };
  });

  app.get("/me", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const [courses, internships] = await Promise.all([
      prisma.course.count({ where: { orgId: org.id } }),
      prisma.internshipSlot.count({ where: { orgId: org.id } }),
    ]);
    return { success: true, data: { ...org, counts: { courses, internships } } };
  });

  // ── Courses ──
  app.get("/courses", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const courses = await prisma.course.findMany({
      where: { orgId: org.id }, orderBy: { createdAt: "desc" },
      include: { lessons: { orderBy: { orderIndex: "asc" }, select: { id: true, title: true, orderIndex: true } } },
    });
    return { success: true, data: courses };
  });
  app.post("/courses", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const body = z.object({
      title: z.string().min(1).max(120),
      description: z.string().max(2000).default(""),
      audience: z.enum(["STAFF", "CANDIDATE", "BOTH"]).default("BOTH"),
    }).parse(req.body);
    return { success: true, data: await prisma.course.create({ data: { orgId: org.id, ...body } }) };
  });
  app.patch("/courses/:id", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({
      title: z.string().min(1).max(120).optional(),
      description: z.string().max(2000).optional(),
      audience: z.enum(["STAFF", "CANDIDATE", "BOTH"]).optional(),
      published: z.boolean().optional(),
    }).parse(req.body);
    const owned = await prisma.course.findFirst({ where: { id, orgId: org.id }, select: { id: true } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    return { success: true, data: await prisma.course.update({ where: { id }, data: body }) };
  });
  app.delete("/courses/:id", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const owned = await prisma.course.findFirst({ where: { id, orgId: org.id }, select: { id: true } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    await prisma.course.delete({ where: { id } });
    return { success: true, data: { id } };
  });
  app.post("/courses/:id/lessons", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const body = z.object({ title: z.string().min(1).max(160), content: z.string().max(20000).default("") }).parse(req.body);
    const owned = await prisma.course.findFirst({ where: { id, orgId: org.id }, include: { _count: { select: { lessons: true } } } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    return { success: true, data: await prisma.lesson.create({ data: { courseId: id, title: body.title, content: body.content, orderIndex: owned._count.lessons } }) };
  });

  // ── Internship slots ──
  app.get("/internships", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    return { success: true, data: await prisma.internshipSlot.findMany({ where: { orgId: org.id }, orderBy: { createdAt: "desc" } }) };
  });
  app.post("/internships", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const body = z.object({
      role: z.string().min(1).max(120),
      location: z.string().max(120).optional(),
      stipend: z.string().max(60).optional(),
      seats: z.number().int().min(1).max(500).default(1),
      eliteOnly: z.boolean().default(true),
    }).parse(req.body);
    return { success: true, data: await prisma.internshipSlot.create({ data: { orgId: org.id, ...body } }) };
  });
  app.delete("/internships/:id", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const owned = await prisma.internshipSlot.findFirst({ where: { id, orgId: org.id }, select: { id: true } });
    if (!owned) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Slot not found." } });
    await prisma.internshipSlot.delete({ where: { id } });
    return { success: true, data: { id } };
  });

  // ── Student-facing feed — the merit exchange (the flywheel payoff) ──
  // Internships are UNPAID and seats-limited. Elite = eligibility to compete;
  // the top Elite members by EYF score (XP) within the seat count actually get
  // each slot. Non-Elite see them locked with the upsell.
  app.get("/student/internships", { preHandler: app.requireAuth }, async (req) => {
    const userId = req.session!.id;
    const isElite = req.session!.plan === "elite";
    const slots = await prisma.internshipSlot.findMany({
      orderBy: { createdAt: "desc" }, take: 50,
      include: { org: { select: { name: true } } },
    });

    if (!isElite) {
      return {
        success: true,
        data: {
          isElite: false, eliteRank: null, totalElite: 0,
          slots: slots.map((s) => ({ id: s.id, org: s.org.name, role: s.role, seats: s.seats, locked: true })),
        },
      };
    }

    // Rank the student among all Elite members by EYF score (XP).
    const elite = await prisma.subscription.findMany({ where: { plan: "ELITE" }, select: { userId: true } });
    const eliteIds = elite.map((e) => e.userId);
    const profiles = await prisma.userProfile.findMany({
      where: { userId: { in: eliteIds } },
      select: { userId: true, currentXp: true },
      orderBy: { currentXp: "desc" },
    });
    const totalElite = profiles.length || 1;
    const found = profiles.findIndex((p) => p.userId === userId);
    const eliteRank = found >= 0 ? found + 1 : totalElite;

    return {
      success: true,
      data: {
        isElite: true, eliteRank, totalElite,
        slots: slots.map((s) => ({
          id: s.id, org: s.org.name, role: s.role, location: s.location,
          seats: s.seats, unpaid: true, locked: false,
          inContention: eliteRank <= s.seats,       // top `seats` Elite get it
          spotsFromCutoff: Math.max(0, eliteRank - s.seats),
        })),
      },
    };
  });
}
