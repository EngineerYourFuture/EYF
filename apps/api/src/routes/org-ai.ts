/**
 * Org AI features (PRD §20). AI drafts, humans commit — everything created here
 * lands as a DRAFT the instructor edits before publishing. Meters ai_credits.
 * Works with no Anthropic key (deterministic skeleton), shines with one.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, CourseStatus, Prisma } from "@eyf/db";
import { requireOrgCapability } from "../middleware/org.js";
import { recordAudit } from "../lib/audit.js";
import { buildCourseOutline } from "../lib/ai-course.js";
import { findOrCreateSkill } from "../lib/skill-ledger.js";
import { bumpUsage } from "../lib/usage.js";

export async function orgAiRoutes(app: FastifyInstance) {
  const author = { preHandler: [app.requireAuth, requireOrgCapability("learn:author")] };

  // Draft a full course from a topic — creates the course + lessons in DRAFT.
  app.post("/:orgId/ai/course-draft", author, async (req, reply) => {
    const body = z.object({
      topic: z.string().trim().min(2).max(80),
      audience: z.string().trim().min(2).max(40).default("fresher"),
      lessonCount: z.number().int().min(3).max(8).default(5),
    }).parse(req.body);

    const outline = await buildCourseOutline(body);
    await bumpUsage(req.orgCtx!.orgId, "ai_credits", outline.source === "ai" ? 5 : 0);

    // Materialize the outline into real editable rows.
    const course = await prisma.course.create({
      data: {
        orgId: req.orgCtx!.orgId,
        title: outline.title,
        description: outline.description,
        authorMemberId: req.orgCtx!.memberId,
        status: CourseStatus.DRAFT,
      },
      select: { id: true },
    });
    let est = 0;
    for (let i = 0; i < outline.lessons.length; i++) {
      const l = outline.lessons[i]!;
      const skillId = l.skillSlug ? await findOrCreateSkill(l.skillSlug) : null;
      const estMinutes = Math.max(5, l.blocks.length * 3);
      est += estMinutes;
      await prisma.lesson.create({
        data: { courseId: course.id, title: l.title, orderIndex: i, estMinutes, skillId, blocks: l.blocks as Prisma.InputJsonValue },
      });
    }
    await prisma.course.update({ where: { id: course.id }, data: { estMinutes: est } });
    await recordAudit(req, { action: "create", entity: "org-course", entityId: course.id, summary: `AI-drafted course "${outline.title}" (${outline.source})` });

    return reply.code(201).send({ success: true, data: { courseId: course.id, title: outline.title, lessons: outline.lessons.length, source: outline.source } });
  });
}
