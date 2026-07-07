/**
 * Hiring — Phase 3 EPIC-16/17 (PRD §21), the payoff: recruiters hire on
 * evidence, not résumés. Consent-first (only opted-in students are searchable),
 * ranked by the real Readiness Index, with full evidence profiles that read
 * the Skill Ledger + certificates + coding history already built in Phase 2.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, RequisitionStatus, PipelineStage } from "@eyf/db";
import { requireOrgCapability } from "../middleware/org.js";
import { recordAudit } from "../lib/audit.js";
import { computeUserReadiness } from "../services/guidance.js";
import { memberLedger } from "../lib/skill-ledger.js";

/** Full evidence profile for one candidate — the screen that replaces the CV.
 *  POOL_ANON hides identity until shortlisted. */
async function evidenceProfile(userId: string, reveal: boolean) {
  const [{ readiness }, user, certs, evidence] = await Promise.all([
    computeUserReadiness(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, college: true, graduationYear: true, targetRole: true } }),
    prisma.certificate.findMany({ where: { userId, revokedAt: null }, select: { title: true, score: true, skillsAsserted: true, issuedAt: true, verificationCode: true } }),
    // platform-wide skill evidence (B2C) — orgId null
    prisma.skillSnapshot.findMany({ where: { userId, orgId: null }, orderBy: { level: "desc" }, take: 20 }),
  ]);
  const skillIds = evidence.map((e) => e.skillId);
  const skills = skillIds.length ? await prisma.skill.findMany({ where: { id: { in: skillIds } }, select: { id: true, slug: true } }) : [];
  const slugOf = new Map(skills.map((s) => [s.id, s.slug]));
  return {
    identity: reveal ? { name: user?.name, email: user?.email, college: user?.college, graduationYear: user?.graduationYear } : { name: `Candidate ${userId.slice(-4)}`, anon: true },
    targetRole: user?.targetRole ?? null,
    readiness: { overall: readiness.overall, band: readiness.band, pillars: readiness.pillars.map((p) => ({ key: p.key, label: p.label, score: p.score })) },
    certificates: certs.map((c) => ({ title: c.title, score: c.score, skills: c.skillsAsserted, verifyCode: c.verificationCode })),
    skills: evidence.map((e) => ({ slug: slugOf.get(e.skillId) ?? e.skillId, level: e.level })),
  };
}

export async function orgHireRoutes(app: FastifyInstance) {
  const search = { preHandler: [app.requireAuth, requireOrgCapability("talent:search")] };
  const pipeline = { preHandler: [app.requireAuth, requireOrgCapability("hire:pipeline")] };

  // ── Talent pool search (consented students, ranked by readiness) ────
  app.get("/:orgId/talent/search", search, async (req) => {
    const q = z.object({
      minReadiness: z.coerce.number().int().min(0).max(100).default(0),
      gradYear: z.coerce.number().int().optional(),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(req.query);

    // Consent is the gate — only opted-in, non-revoked students appear.
    const consents = await prisma.talentConsent.findMany({
      where: { revokedAt: null },
      select: { userId: true, scope: true },
    });
    const users = consents.length
      ? await prisma.user.findMany({
          where: { id: { in: consents.map((c) => c.userId) }, deletedAt: null, ...(q.gradYear ? { graduationYear: q.gradYear } : {}) },
          select: { id: true, name: true, college: true, graduationYear: true },
        })
      : [];
    const scopeOf = new Map(consents.map((c) => [c.userId, c.scope]));

    // Rank by real Readiness (v1 synchronous; precompute at scale).
    const scored = await Promise.all(
      users.map(async (u) => {
        const { readiness } = await computeUserReadiness(u.id);
        const anon = scopeOf.get(u.id) === "POOL_ANON";
        return {
          userId: u.id,
          name: anon ? `Candidate ${u.id.slice(-4)}` : u.name,
          college: anon ? null : u.college,
          gradYear: u.graduationYear,
          anon,
          readiness: readiness.overall,
          band: readiness.band,
        };
      }),
    );
    const ranked = scored.filter((s) => s.readiness >= q.minReadiness).sort((a, b) => b.readiness - a.readiness).slice(0, q.limit);
    return { success: true, data: { total: ranked.length, candidates: ranked } };
  });

  app.get("/:orgId/talent/:userId/profile", search, async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const consent = await prisma.talentConsent.findFirst({ where: { userId, revokedAt: null } });
    if (!consent) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Candidate not in the pool." } });
    // Reveal identity if the student is POOL_FULL, or already in this org's pipeline.
    const inPipeline = await prisma.pipelineCandidate.findFirst({ where: { userId, req: { orgId: req.orgCtx!.orgId } }, select: { id: true } });
    const reveal = consent.scope === "POOL_FULL" || !!inPipeline;
    return { success: true, data: await evidenceProfile(userId, reveal) };
  });

  // ── Requisitions + pipeline ────────────────────────────────────────
  app.get("/:orgId/requisitions", pipeline, async (req) => {
    const reqs = await prisma.jobRequisition.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: { id: true, title: true, status: true, minReadiness: true, roleBarId: true, createdAt: true, _count: { select: { candidates: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: reqs };
  });

  app.post("/:orgId/requisitions", pipeline, async (req, reply) => {
    const body = z.object({ title: z.string().trim().min(2).max(100), roleBarId: z.string().nullable().optional(), minReadiness: z.number().int().min(0).max(100).default(0) }).parse(req.body);
    if (body.roleBarId) {
      const bar = await prisma.roleBar.findFirst({ where: { id: body.roleBarId, orgId: req.orgCtx!.orgId }, select: { id: true } });
      if (!bar) return reply.code(400).send({ success: false, error: { code: "VALIDATION", message: "Role bar not in this org." } });
    }
    const created = await prisma.jobRequisition.create({ data: { orgId: req.orgCtx!.orgId, ...body, hiringManagerId: req.orgCtx!.memberId } });
    await recordAudit(req, { action: "create", entity: "org-requisition", entityId: created.id, summary: `Requisition "${created.title}"` });
    return reply.code(201).send({ success: true, data: created });
  });

  app.get("/:orgId/requisitions/:reqId/pipeline", pipeline, async (req, reply) => {
    const { reqId } = req.params as { reqId: string };
    const requisition = await prisma.jobRequisition.findFirst({ where: { id: reqId, orgId: req.orgCtx!.orgId }, select: { id: true, title: true } });
    if (!requisition) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Requisition not found." } });
    const cands = await prisma.pipelineCandidate.findMany({ where: { reqId }, orderBy: [{ stage: "asc" }, { fitScore: "desc" }] });
    const users = await prisma.user.findMany({ where: { id: { in: cands.map((c) => c.userId) } }, select: { id: true, name: true } });
    const nameOf = new Map(users.map((u) => [u.id, u.name]));
    return {
      success: true,
      data: {
        requisition,
        candidates: cands.map((c) => ({ id: c.id, userId: c.userId, name: nameOf.get(c.userId) ?? "—", stage: c.stage, fitScore: c.fitScore, source: c.source })),
      },
    };
  });

  // Shortlist — freeze an evidence snapshot at sourcing time (PRD §21).
  app.post("/:orgId/requisitions/:reqId/candidates", pipeline, async (req, reply) => {
    const { reqId } = req.params as { reqId: string };
    const { userId } = z.object({ userId: z.string() }).parse(req.body);
    const requisition = await prisma.jobRequisition.findFirst({ where: { id: reqId, orgId: req.orgCtx!.orgId }, select: { id: true } });
    if (!requisition) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Requisition not found." } });
    const consent = await prisma.talentConsent.findFirst({ where: { userId, revokedAt: null }, select: { id: true } });
    if (!consent) return reply.code(409).send({ success: false, error: { code: "NO_CONSENT", message: "This candidate is not in the talent pool." } });

    const { readiness } = await computeUserReadiness(userId);
    const cand = await prisma.pipelineCandidate.upsert({
      where: { reqId_userId: { reqId, userId } },
      update: {},
      create: { reqId, userId, fitScore: readiness.overall, evidenceSnapshot: { readiness: readiness.overall, band: readiness.band, at: new Date().toISOString() } },
    });
    return reply.code(201).send({ success: true, data: cand });
  });

  app.patch("/:orgId/candidates/:candId", pipeline, async (req, reply) => {
    const { candId } = req.params as { candId: string };
    const body = z.object({ stage: z.nativeEnum(PipelineStage).optional(), note: z.string().max(500).optional() }).parse(req.body);
    const cand = await prisma.pipelineCandidate.findFirst({ where: { id: candId, req: { orgId: req.orgCtx!.orgId } }, select: { id: true } });
    if (!cand) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Candidate not found." } });
    const updated = await prisma.pipelineCandidate.update({ where: { id: candId }, data: body });
    return { success: true, data: updated };
  });

  // Close/pause a requisition.
  app.patch("/:orgId/requisitions/:reqId", pipeline, async (req, reply) => {
    const { reqId } = req.params as { reqId: string };
    const body = z.object({ status: z.nativeEnum(RequisitionStatus) }).parse(req.body);
    const requisition = await prisma.jobRequisition.findFirst({ where: { id: reqId, orgId: req.orgCtx!.orgId }, select: { id: true } });
    if (!requisition) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Requisition not found." } });
    const updated = await prisma.jobRequisition.update({ where: { id: reqId }, data: body });
    return { success: true, data: updated };
  });
}
