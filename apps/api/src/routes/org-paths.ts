/**
 * Learning Paths + Cohorts — Phase 1 EPIC-07 (PRD §15.12, flow F4).
 *
 * A path is an ordered program of published courses; a cohort runs a path
 * against an audience with dates. Funnel progress is computed-on-read from
 * LessonProgress and written back to CohortEnrollment (v1 — a rollup worker
 * takes over at scale), including the stuck detector: >7 days of silence
 * while incomplete flags the learner for intervention.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, CourseStatus } from "@eyf/db";
import { requireOrgCapability, requireOrgMember } from "../middleware/org.js";
import { recordAudit } from "../lib/audit.js";

const STUCK_AFTER_DAYS = 7;

type PathItem = { required: boolean; course: { id: string; title: string; estMinutes: number; lessons: { id: string }[] } };
const lessonIdsOf = (item: PathItem) => item.course.lessons.map((l) => l.id);
function buildCourse(item: PathItem, done: Set<string>) {
  return {
    id: item.course.id,
    title: item.course.title,
    estMinutes: item.course.estMinutes,
    lessonCount: item.course.lessons.length,
    completedCount: item.course.lessons.filter((l) => done.has(l.id)).length,
    required: item.required,
  };
}

export async function orgPathsRoutes(app: FastifyInstance) {
  const author = { preHandler: [app.requireAuth, requireOrgCapability("learn:author")] };
  const enroller = { preHandler: [app.requireAuth, requireOrgCapability("learn:enroll")] };
  const member = { preHandler: [app.requireAuth, requireOrgMember] };

  // ── Path composition (learn:author) ───────────────────────────────
  app.get("/:orgId/paths", author, async (req) => {
    const paths = await prisma.learningPath.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: {
        id: true, title: true, published: true, updatedAt: true,
        _count: { select: { items: true, cohorts: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: paths };
  });

  app.post("/:orgId/paths", author, async (req, reply) => {
    const body = z.object({ title: z.string().trim().min(2).max(120), description: z.string().max(2000).default("") }).parse(req.body);
    const path = await prisma.learningPath.create({ data: { orgId: req.orgCtx!.orgId, ...body } });
    await recordAudit(req, { action: "create", entity: "org-path", entityId: path.id, summary: `Created path "${path.title}"` });
    return reply.code(201).send({ success: true, data: path });
  });

  app.get("/:orgId/paths/:pathId", author, async (req, reply) => {
    const { pathId } = req.params as { pathId: string };
    const path = await prisma.learningPath.findFirst({
      where: { id: pathId, orgId: req.orgCtx!.orgId },
      include: {
        items: { orderBy: { orderIndex: "asc" }, include: { course: { select: { id: true, title: true, status: true, estMinutes: true, _count: { select: { lessons: true } } } } } },
        cohorts: { select: { id: true, name: true, startsAt: true, _count: { select: { enrollments: true } } } },
      },
    });
    if (!path) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Path not found." } });
    return { success: true, data: path };
  });

  // Only PUBLISHED courses join a path — cohorts must never hit a draft.
  app.post("/:orgId/paths/:pathId/items", author, async (req, reply) => {
    const { pathId } = req.params as { pathId: string };
    const body = z.object({ courseId: z.string(), orderIndex: z.number().int().min(0).default(0), required: z.boolean().default(true) }).parse(req.body);
    const [path, course] = await Promise.all([
      prisma.learningPath.findFirst({ where: { id: pathId, orgId: req.orgCtx!.orgId }, select: { id: true } }),
      prisma.course.findFirst({ where: { id: body.courseId, orgId: req.orgCtx!.orgId }, select: { id: true, status: true } }),
    ]);
    if (!path || !course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Path or course not found." } });
    if (course.status !== CourseStatus.PUBLISHED) {
      return reply.code(409).send({ success: false, error: { code: "COURSE_NOT_PUBLISHED", message: "Publish the course before adding it to a path." } });
    }
    const item = await prisma.pathItem.upsert({
      where: { pathId_courseId: { pathId, courseId: body.courseId } },
      update: { orderIndex: body.orderIndex, required: body.required },
      create: { pathId, courseId: body.courseId, orderIndex: body.orderIndex, required: body.required },
    });
    return reply.code(201).send({ success: true, data: item });
  });

  app.post("/:orgId/paths/:pathId/publish", { preHandler: [app.requireAuth, requireOrgCapability("learn:publish")] }, async (req, reply) => {
    const { pathId } = req.params as { pathId: string };
    const path = await prisma.learningPath.findFirst({
      where: { id: pathId, orgId: req.orgCtx!.orgId },
      select: { id: true, _count: { select: { items: true } } },
    });
    if (!path) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Path not found." } });
    if (path._count.items === 0) {
      return reply.code(400).send({ success: false, error: { code: "EMPTY_PATH", message: "Add at least one course before publishing." } });
    }
    const updated = await prisma.learningPath.update({ where: { id: pathId }, data: { published: true } });
    return { success: true, data: updated };
  });

  // ── Cohorts (learn:enroll) ─────────────────────────────────────────
  app.get("/:orgId/cohorts", enroller, async (req) => {
    const cohorts = await prisma.cohort.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: {
        id: true, name: true, startsAt: true, endsAt: true,
        path: { select: { id: true, title: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startsAt: "desc" },
    });
    return { success: true, data: cohorts };
  });

  app.post("/:orgId/cohorts", enroller, async (req, reply) => {
    const body = z.object({
      pathId: z.string(),
      name: z.string().trim().min(2).max(80),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().nullable().optional(),
    }).parse(req.body);
    const path = await prisma.learningPath.findFirst({
      where: { id: body.pathId, orgId: req.orgCtx!.orgId },
      select: { id: true, published: true },
    });
    if (!path) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Path not found." } });
    if (!path.published) return reply.code(409).send({ success: false, error: { code: "PATH_NOT_PUBLISHED", message: "Publish the path before running a cohort." } });
    const cohort = await prisma.cohort.create({
      data: {
        orgId: req.orgCtx!.orgId,
        pathId: body.pathId,
        name: body.name,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
    });
    await recordAudit(req, { action: "create", entity: "org-cohort", entityId: cohort.id, summary: `Cohort "${cohort.name}" on path ${body.pathId}` });
    return reply.code(201).send({ success: true, data: cohort });
  });

  app.post("/:orgId/cohorts/:cohortId/enroll", enroller, async (req, reply) => {
    const { cohortId } = req.params as { cohortId: string };
    const { memberIds } = z.object({ memberIds: z.array(z.string()).min(1).max(500) }).parse(req.body);
    const cohort = await prisma.cohort.findFirst({ where: { id: cohortId, orgId: req.orgCtx!.orgId }, select: { id: true } });
    if (!cohort) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Cohort not found." } });
    // Only members of THIS org can be enrolled — foreign ids silently dropped
    // would hide bugs; report them instead.
    const valid = await prisma.orgMember.findMany({
      where: { id: { in: memberIds }, orgId: req.orgCtx!.orgId, status: "ACTIVE" },
      select: { id: true },
    });
    const validIds = new Set(valid.map((m) => m.id));
    const rejected = memberIds.filter((id) => !validIds.has(id));
    await prisma.cohortEnrollment.createMany({
      data: [...validIds].map((memberId) => ({ cohortId, memberId })),
      skipDuplicates: true,
    });
    return { success: true, data: { enrolled: validIds.size, rejected } };
  });

  // Funnel — compute-on-read progress + stuck detection, written back.
  app.get("/:orgId/cohorts/:cohortId/funnel", enroller, async (req, reply) => {
    const { cohortId } = req.params as { cohortId: string };
    const cohort = await prisma.cohort.findFirst({
      where: { id: cohortId, orgId: req.orgCtx!.orgId },
      include: {
        path: { include: { items: { include: { course: { include: { lessons: { select: { id: true } } } } } } } },
        enrollments: { include: { member: { include: { user: { select: { name: true, email: true } } } } } },
      },
    });
    if (!cohort) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Cohort not found." } });

    const lessonIds = cohort.path.items.flatMap((i) => i.course.lessons.map((l) => l.id));
    const userIds = cohort.enrollments.map((e) => e.member.userId);
    const progress = lessonIds.length
      ? await prisma.lessonProgress.findMany({
          where: { lessonId: { in: lessonIds }, userId: { in: userIds } },
          select: { userId: true, lessonId: true, completedAt: true },
        })
      : [];

    const now = Date.now();
    const rows = cohort.enrollments.map((e) => {
      const mine = progress.filter((p) => p.userId === e.member.userId);
      const pct = lessonIds.length ? Math.round((mine.length / lessonIds.length) * 100) : 0;
      const lastActivityAt = mine.length
        ? new Date(Math.max(...mine.map((p) => p.completedAt.getTime())))
        : null;
      const idleSince = lastActivityAt ?? e.enrolledAt;
      const stuck = pct < 100 && now - idleSince.getTime() > STUCK_AFTER_DAYS * 86_400_000;
      return {
        enrollmentId: e.id,
        member: { id: e.member.id, name: e.member.user.name, email: e.member.user.email },
        progressPct: pct,
        lastActivityAt,
        stuckFlag: stuck,
        status: pct === 100 ? "COMPLETED" : e.status,
      };
    });

    // Write-back so list views and future workers read cached state.
    await prisma.$transaction(
      rows.map((r) =>
        prisma.cohortEnrollment.update({
          where: { id: r.enrollmentId },
          data: {
            progressPct: r.progressPct,
            lastActivityAt: r.lastActivityAt,
            stuckFlag: r.stuckFlag,
            ...(r.progressPct === 100 ? { status: "COMPLETED" } : {}),
          },
        }),
      ),
    );

    const funnel = {
      enrolled: rows.length,
      started: rows.filter((r) => r.progressPct > 0).length,
      halfway: rows.filter((r) => r.progressPct >= 50).length,
      completed: rows.filter((r) => r.progressPct === 100).length,
      stuck: rows.filter((r) => r.stuckFlag).length,
    };
    return { success: true, data: { cohort: { id: cohort.id, name: cohort.name, path: cohort.path.title }, funnel, rows } };
  });

  // ── Member view (/work) ────────────────────────────────────────────
  app.get("/:orgId/work/paths", member, async (req) => {
    const enrollments = await prisma.cohortEnrollment.findMany({
      where: { memberId: req.orgCtx!.memberId, cohort: { orgId: req.orgCtx!.orgId } },
      include: {
        cohort: {
          include: {
            path: {
              include: {
                items: {
                  orderBy: { orderIndex: "asc" },
                  include: { course: { select: { id: true, title: true, estMinutes: true, lessons: { select: { id: true } } } } },
                },
              },
            },
          },
        },
      },
    });
    const userId = req.session!.id;
    const allLessonIds = enrollments.flatMap((e) => e.cohort.path.items.flatMap(lessonIdsOf));
    const done = allLessonIds.length
      ? new Set((await prisma.lessonProgress.findMany({ where: { userId, lessonId: { in: allLessonIds } }, select: { lessonId: true } })).map((p) => p.lessonId))
      : new Set<string>();

    const data = enrollments.map((e) => {
      const courses = e.cohort.path.items.map((i) => buildCourse(i, done));
      const total = courses.reduce((a, c) => a + c.lessonCount, 0);
      const completed = courses.reduce((a, c) => a + c.completedCount, 0);
      return {
        cohortId: e.cohortId,
        cohortName: e.cohort.name,
        pathTitle: e.cohort.path.title,
        startsAt: e.cohort.startsAt,
        progressPct: total ? Math.round((completed / total) * 100) : 0,
        courses,
      };
    });
    return { success: true, data };
  });
}
