import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma, Prisma, type PlacementSprint } from "@eyf/db";
import { z } from "zod";
import type { SprintCodeEvidence, SprintNotes, SprintReport, SprintResult, SprintState, SprintStep } from "@eyf/types";
import { BASELINE, RETEST, CHALLENGE_SLUG, CHALLENGE_TITLE, CHALLENGE_HASH, CHALLENGE_TESTS, ensureChallenge, focusedDrills, grade, publicQuestions } from "../services/placement-sprint.js";

const json = (value: unknown) => value as Prisma.InputJsonValue;
function fail(message: string, statusCode = 409): never {
  throw Object.assign(new Error(message), { success: false, statusCode, error: { code: "SPRINT_STATE", message } });
}
function stepOf(s: PlacementSprint | null): SprintStep {
  if (!s) return "start";
  if (!s.baselineCompletedAt) return "baseline";
  if (!s.drillsCompletedAt) return "drills";
  if (!s.challengeCompletedAt) return "challenge";
  if (!s.retestCompletedAt) return "retest";
  return "report";
}
async function own(userId: string, expected?: SprintStep) {
  const s = await prisma.placementSprint.findUnique({ where: { userId } });
  if (!s) fail("Start your placement sprint first.");
  if (expected && stepOf(s) !== expected) fail("Your progress has changed. Refresh to continue from your current step.");
  return s;
}
const answersSchema = z.object({ answers: z.record(z.number().int().min(0).max(3)) }).strict();
function checkAnswers(questions: { id: string; choices: string[] }[], answers: Record<string, number>) {
  if (Object.keys(answers).length !== questions.length || questions.some((q) => answers[q.id] == null || answers[q.id]! >= q.choices.length)) {
    fail("Answer every question exactly once before submitting.", 400);
  }
}
const notesSchema = z.object({
  explanation: z.string().trim().min(80).max(4000), sql: z.string().trim().min(80).max(4000), tests: z.string().trim().min(80).max(4000),
  assistance: z.enum(["none", "ai", "person", "both"]),
}).strict();
const draftSchema = notesSchema.extend({ explanation: z.string().max(4000), sql: z.string().max(4000), tests: z.string().max(4000) });

async function reportFor(s: PlacementSprint): Promise<SprintReport | null> {
  if (!s.retestCompletedAt || !s.challengeEvidence || !s.challengeNotes) return null;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: s.userId }, select: { name: true } });
  return { version: s.version, name: user.name, startedAt: s.startedAt.toISOString(), completedAt: s.retestCompletedAt.toISOString(),
    baseline: s.baseline as SprintResult, retest: s.retest as SprintResult,
    challenge: { title: CHALLENGE_TITLE, slug: CHALLENGE_SLUG, evidence: s.challengeEvidence as SprintCodeEvidence, notes: s.challengeNotes as SprintNotes },
    assessmentMethod: "Two different six-question practice checks covering the same three topics. Unproctored; scores describe these questions only and are not a placement prediction.",
    reviewMethod: "This report records automated code checks against the versioned task bank. Written explanations, SQL proposals and test plans are candidate-authored and are not executed by this sprint. Any organization review is private and separate from this report. AI assistance is allowed and self-declared. Identity and independent authorship have not been verified.",
  };
}
async function stateFor(userId: string): Promise<SprintState> {
  const s = await prisma.placementSprint.findUnique({ where: { userId } });
  const step = stepOf(s);
  const baseline = s?.baseline as SprintResult | null ?? null;
  const validSubmission = s ? { userId, problem: { slug: CHALLENGE_SLUG }, submittedAt: { gte: s.startedAt }, verdict: "ACCEPTED" as const, testSuiteHash: CHALLENGE_HASH, passedTests: CHALLENGE_TESTS.length, totalTests: CHALLENGE_TESTS.length } : null;
  const select = { id: true, verdict: true, passedTests: true, totalTests: true, submittedAt: true } as const;
  const accepted = validSubmission ? await prisma.problemSolution.findFirst({ where: validSubmission, orderBy: { submittedAt: "desc" }, select }) : null;
  const submission = accepted ?? (s ? await prisma.problemSolution.findFirst({ where: { userId, problem: { slug: CHALLENGE_SLUG }, submittedAt: { gte: s.startedAt } }, orderBy: { submittedAt: "desc" }, select }) : null);
  return { step, startedAt: s?.startedAt.toISOString() ?? null,
    questions: publicQuestions(({ baseline: BASELINE, retest: RETEST } as Partial<Record<SprintStep, typeof BASELINE>>)[step] ?? []),
    drills: baseline ? focusedDrills(baseline).map(({ answer: _answer, ...drill }) => drill) : [],
    baseline, retest: s?.retest as SprintResult | null ?? null, notes: s?.challengeNotes as SprintNotes | null ?? null,
    challenge: { slug: CHALLENGE_SLUG, title: CHALLENGE_TITLE, version: 1, testCount: CHALLENGE_TESTS.length },
    submission: submission ? { ...submission, submittedAt: submission.submittedAt.toISOString(), eligible: !!accepted } : null,
    report: s ? await reportFor(s) : null,
    share: s?.shareToken && s.shareExpiresAt && s.shareExpiresAt > new Date() ? { token: s.shareToken, expiresAt: s.shareExpiresAt.toISOString() } : null,
  };
}

export async function placementSprintRoutes(app: FastifyInstance) {
  app.addHook("onRequest", async (_req, reply) => { reply.header("Cache-Control", "private, no-store"); reply.header("X-Robots-Tag", "noindex, nofollow"); });
  app.get("/me", { preHandler: app.requireAuth }, async (req) => ({ success: true, data: await stateFor(req.session!.id) }));
  app.post("/start", { preHandler: app.requireAuth }, async (req) => {
    await ensureChallenge();
    await prisma.placementSprint.upsert({ where: { userId: req.session!.id }, create: { userId: req.session!.id }, update: {} });
    return { success: true, data: await stateFor(req.session!.id) };
  });
  for (const phase of ["baseline", "retest"] as const) {
    app.post(`/${phase}`, { preHandler: app.requireAuth }, async (req) => {
      const { answers } = answersSchema.parse(req.body);
      const s = await own(req.session!.id, phase);
      const bank = phase === "baseline" ? BASELINE : RETEST;
      checkAnswers(bank, answers);
      const result = grade(bank, answers);
      const changed = await prisma.placementSprint.updateMany({
        where: { id: s.id, ...(phase === "baseline" ? { baselineCompletedAt: null } : { retestCompletedAt: null, challengeCompletedAt: { not: null } }) },
        data: phase === "baseline" ? { baseline: json(result), baselineCompletedAt: new Date() } : { retest: json(result), retestCompletedAt: new Date() },
      });
      if (!changed.count) fail("This check has already been submitted. Refresh to see your result.");
      return { success: true, data: await stateFor(req.session!.id) };
    });
  }
  app.post("/drills", { preHandler: app.requireAuth }, async (req) => {
    const { answers } = answersSchema.parse(req.body);
    const s = await own(req.session!.id, "drills");
    const drills = focusedDrills(s.baseline as SprintResult);
    checkAnswers(drills.map((d) => d.question), answers);
    const missed = drills.filter((d) => answers[d.question.id] !== d.answer);
    if (missed.length) fail(`Review ${missed.map((d) => d.title.toLowerCase()).join(" and ")}, then try those checks again.`, 422);
    await prisma.placementSprint.updateMany({ where: { id: s.id, drillsCompletedAt: null }, data: { drillsCompletedAt: new Date() } });
    return { success: true, data: await stateFor(req.session!.id) };
  });
  app.patch("/notes", { preHandler: app.requireAuth }, async (req) => {
    const notes = draftSchema.parse(req.body);
    const s = await own(req.session!.id, "challenge");
    const changed = await prisma.placementSprint.updateMany({ where: { id: s.id, challengeCompletedAt: null }, data: { challengeNotes: json(notes) } });
    if (!changed.count) fail("Your completed explanation is already frozen.");
    return { success: true, data: { saved: true } };
  });
  app.post("/challenge", { preHandler: app.requireAuth }, async (req) => {
    const notes = notesSchema.parse(req.body);
    const s = await own(req.session!.id, "challenge");
    await ensureChallenge();
    const submission = await prisma.problemSolution.findFirst({ where: {
      userId: s.userId, problem: { slug: CHALLENGE_SLUG }, submittedAt: { gte: s.startedAt }, verdict: "ACCEPTED",
      testSuiteHash: CHALLENGE_HASH, passedTests: CHALLENGE_TESTS.length, totalTests: CHALLENGE_TESTS.length,
    }, orderBy: { submittedAt: "desc" } });
    if (!submission) fail("Submit code that passes this task's current test bank before completing the practical. Your written draft can still be saved.", 422);
    const evidence: SprintCodeEvidence = { submissionId: submission.id, submittedAt: submission.submittedAt.toISOString(), language: submission.language,
      passedTests: submission.passedTests, totalTests: submission.totalTests, suiteHash: CHALLENGE_HASH,
      codeHash: createHash("sha256").update(submission.code).digest("hex"), taskVersion: 1 };
    const changed = await prisma.placementSprint.updateMany({ where: { id: s.id, challengeCompletedAt: null }, data: { challengeNotes: json(notes), challengeEvidence: json(evidence), challengeCompletedAt: new Date() } });
    if (!changed.count) fail("This practical is already complete. Refresh to continue.");
    return { success: true, data: await stateFor(req.session!.id) };
  });
  app.post("/share", { preHandler: app.requireAuth }, async (req) => {
    z.object({ consent: z.literal(true) }).strict().parse(req.body);
    const s = await own(req.session!.id, "report");
    const report = await reportFor(s);
    const sharedAt = new Date();
    await prisma.placementSprint.update({ where: { id: s.id }, data: { shareToken: randomBytes(24).toString("base64url"), shareSnapshot: json(report), sharedAt, shareExpiresAt: new Date(sharedAt.getTime() + 30 * 86_400_000) } });
    return { success: true, data: await stateFor(req.session!.id) };
  });
  app.delete("/share", { preHandler: app.requireAuth }, async (req) => {
    await prisma.placementSprint.updateMany({ where: { userId: req.session!.id }, data: { shareToken: null, shareSnapshot: Prisma.DbNull, sharedAt: null, shareExpiresAt: null } });
    return { success: true, data: await stateFor(req.session!.id) };
  });
  app.get("/proof/:token", async (req, reply) => {
    const { token } = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{32}$/) }).parse(req.params);
    const s = await prisma.placementSprint.findFirst({ where: { shareToken: token, shareExpiresAt: { gt: new Date() }, user: { deletedAt: null } }, select: { shareSnapshot: true, sharedAt: true, shareExpiresAt: true } });
    if (!s?.shareSnapshot) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "This report is unavailable. The owner may have revoked it, or its link has expired." } });
    return { success: true, data: { report: s.shareSnapshot, issuedAt: s.sharedAt, expiresAt: s.shareExpiresAt } };
  });
}
