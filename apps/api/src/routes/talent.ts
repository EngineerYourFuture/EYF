/**
 * Student talent-pool consent (PRD §21 — consent-first hiring). Platform-
 * scoped (not org): a student opts into the pool once, choosing anonymity
 * level, and can revoke any time. Only opted-in students are searchable by
 * recruiters (see org-hire.ts). This is a trust primitive, not a feature flag.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, TalentScope } from "@eyf/db";
import { computePlacementFee, DEFAULT_FEE_BPS } from "../services/placement-fee.js";

export async function talentRoutes(app: FastifyInstance) {
  app.get("/consent", { preHandler: app.requireAuth }, async (req) => {
    const consent = await prisma.talentConsent.findUnique({ where: { userId: req.session!.id } });
    return {
      success: true,
      data: consent && !consent.revokedAt
        ? { inPool: true, scope: consent.scope, grantedAt: consent.grantedAt }
        : { inPool: false, scope: null },
    };
  });

  app.post("/consent", { preHandler: app.requireAuth }, async (req) => {
    const { scope } = z.object({ scope: z.nativeEnum(TalentScope).default(TalentScope.POOL_ANON) }).parse(req.body ?? {});
    const consent = await prisma.talentConsent.upsert({
      where: { userId: req.session!.id },
      update: { scope, revokedAt: null, grantedAt: new Date() },
      create: { userId: req.session!.id, scope },
    });
    return { success: true, data: { inPool: true, scope: consent.scope } };
  });

  app.post("/consent/revoke", { preHandler: app.requireAuth }, async (req) => {
    await prisma.talentConsent.updateMany({ where: { userId: req.session!.id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true, data: { inPool: false } };
  });

  // ── Offers the candidate has received (SENT and beyond) ────────────
  app.get("/offers", { preHandler: app.requireAuth }, async (req) => {
    const offers = await prisma.offer.findMany({
      where: { userId: req.session!.id, status: { in: ["SENT", "ACCEPTED", "DECLINED"] } },
      select: { id: true, title: true, ctcInr: true, startDate: true, status: true, sentAt: true, req: { select: { org: { select: { name: true } } } } },
      orderBy: { sentAt: "desc" },
    });
    return { success: true, data: offers.map((o) => ({ id: o.id, title: o.title, ctcInr: o.ctcInr, startDate: o.startDate, status: o.status, company: o.req.org.name })) };
  });

  // Respond — accept flips the F10 spine: the candidate's B2C profile becomes
  // an org membership (MEMBER), and the pipeline card moves to HIRED. Same
  // profile from campus to career (PRD §21 / F10).
  app.post("/offers/:offerId/respond", { preHandler: app.requireAuth }, async (req, reply) => {
    const { offerId } = req.params as { offerId: string };
    const { accept } = z.object({ accept: z.boolean() }).parse(req.body ?? {});
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, userId: req.session!.id },
      include: { req: { select: { id: true, orgId: true } } },
    });
    if (!offer) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Offer not found." } });
    if (offer.status !== "SENT") return reply.code(409).send({ success: false, error: { code: "BAD_STATE", message: "This offer can no longer be responded to." } });

    if (!accept) {
      const declined = await prisma.offer.update({ where: { id: offerId }, data: { status: "DECLINED", respondedAt: new Date() } });
      return { success: true, data: { status: declined.status } };
    }

    await prisma.$transaction(async (tx) => {
      await tx.offer.update({ where: { id: offerId }, data: { status: "ACCEPTED", respondedAt: new Date() } });
      await tx.pipelineCandidate.updateMany({ where: { reqId: offer.req.id, userId: req.session!.id }, data: { stage: "HIRED" } });
      // The carry-over: hire becomes a member. Idempotent — a re-accept or an
      // existing membership (e.g. former intern) just stays ACTIVE.
      await tx.orgMember.upsert({
        where: { orgId_userId: { orgId: offer.req.orgId, userId: req.session!.id } },
        update: { status: "ACTIVE" },
        create: { orgId: offer.req.orgId, userId: req.session!.id, roles: ["MEMBER"] },
      });
      // Record the employer placement fee (Roadmap C1). Only on paid offers —
      // unpaid internships owe nothing. Upsert keeps it idempotent; the SENT
      // guard above means this normally runs exactly once per offer.
      if (offer.ctcInr > 0) {
        const feeInr = computePlacementFee(offer.ctcInr, DEFAULT_FEE_BPS);
        await tx.placementFee.upsert({
          where: { offerId },
          create: { offerId, orgId: offer.req.orgId, ctcInr: offer.ctcInr, feeBps: DEFAULT_FEE_BPS, feeInr },
          update: {},
        });
      }
    });
    return { success: true, data: { status: "ACCEPTED", joinedOrgId: offer.req.orgId } };
  });
}
