/**
 * Enterprise Learn — Phase 1 EPIC-05/06 (PRD §16, §15.3).
 *
 * Builder side (learn:author / learn:publish): block-based lessons, course
 * lifecycle DRAFT → IN_REVIEW → PUBLISHED with immutable version snapshots
 * and the optional two-person publish rule (org setting `twoPersonPublish`).
 * Member side (/work): published courses only, enrollment + per-lesson
 * progress on the existing Enrollment/LessonProgress rails.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, CourseStatus, LessonType, Prisma } from "@eyf/db";
import { requireOrgCapability, requireOrgMember } from "../middleware/org.js";
import { recordAudit } from "../lib/audit.js";
import { findOrCreateSkill, recordEvidence } from "../lib/skill-ledger.js";
import { EVIDENCE_WEIGHT } from "@eyf/types";

// Block model (PRD §16) — validated loosely on type, strictly on shape caps.
const blockInput = z.object({
  type: z.enum(["heading", "rich_text", "callout", "image", "video", "code", "judged_code", "quiz", "file", "embed", "divider", "toggle"]),
  data: z.record(z.unknown()).default({}),
});
const blocksInput = z.array(blockInput).max(200);

const lessonInput = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.nativeEnum(LessonType).default(LessonType.RICH_TEXT),
  blocks: blocksInput.default([]),
  estMinutes: z.number().int().min(1).max(240).default(5),
  orderIndex: z.number().int().min(0).default(0),
  // Skill tagging (PRD §15.13) — a tagged lesson emits Skill Ledger evidence
  // on completion. slug is findOrCreate'd into the global taxonomy.
  skillSlug: z.string().min(1).max(60).nullable().optional(),
  skillLevel: z.number().int().min(0).max(100).default(60),
});

const EDITABLE: CourseStatus[] = [CourseStatus.DRAFT, CourseStatus.IN_REVIEW];

export async function orgLearnRoutes(app: FastifyInstance) {
  const author = { preHandler: [app.requireAuth, requireOrgCapability("learn:author")] };
  const publisher = { preHandler: [app.requireAuth, requireOrgCapability("learn:publish")] };
  const member = { preHandler: [app.requireAuth, requireOrgMember] };

  const courseInOrg = (orgId: string, courseId: string) =>
    prisma.course.findFirst({ where: { id: courseId, orgId } });

  // ── Builder ────────────────────────────────────────────────────────
  app.get("/:orgId/courses", author, async (req) => {
    const courses = await prisma.course.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: {
        id: true, title: true, status: true, version: true, estMinutes: true,
        updatedAt: true, authorMemberId: true, _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: courses };
  });

  app.post("/:orgId/courses", author, async (req, reply) => {
    const body = z.object({ title: z.string().trim().min(2).max(120), description: z.string().max(2000).default("") }).parse(req.body);
    const course = await prisma.course.create({
      data: { orgId: req.orgCtx!.orgId, title: body.title, description: body.description, authorMemberId: req.orgCtx!.memberId },
    });
    await recordAudit(req, { action: "create", entity: "org-course", entityId: course.id, summary: `Drafted course "${course.title}"` });
    return reply.code(201).send({ success: true, data: course });
  });

  app.get("/:orgId/courses/:courseId", author, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const course = await prisma.course.findFirst({
      where: { id: courseId, orgId: req.orgCtx!.orgId },
      include: { lessons: { orderBy: { orderIndex: "asc" } }, versions: { select: { version: true, publishedAt: true, publishedById: true }, orderBy: { version: "desc" } } },
    });
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    return { success: true, data: course };
  });

  app.patch("/:orgId/courses/:courseId", author, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const body = z.object({ title: z.string().trim().min(2).max(120).optional(), description: z.string().max(2000).optional() }).parse(req.body);
    const course = await courseInOrg(req.orgCtx!.orgId, courseId);
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    if (!EDITABLE.includes(course.status)) {
      return reply.code(409).send({ success: false, error: { code: "NOT_EDITABLE", message: "Published courses are edited as a new draft (archive or create a revision)." } });
    }
    const updated = await prisma.course.update({ where: { id: courseId }, data: body });
    return { success: true, data: updated };
  });

  app.post("/:orgId/courses/:courseId/lessons", author, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const body = lessonInput.parse(req.body);
    const course = await courseInOrg(req.orgCtx!.orgId, courseId);
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    if (!EDITABLE.includes(course.status)) {
      return reply.code(409).send({ success: false, error: { code: "NOT_EDITABLE", message: "This course is published — draft a revision to edit lessons." } });
    }
    const { skillSlug, ...lessonData } = body;
    const skillId = skillSlug ? await findOrCreateSkill(skillSlug) : null;
    const lesson = await prisma.lesson.create({
      data: { ...lessonData, blocks: body.blocks as Prisma.InputJsonValue, courseId, skillId },
    });
    // Keep the course's estimated time honest as content grows.
    await prisma.course.update({
      where: { id: courseId },
      data: { estMinutes: { increment: body.estMinutes } },
    });
    return reply.code(201).send({ success: true, data: lesson });
  });

  app.patch("/:orgId/lessons/:lessonId", author, async (req, reply) => {
    const { lessonId } = req.params as { lessonId: string };
    const body = lessonInput.partial().parse(req.body);
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, course: { orgId: req.orgCtx!.orgId } },
      include: { course: { select: { status: true } } },
    });
    if (!lesson) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Lesson not found." } });
    if (!EDITABLE.includes(lesson.course.status)) {
      return reply.code(409).send({ success: false, error: { code: "NOT_EDITABLE", message: "This course is published — draft a revision to edit lessons." } });
    }
    const { blocks, ...rest } = body;
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: { ...rest, ...(blocks !== undefined ? { blocks: blocks as Prisma.InputJsonValue } : {}) },
    });
    return { success: true, data: updated };
  });

  // Lifecycle: author submits, publisher publishes (capability-separated;
  // two-person rule additionally forbids self-publish when the org opts in).
  app.post("/:orgId/courses/:courseId/submit", author, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const course = await courseInOrg(req.orgCtx!.orgId, courseId);
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    if (course.status !== CourseStatus.DRAFT) {
      return reply.code(409).send({ success: false, error: { code: "BAD_STATE", message: `Cannot submit from ${course.status}.` } });
    }
    const lessons = await prisma.lesson.count({ where: { courseId } });
    if (lessons === 0) {
      return reply.code(400).send({ success: false, error: { code: "EMPTY_COURSE", message: "Add at least one lesson before submitting." } });
    }
    const updated = await prisma.course.update({ where: { id: courseId }, data: { status: CourseStatus.IN_REVIEW } });
    return { success: true, data: updated };
  });

  app.post("/:orgId/courses/:courseId/publish", publisher, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const course = await courseInOrg(req.orgCtx!.orgId, courseId);
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    if (course.status !== CourseStatus.IN_REVIEW && course.status !== CourseStatus.DRAFT) {
      return reply.code(409).send({ success: false, error: { code: "BAD_STATE", message: `Cannot publish from ${course.status}.` } });
    }

    const org = await prisma.organization.findUnique({ where: { id: req.orgCtx!.orgId }, select: { settings: true } });
    const twoPerson = (org?.settings as { twoPersonPublish?: boolean } | null)?.twoPersonPublish === true;
    if (twoPerson && course.authorMemberId === req.orgCtx!.memberId) {
      return reply.code(403).send({ success: false, error: { code: "TWO_PERSON_RULE", message: "This org requires a second person to publish — the author cannot self-publish." } });
    }

    const lessons = await prisma.lesson.findMany({ where: { courseId }, orderBy: { orderIndex: "asc" } });
    const published = await prisma.$transaction(async (tx) => {
      await tx.courseVersion.create({
        data: {
          courseId,
          version: course.version,
          publishedById: req.orgCtx!.memberId,
          snapshot: {
            title: course.title,
            description: course.description,
            lessons: lessons.map((l) => ({ title: l.title, type: l.type, blocks: l.blocks, estMinutes: l.estMinutes, orderIndex: l.orderIndex })),
          },
        },
      });
      return tx.course.update({
        where: { id: courseId },
        data: { status: CourseStatus.PUBLISHED, published: true, version: { increment: 1 } },
      });
    });
    await recordAudit(req, { action: "update", entity: "org-course", entityId: courseId, summary: `Published "${course.title}" v${course.version}` });
    return { success: true, data: published };
  });

  app.post("/:orgId/courses/:courseId/archive", publisher, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const course = await courseInOrg(req.orgCtx!.orgId, courseId);
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.ARCHIVED, published: false },
    });
    return { success: true, data: updated };
  });

  // ── Member (/work) ────────────────────────────────────────────────
  app.get("/:orgId/work/courses", member, async (req) => {
    const userId = req.session!.id;
    const courses = await prisma.course.findMany({
      where: { orgId: req.orgCtx!.orgId, status: CourseStatus.PUBLISHED },
      select: {
        id: true, title: true, description: true, estMinutes: true, version: true,
        _count: { select: { lessons: true } },
        lessons: { select: { id: true, progress: { where: { userId }, select: { id: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    const data = courses.map((c) => ({
      id: c.id, title: c.title, description: c.description, estMinutes: c.estMinutes,
      lessonCount: c._count.lessons,
      completedCount: c.lessons.filter((l) => l.progress.length > 0).length,
    }));
    return { success: true, data };
  });

  app.get("/:orgId/work/courses/:courseId", member, async (req, reply) => {
    const { courseId } = req.params as { courseId: string };
    const userId = req.session!.id;
    const course = await prisma.course.findFirst({
      where: { id: courseId, orgId: req.orgCtx!.orgId, status: CourseStatus.PUBLISHED },
      include: {
        lessons: {
          orderBy: { orderIndex: "asc" },
          select: { id: true, title: true, type: true, blocks: true, estMinutes: true, orderIndex: true, progress: { where: { userId }, select: { id: true } } },
        },
      },
    });
    if (!course) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Course not found." } });
    await prisma.enrollment.upsert({
      where: { courseId_userId: { courseId, userId } },
      update: {},
      create: { courseId, userId },
    });
    return {
      success: true,
      data: {
        id: course.id, title: course.title, description: course.description,
        lessons: course.lessons.map((l) => ({ ...l, completed: l.progress.length > 0, progress: undefined })),
      },
    };
  });

  app.post("/:orgId/work/lessons/:lessonId/complete", member, async (req, reply) => {
    const { lessonId } = req.params as { lessonId: string };
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, course: { orgId: req.orgCtx!.orgId, status: CourseStatus.PUBLISHED } },
      select: { id: true, skillId: true, skillLevel: true },
    });
    if (!lesson) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Lesson not found." } });
    // Only the FIRST completion emits evidence — re-completing shouldn't stack
    // the ledger (createMany-of-progress is idempotent; guard evidence too).
    const existing = await prisma.lessonProgress.findUnique({
      where: { lessonId_userId: { lessonId, userId: req.session!.id } },
      select: { id: true },
    });
    await prisma.lessonProgress.upsert({
      where: { lessonId_userId: { lessonId, userId: req.session!.id } },
      update: {},
      create: { lessonId, userId: req.session!.id },
    });
    if (!existing && lesson.skillId) {
      await recordEvidence({
        userId: req.session!.id,
        orgId: req.orgCtx!.orgId,
        skillId: lesson.skillId,
        level: lesson.skillLevel,
        weight: EVIDENCE_WEIGHT.LESSON ?? 0.5,
        sourceType: "LESSON",
        sourceId: lessonId,
      });
    }
    return { success: true, data: { lessonId, completed: true } };
  });
}
