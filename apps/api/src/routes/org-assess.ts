/**
 * Assessment engine — Phase 2 EPIC-10 (PRD §17/18). Reuses the staff-managed
 * McqBankQuestion pool + proven scoring. The strategic payoff: on submit an
 * assessment emits ASSESSMENT-weight evidence into the Skill Ledger (heavier
 * than a lesson), so proven performance overrides mere exposure — "lessons
 * give a floor, the test sets the real level."
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, McqCategory, AssessmentPurpose } from "@eyf/db";
import { EVIDENCE_WEIGHT } from "@eyf/types";
import { requireOrgCapability, requireOrgMember } from "../middleware/org.js";
import { recordAudit } from "../lib/audit.js";
import { findOrCreateSkill, recordEvidence } from "../lib/skill-ledger.js";
import { maybeIssueForAssessment } from "../lib/org-certificates.js";

export async function orgAssessRoutes(app: FastifyInstance) {
  const author = { preHandler: [app.requireAuth, requireOrgCapability("assess:author")] };
  const admin = { preHandler: [app.requireAuth, requireOrgCapability("assess:administer")] };
  const viewer = { preHandler: [app.requireAuth, requireOrgCapability("assess:view-results")] };
  const member = { preHandler: [app.requireAuth, requireOrgMember] };

  // ── Blueprints (assess:author) ─────────────────────────────────────
  app.get("/:orgId/blueprints", author, async (req) => {
    const bps = await prisma.assessmentBlueprint.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: { id: true, name: true, category: true, questionCount: true, durationMin: true, passingScore: true, proctorLevel: true, skillId: true, active: true, _count: { select: { runs: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: bps };
  });

  app.post("/:orgId/blueprints", author, async (req, reply) => {
    const body = z.object({
      name: z.string().trim().min(2).max(80),
      category: z.nativeEnum(McqCategory).default(McqCategory.TECHNICAL),
      questionCount: z.number().int().min(1).max(50).default(10),
      durationMin: z.number().int().min(1).max(180).default(20),
      passingScore: z.number().int().min(0).max(100).default(60),
      proctorLevel: z.number().int().min(0).max(1).default(1),
      skillSlug: z.string().min(1).max(60).nullable().optional(),
    }).parse(req.body);
    const skillId = body.skillSlug ? await findOrCreateSkill(body.skillSlug) : null;
    // Refuse a blueprint that can't be filled — better a clear error than an
    // empty test at run time.
    const available = await prisma.mcqBankQuestion.count({ where: { active: true, category: body.category } });
    if (available < body.questionCount) {
      return reply.code(400).send({ success: false, error: { code: "BANK_TOO_SMALL", message: `Only ${available} active questions in ${body.category}; need ${body.questionCount}.` } });
    }
    const { skillSlug: _s, ...rest } = body;
    const bp = await prisma.assessmentBlueprint.create({ data: { ...rest, orgId: req.orgCtx!.orgId, skillId } });
    await recordAudit(req, { action: "create", entity: "org-blueprint", entityId: bp.id, summary: `Assessment "${bp.name}" (${bp.category} × ${bp.questionCount})` });
    return reply.code(201).send({ success: true, data: bp });
  });

  // ── Runs (assess:administer) ───────────────────────────────────────
  app.get("/:orgId/runs", viewer, async (req) => {
    const runs = await prisma.assessmentRun.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: {
        id: true, purpose: true, windowStart: true, windowEnd: true,
        blueprint: { select: { name: true, passingScore: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: runs };
  });

  app.post("/:orgId/runs", admin, async (req, reply) => {
    const body = z.object({
      blueprintId: z.string(),
      purpose: z.nativeEnum(AssessmentPurpose).default(AssessmentPurpose.TRAINING),
      windowEnd: z.string().datetime().nullable().optional(),
    }).parse(req.body);
    const bp = await prisma.assessmentBlueprint.findFirst({ where: { id: body.blueprintId, orgId: req.orgCtx!.orgId, active: true }, select: { id: true } });
    if (!bp) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Blueprint not found." } });
    const run = await prisma.assessmentRun.create({
      data: { orgId: req.orgCtx!.orgId, blueprintId: body.blueprintId, purpose: body.purpose, windowEnd: body.windowEnd ? new Date(body.windowEnd) : null },
    });
    return reply.code(201).send({ success: true, data: run });
  });

  app.get("/:orgId/runs/:runId/results", viewer, async (req, reply) => {
    // Aggregate over all candidates — own-scope (MEMBER/INTERN) can't see it.
    if (req.orgCtx!.scope === "own") {
      return reply.code(403).send({ success: false, error: { code: "OUT_OF_SCOPE", message: "Run results are a team view." } });
    }
    const { runId } = req.params as { runId: string };
    const run = await prisma.assessmentRun.findFirst({
      where: { id: runId, orgId: req.orgCtx!.orgId },
      include: { blueprint: { select: { name: true, passingScore: true } }, attempts: { include: {} } },
    });
    if (!run) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Run not found." } });
    const users = await prisma.user.findMany({ where: { id: { in: run.attempts.map((a) => a.userId) } }, select: { id: true, name: true } });
    const nameOf = new Map(users.map((u) => [u.id, u.name]));
    const rows = run.attempts
      .map((a) => ({
        name: nameOf.get(a.userId) ?? "—",
        score: a.score,
        passed: a.score != null && a.score >= run.blueprint.passingScore,
        integrityScore: a.integrityScore,
        status: a.status,
        submittedAt: a.submittedAt,
      }))
      .sort((x, y) => (y.score ?? -1) - (x.score ?? -1));
    const submitted = rows.filter((r) => r.status === "SUBMITTED");
    return {
      success: true,
      data: {
        run: { name: run.blueprint.name, purpose: run.purpose, passingScore: run.blueprint.passingScore },
        stats: {
          attempts: rows.length,
          submitted: submitted.length,
          passed: submitted.filter((r) => r.passed).length,
          avgScore: submitted.length ? Math.round(submitted.reduce((a, r) => a + (r.score ?? 0), 0) / submitted.length) : null,
        },
        rows,
      },
    };
  });

  // ── Candidate flow (/work) ─────────────────────────────────────────
  app.get("/:orgId/work/assessments", member, async (req) => {
    const now = new Date();
    const runs = await prisma.assessmentRun.findMany({
      where: { orgId: req.orgCtx!.orgId, windowStart: { lte: now }, OR: [{ windowEnd: null }, { windowEnd: { gte: now } }] },
      select: {
        id: true, purpose: true, windowEnd: true,
        blueprint: { select: { name: true, durationMin: true, questionCount: true, passingScore: true } },
        attempts: { where: { userId: req.session!.id }, select: { status: true, score: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      data: runs.map((r) => ({
        runId: r.id, name: r.blueprint.name, purpose: r.purpose,
        durationMin: r.blueprint.durationMin, questionCount: r.blueprint.questionCount, passingScore: r.blueprint.passingScore,
        windowEnd: r.windowEnd,
        myStatus: r.attempts[0]?.status ?? "NOT_STARTED",
        myScore: r.attempts[0]?.score ?? null,
      })),
    };
  });

  // Start — freezes a randomized draw; questions returned WITHOUT answers.
  app.post("/:orgId/runs/:runId/start", member, async (req, reply) => {
    const { runId } = req.params as { runId: string };
    const run = await prisma.assessmentRun.findFirst({
      where: { id: runId, orgId: req.orgCtx!.orgId },
      include: { blueprint: true },
    });
    if (!run) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Run not found." } });
    const now = new Date();
    if (run.windowEnd && run.windowEnd < now) {
      return reply.code(409).send({ success: false, error: { code: "WINDOW_CLOSED", message: "This assessment window has closed." } });
    }

    const existing = await prisma.assessmentAttempt.findUnique({ where: { runId_userId: { runId, userId: req.session!.id } } });
    if (existing) {
      if (existing.status !== "IN_PROGRESS") {
        return reply.code(409).send({ success: false, error: { code: "ALREADY_SUBMITTED", message: "You've already taken this assessment." } });
      }
      // Resume — return the frozen set (sans answers).
      const qs = await questionsForClient(existing.questionIds);
      return { success: true, data: { attemptId: existing.id, durationMin: run.blueprint.durationMin, proctorLevel: run.blueprint.proctorLevel, questions: qs } };
    }

    const pool = await prisma.mcqBankQuestion.findMany({ where: { active: true, category: run.blueprint.category }, select: { id: true } });
    const drawn = [...pool].sort(() => Math.random() - 0.5).slice(0, run.blueprint.questionCount).map((q) => q.id);
    if (drawn.length === 0) {
      return reply.code(409).send({ success: false, error: { code: "NO_QUESTIONS", message: "No questions available for this assessment." } });
    }
    const attempt = await prisma.assessmentAttempt.create({ data: { runId, userId: req.session!.id, questionIds: drawn } });
    const qs = await questionsForClient(drawn);
    return { success: true, data: { attemptId: attempt.id, durationMin: run.blueprint.durationMin, proctorLevel: run.blueprint.proctorLevel, questions: qs } };
  });

  // Submit — scores against the frozen set, applies L1 integrity, and emits
  // Skill Ledger evidence at ASSESSMENT weight.
  app.post("/:orgId/attempts/:attemptId/submit", member, async (req, reply) => {
    const { attemptId } = req.params as { attemptId: string };
    const body = z.object({
      answers: z.array(z.object({ questionId: z.string(), choice: z.number().int().min(-1).max(9) })).max(50),
      proctorEvents: z.number().int().min(0).max(1000).default(0),
    }).parse(req.body);

    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, userId: req.session!.id, run: { orgId: req.orgCtx!.orgId } },
      include: { run: { include: { blueprint: true } } },
    });
    if (!attempt) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Attempt not found." } });
    if (attempt.status !== "IN_PROGRESS") {
      return reply.code(409).send({ success: false, error: { code: "ALREADY_SUBMITTED", message: "Already submitted." } });
    }

    // Score only questions in the frozen draw (client can't inject extras).
    const frozen = new Set(attempt.questionIds);
    const answered = body.answers.filter((a) => frozen.has(a.questionId));
    const keys = await prisma.mcqBankQuestion.findMany({ where: { id: { in: attempt.questionIds } }, select: { id: true, correctIndex: true } });
    const correctOf = new Map(keys.map((k) => [k.id, k.correctIndex]));
    const correct = answered.filter((a) => correctOf.get(a.questionId) === a.choice).length;
    const score = Math.round((correct / attempt.questionIds.length) * 100);

    // L1 integrity: each proctor event (tab-blur/fullscreen-exit) costs 10,
    // floored at 50 — the score RANKS review, never auto-fails (PRD §17).
    const integrityScore = attempt.run.blueprint.proctorLevel >= 1 ? Math.max(50, 100 - body.proctorEvents * 10) : 100;

    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { answers: answered, score, integrityScore, proctorEvents: body.proctorEvents, status: "SUBMITTED", submittedAt: new Date() },
    });

    // The payoff: proven performance → higher-trust ledger evidence.
    if (attempt.run.blueprint.skillId) {
      await recordEvidence({
        userId: req.session!.id,
        orgId: req.orgCtx!.orgId,
        skillId: attempt.run.blueprint.skillId,
        level: score,
        weight: EVIDENCE_WEIGHT.ASSESSMENT ?? 1,
        sourceType: "ASSESSMENT",
        sourceId: attemptId,
      });
    }

    const passed = score >= attempt.run.blueprint.passingScore;
    // Auto-issue a certificate if a template vouches for this blueprint.
    await maybeIssueForAssessment({
      userId: req.session!.id,
      orgId: req.orgCtx!.orgId,
      blueprintId: attempt.run.blueprintId,
      score,
      passingScore: attempt.run.blueprint.passingScore,
      skillId: attempt.run.blueprint.skillId,
    });
    return { success: true, data: { score, passed, integrityScore, passingScore: attempt.run.blueprint.passingScore } };
  });
}

/** Bank questions stripped of the answer key, in the frozen order. */
async function questionsForClient(ids: string[]) {
  const rows = await prisma.mcqBankQuestion.findMany({
    where: { id: { in: ids } },
    select: { id: true, prompt: true, choices: true, topic: true, difficulty: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}
