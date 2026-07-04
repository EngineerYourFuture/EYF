import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { ORG_VERIFY_RATE_LIMIT } from "../lib/rate-limits.js";

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
  // ── Login: validate an access code (tight rate limit — brute-force guard) ──
  app.post("/verify", { config: { rateLimit: ORG_VERIFY_RATE_LIMIT } }, async (req, reply) => {
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

  // ── Student LMS: catalog, enroll, learn, complete a lesson ──
  app.get("/catalog", { preHandler: app.requireAuth }, async (req) => {
    const userId = req.session!.id;
    const courses = await prisma.course.findMany({
      where: { published: true }, orderBy: { createdAt: "desc" }, take: 50,
      include: { org: { select: { name: true } }, _count: { select: { lessons: true } } },
    });
    const [enrollments, progress] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } }),
      prisma.lessonProgress.findMany({ where: { userId }, select: { lesson: { select: { courseId: true } } } }),
    ]);
    const enrolled = new Set(enrollments.map((e) => e.courseId));
    const doneByCourse = new Map<string, number>();
    for (const p of progress) doneByCourse.set(p.lesson.courseId, (doneByCourse.get(p.lesson.courseId) ?? 0) + 1);
    return {
      success: true,
      data: courses.map((c) => ({
        id: c.id, title: c.title, description: c.description, org: c.org.name, audience: c.audience,
        lessons: c._count.lessons, enrolled: enrolled.has(c.id),
        progressPct: c._count.lessons ? Math.round(((doneByCourse.get(c.id) ?? 0) / c._count.lessons) * 100) : 0,
      })),
    };
  });

  app.post("/courses/:id/enroll", { preHandler: app.requireAuth }, async (req, reply) => {
    const userId = req.session!.id;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const course = await prisma.course.findFirst({ where: { id, published: true }, select: { id: true } });
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found or not published." } });
    await prisma.enrollment.upsert({ where: { courseId_userId: { courseId: id, userId } }, update: {}, create: { courseId: id, userId } });
    return { success: true, data: { enrolled: true } };
  });

  app.get("/courses/:id/learn", { preHandler: app.requireAuth }, async (req, reply) => {
    const userId = req.session!.id;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const course = await prisma.course.findFirst({
      where: { id, published: true },
      include: { org: { select: { name: true } }, lessons: { orderBy: { orderIndex: "asc" } } },
    });
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    const done = new Set(
      (await prisma.lessonProgress.findMany({ where: { userId, lesson: { courseId: id } }, select: { lessonId: true } })).map((p) => p.lessonId),
    );
    return {
      success: true,
      data: {
        id: course.id, title: course.title, org: course.org.name,
        lessons: course.lessons.map((l) => ({ id: l.id, title: l.title, content: l.content, completed: done.has(l.id) })),
      },
    };
  });

  app.post("/lessons/:id/complete", { preHandler: app.requireAuth }, async (req, reply) => {
    const userId = req.session!.id;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const lesson = await prisma.lesson.findFirst({ where: { id, course: { published: true } }, select: { id: true } });
    if (!lesson) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Lesson not found." } });
    await prisma.lessonProgress.upsert({ where: { lessonId_userId: { lessonId: id, userId } }, update: {}, create: { lessonId: id, userId } });
    return { success: true, data: { completed: true } };
  });

  // ── Org analytics: enrollment + completion for a course ──
  app.get("/courses/:id/enrollments", async (req, reply) => {
    const org = await orgCtx(req, reply); if (!org) return;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const course = await prisma.course.findFirst({
      where: { id, orgId: org.id },
      include: { _count: { select: { lessons: true, enrollments: true } } },
    });
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    const totalLessons = course._count.lessons;
    let completed = 0;
    if (totalLessons > 0 && course._count.enrollments > 0) {
      const progress = await prisma.lessonProgress.groupBy({ by: ["userId"], where: { lesson: { courseId: id } }, _count: true });
      completed = progress.filter((p) => p._count >= totalLessons).length;
    }
    return {
      success: true,
      data: {
        enrolled: course._count.enrollments, lessons: totalLessons, completed,
        completionPct: course._count.enrollments ? Math.round((completed / course._count.enrollments) * 100) : 0,
      },
    };
  });
}
