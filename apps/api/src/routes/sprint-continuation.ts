import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma, Prisma } from "@eyf/db";
import { z } from "zod";
import type { SprintCodeEvidence, SprintReviewFeedback } from "@eyf/types";
import { requireOrgCapability } from "../middleware/org.js";
import { scopedMembers } from "../services/cohort-report.js";
import { grade, publicQuestions } from "../services/placement-sprint.js";
import { PRACTICE_BANKS } from "../services/sprint-practice.js";
import { recordAudit } from "../lib/audit.js";

function fail(message: string, statusCode = 409): never { throw Object.assign(new Error(message), { success: false, statusCode, error: { code: "SPRINT_CONTINUATION", message } }); }
async function completedSprint(userId: string) {
  const s = await prisma.placementSprint.findUnique({ where: { userId } });
  if (!s?.retestCompletedAt) fail("Complete the first sprint before continuing.");
  return s;
}
async function practiceState(sprintId: string) {
  const history = await prisma.sprintPracticeRound.findMany({ where: { sprintId }, orderBy: { sequence: "desc" }, take: 50 });
  const active = history.find((r) => !r.completedAt), last = history.find((r) => r.completedAt);
  return { history, active: active ? { id: active.id, sequence: active.sequence, repeated: active.sequence > PRACTICE_BANKS.length, questions: publicQuestions(PRACTICE_BANKS[active.bankVersion - 1]!) } : null,
    feedback: last ? PRACTICE_BANKS[last.bankVersion - 1]!.map((q) => ({ prompt: q.prompt, answer: q.choices[q.answer], explanation: q.explanation })) : [] };
}
export async function sprintContinuationRoutes(app: FastifyInstance) {
  app.addHook("onSend", async (_req, reply) => { reply.header("Cache-Control", "private, no-store"); });
  app.get("/placement-sprint/practice", { preHandler: app.requireAuth }, async (req) => ({ success: true, data: await practiceState((await completedSprint(req.session!.id)).id) }));
  app.post("/placement-sprint/practice/start", { preHandler: app.requireAuth }, async (req) => {
    const s = await completedSprint(req.session!.id);
    // Row lock serializes starts, including concurrent requests from two tabs.
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "placement_sprints" WHERE "id" = ${s.id} FOR UPDATE`;
      const last = await tx.sprintPracticeRound.findFirst({ where: { sprintId: s.id }, orderBy: { sequence: "desc" } });
      if (last && !last.completedAt) return;
      const sequence = (last?.sequence ?? 0) + 1;
      await tx.sprintPracticeRound.create({ data: { sprintId: s.id, sequence, bankVersion: (sequence - 1) % PRACTICE_BANKS.length + 1 } });
    });
    return { success: true, data: await practiceState(s.id) };
  });
  app.post("/placement-sprint/practice/:roundId", { preHandler: app.requireAuth }, async (req) => {
    const { roundId } = req.params as { roundId: string };
    const { answers } = z.object({ answers: z.record(z.number().int().min(0).max(3)) }).strict().parse(req.body);
    const round = await prisma.sprintPracticeRound.findFirst({ where: { id: roundId, sprint: { userId: req.session!.id } } });
    if (!round) fail("Practice round not found.", 404);
    const bank = PRACTICE_BANKS[round.bankVersion - 1]!;
    if (Object.keys(answers).length !== bank.length || bank.some((q) => answers[q.id] == null || answers[q.id]! >= q.choices.length)) fail("Answer every question before submitting.", 400);
    const updated = await prisma.sprintPracticeRound.updateMany({ where: { id: round.id, completedAt: null }, data: { completedAt: new Date(), result: grade(bank, answers) as unknown as Prisma.InputJsonValue } });
    if (!updated.count) fail("This practice round is already complete.");
    return { success: true, data: await practiceState(round.sprintId) };
  });
  app.get("/placement-sprint/reviews", { preHandler: app.requireAuth }, async (req) => {
    const reviews = await prisma.sprintReview.findMany({ where: { sprint: { userId: req.session!.id } }, include: { org: { select: { name: true } } }, orderBy: { requestedAt: "desc" } });
    const data: SprintReviewFeedback[] = reviews.map((r) => ({ id: r.id, organization: r.org.name, requestedAt: r.requestedAt.toISOString(), revokedAt: r.revokedAt?.toISOString() ?? null, reviewedAt: r.reviewedAt?.toISOString() ?? null, reviewerName: r.reviewerName, rubric: r.rubric as SprintReviewFeedback["rubric"], feedback: r.feedback }));
    return { success: true, data };
  });
  app.post("/placement-sprint/reviews", { preHandler: app.requireAuth }, async (req) => {
    const { orgId } = z.object({ orgId: z.string(), consent: z.literal(true) }).strict().parse(req.body);
    const s = await completedSprint(req.session!.id);
    if (!await prisma.orgMember.findFirst({ where: { orgId, userId: s.userId, status: "ACTIVE" }, select: { id: true } })) fail("Organization not found.", 404);
    await prisma.sprintReview.upsert({ where: { sprintId_orgId: { sprintId: s.id, orgId } }, create: { sprintId: s.id, orgId }, update: { revokedAt: null } });
    return { success: true, data: { requested: true } };
  });
  app.delete("/placement-sprint/reviews/:reviewId", { preHandler: app.requireAuth }, async (req) => {
    const { reviewId } = req.params as { reviewId: string };
    const changed = await prisma.sprintReview.updateMany({ where: { id: reviewId, sprint: { userId: req.session!.id } }, data: { revokedAt: new Date() } });
    if (!changed.count) fail("Review request not found.", 404);
    return { success: true, data: { revoked: true } };
  });
  const reviewer = { preHandler: [app.requireAuth, requireOrgCapability("assess:grade")] };
  app.get("/orgs/:orgId/sprint-reviews", reviewer, async (req) => {
    const data = await prisma.sprintReview.findMany({ where: { orgId: req.orgCtx!.orgId, revokedAt: null, sprint: { userId: { not: req.session!.id }, user: { orgMemberships: { some: scopedMembers(req.orgCtx!) } } } }, select: { id: true, requestedAt: true, reviewedAt: true, sprint: { select: { user: { select: { name: true } } } } }, orderBy: { requestedAt: "asc" }, take: 200 });
    return { success: true, data: data.map((r) => ({ id: r.id, requestedAt: r.requestedAt, reviewedAt: r.reviewedAt, name: r.sprint.user.name })) };
  });
  app.get("/orgs/:orgId/sprint-reviews/:reviewId", reviewer, async (req) => {
    const { reviewId } = req.params as { reviewId: string };
    const r = await prisma.sprintReview.findFirst({ where: { id: reviewId, orgId: req.orgCtx!.orgId, revokedAt: null, sprint: { userId: { not: req.session!.id }, user: { orgMemberships: { some: scopedMembers(req.orgCtx!) } } } }, include: { sprint: { include: { user: { select: { name: true } } } } } });
    if (!r) fail("Review request not found.", 404);
    const evidence = r.sprint.challengeEvidence as SprintCodeEvidence | null;
    const code = evidence ? await prisma.problemSolution.findFirst({ where: { id: evidence.submissionId, userId: r.sprint.userId }, select: { code: true } }) : null;
    return { success: true, data: { id: r.id, name: r.sprint.user.name, notes: r.sprint.challengeNotes, evidence, code: code && createHash("sha256").update(code.code).digest("hex") === evidence?.codeHash ? code.code : null, reviewedAt: r.reviewedAt, rubric: r.rubric, feedback: r.feedback, reviewerName: r.reviewerName } };
  });
  app.post("/orgs/:orgId/sprint-reviews/:reviewId", reviewer, async (req) => {
    const { reviewId } = req.params as { reviewId: string };
    const rating = z.number().int().min(0).max(3);
    const body = z.object({ rubric: z.object({ authorization: rating, dataAccess: rating, testing: rating, explanation: rating }).strict(), feedback: z.string().trim().min(30).max(4000) }).strict().parse(req.body);
    const changed = await prisma.sprintReview.updateMany({ where: { id: reviewId, orgId: req.orgCtx!.orgId, revokedAt: null, reviewedAt: null, sprint: { userId: { not: req.session!.id }, user: { orgMemberships: { some: scopedMembers(req.orgCtx!) } } } }, data: { rubric: body.rubric, feedback: body.feedback, reviewedAt: new Date(), reviewerId: req.session!.id, reviewerName: req.session!.name } });
    if (!changed.count) fail("Review unavailable, withdrawn, or already published.");
    await recordAudit(req, { action: "create", entity: "sprint-review", entityId: reviewId, summary: "Published practical feedback" });
    return { success: true, data: { published: true } };
  });
}
