/**
 * Org certificate management (PRD §15.9). Templates (skill-anchored, optional
 * auto-issue on a blueprint pass), the issued registry, and revocation — which
 * propagates instantly to the public /verify page (checked there on every read).
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { requireOrgCapability } from "../middleware/org.js";
import { recordAudit } from "../lib/audit.js";
import { issueCertificate } from "../lib/org-certificates.js";

export async function orgCertificatesRoutes(app: FastifyInstance) {
  // Templates/issuance are a content power (manage:content); revoke too.
  const manage = { preHandler: [app.requireAuth, requireOrgCapability("learn:author")] };

  app.get("/:orgId/cert-templates", manage, async (req) => {
    const templates = await prisma.certificateTemplate.findMany({
      where: { orgId: req.orgCtx!.orgId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: templates };
  });

  app.post("/:orgId/cert-templates", manage, async (req, reply) => {
    const body = z.object({
      name: z.string().trim().min(2).max(80),
      skills: z.array(z.object({ slug: z.string().min(1).max(60), level: z.number().int().min(0).max(100) })).max(20).default([]),
      criteria: z.enum(["ASSESSMENT_PASS", "MANUAL"]).default("MANUAL"),
      blueprintId: z.string().nullable().optional(),
    }).parse(req.body);
    if (body.criteria === "ASSESSMENT_PASS") {
      if (!body.blueprintId) return reply.code(400).send({ success: false, error: { code: "VALIDATION", message: "ASSESSMENT_PASS needs a blueprintId." } });
      const bp = await prisma.assessmentBlueprint.findFirst({ where: { id: body.blueprintId, orgId: req.orgCtx!.orgId }, select: { id: true } });
      if (!bp) return reply.code(400).send({ success: false, error: { code: "VALIDATION", message: "Blueprint not in this org." } });
    }
    const tpl = await prisma.certificateTemplate.create({
      data: { orgId: req.orgCtx!.orgId, name: body.name, skills: body.skills, criteria: body.criteria, blueprintId: body.blueprintId ?? null },
    });
    await recordAudit(req, { action: "create", entity: "org-cert-template", entityId: tpl.id, summary: `Cert template "${tpl.name}"` });
    return reply.code(201).send({ success: true, data: tpl });
  });

  // Manual issue to a member (MANUAL templates, or a reviewer override).
  app.post("/:orgId/cert-templates/:templateId/issue", manage, async (req, reply) => {
    const { templateId } = req.params as { templateId: string };
    const { memberId } = z.object({ memberId: z.string() }).parse(req.body);
    const [tpl, member] = await Promise.all([
      prisma.certificateTemplate.findFirst({ where: { id: templateId, orgId: req.orgCtx!.orgId } }),
      prisma.orgMember.findFirst({ where: { id: memberId, orgId: req.orgCtx!.orgId }, select: { userId: true } }),
    ]);
    if (!tpl || !member) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Template or member not found." } });
    const cert = await issueCertificate({
      userId: member.userId, orgId: req.orgCtx!.orgId, templateId,
      title: tpl.name, score: null,
      skillsAsserted: (tpl.skills as { slug: string; level: number }[]) ?? [],
    });
    await recordAudit(req, { action: "create", entity: "certificate", entityId: cert?.id ?? "-", summary: `Issued "${tpl.name}"` });
    return reply.code(201).send({ success: true, data: cert });
  });

  app.get("/:orgId/certificates", manage, async (req) => {
    const certs = await prisma.certificate.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: { id: true, title: true, score: true, verificationCode: true, issuedAt: true, revokedAt: true, skillsAsserted: true, user: { select: { name: true } } },
      orderBy: { issuedAt: "desc" },
      take: 200,
    });
    return { success: true, data: certs };
  });

  app.post("/:orgId/certificates/:certId/revoke", manage, async (req, reply) => {
    const { certId } = req.params as { certId: string };
    const { reason } = z.object({ reason: z.string().max(200).optional() }).parse(req.body ?? {});
    const cert = await prisma.certificate.findFirst({ where: { id: certId, orgId: req.orgCtx!.orgId }, select: { id: true, revokedAt: true } });
    if (!cert) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Certificate not found." } });
    if (cert.revokedAt) return reply.code(409).send({ success: false, error: { code: "ALREADY_REVOKED", message: "Already revoked." } });
    await prisma.certificate.update({ where: { id: certId }, data: { revokedAt: new Date(), revokeReason: reason ?? null } });
    await recordAudit(req, { action: "update", entity: "certificate", entityId: certId, summary: `Revoked certificate: ${reason ?? "no reason"}` });
    return { success: true, data: { id: certId, revoked: true } };
  });
}
