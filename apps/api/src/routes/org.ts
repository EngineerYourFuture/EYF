import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { env } from "../env.js";
import { visibleCourse, learnerBlocks, completionInput, completionError, completeLesson } from "../lib/lms.js";

/** Legacy learner aliases still enforce personal authentication and membership.
 * Shared-code administration is permanently retired, including old tokens. */
export async function orgRoutes(app: FastifyInstance) {
  const retired = [
    ["POST", "/verify"], ["GET", "/me"], ["GET", "/courses"], ["POST", "/courses"],
    ["PATCH", "/courses/:id"], ["DELETE", "/courses/:id"], ["POST", "/courses/:id/lessons"],
    ["GET", "/courses/:id/enrollments"], ["GET", "/internships"], ["POST", "/internships"], ["DELETE", "/internships/:id"],
  ] as const;
  for (const [method, url] of retired) app.route({ method, url, handler: async (_req, reply) =>
    reply.code(410).send({ success: false, error: { code: "PORTAL_RETIRED", message: "Use your personal account in the private LMS portal." } }),
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

    // Preview lets students inspect the exchange without claiming a paid plan
    // or inventing a rank / entitlement to a real employer's limited seats.
    if (!env.BILLING_ENABLED) {
      return {
        success: true,
        data: {
          previewAccess: true, isElite, eliteRank: null, totalElite: 0,
          slots: slots.map((s) => ({ id: s.id, org: s.org.name, role: s.role, location: s.location, seats: s.seats, unpaid: true, locked: false })),
        },
      };
    }
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
      where: visibleCourse(userId), orderBy: { createdAt: "desc" }, take: 50,
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
    const course = await prisma.course.findFirst({ where: { id, ...visibleCourse(userId) }, select: { id: true } });
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found or not published." } });
    await prisma.enrollment.upsert({ where: { courseId_userId: { courseId: id, userId } }, update: {}, create: { courseId: id, userId } });
    return { success: true, data: { enrolled: true } };
  });

  app.get("/courses/:id/learn", { preHandler: app.requireAuth }, async (req, reply) => {
    const userId = req.session!.id;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const course = await prisma.course.findFirst({
      where: { id, ...visibleCourse(userId) },
      include: { org: { select: { name: true } }, lessons: { orderBy: { orderIndex: "asc" } } },
    });
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    const done = new Set(
      (await prisma.lessonProgress.findMany({ where: { userId, lesson: { courseId: id } }, select: { lessonId: true } })).map((p) => p.lessonId),
    );
    return {
      success: true,
      data: {
        id: course.id, title: course.title, org: course.org.name, orgId: course.orgId,
        lessons: course.lessons.map((l) => ({ id: l.id, title: l.title, content: l.content, blocks: learnerBlocks(l.blocks), completed: done.has(l.id) })),
      },
    };
  });

  app.post("/lessons/:id/complete", { preHandler: app.requireAuth }, async (req, reply) => {
    const userId = req.session!.id;
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const lesson = await prisma.lesson.findFirst({ where: { id, course: visibleCourse(userId) }, select: { id: true, blocks: true, skillId: true, skillLevel: true, course: { select: { orgId: true } } } });
    if (!lesson) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Lesson not found." } });
    const { answers } = completionInput.parse(req.body ?? {});
    const error = await completionError(userId, lesson.blocks, answers);
    if (error) return reply.code(422).send({ success: false, error: { code: "LESSON_INCOMPLETE", message: error } });
    await completeLesson(userId, lesson, lesson.course.orgId);
    return { success: true, data: { completed: true } };
  });

}
