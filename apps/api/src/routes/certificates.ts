import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma, CertificateType } from "@eyf/db";
import { renderCertificatePdf } from "../services/pdf.js";
import { requirePermission } from "../middleware/permissions.js";

export async function certificateRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: app.requireAuth }, async (req) => {
    const list = await prisma.certificate.findMany({
      where: { userId: req.session!.id },
      orderBy: { issuedAt: "desc" },
    });
    return { success: true, data: list };
  });

  // Public verification — anyone with the code can confirm.
  app.get("/verify/:code", async (req, reply) => {
    const { code } = z.object({ code: z.string() }).parse(req.params);
    const cert = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      include: { user: { select: { name: true, college: true } } },
    });
    if (!cert) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "No such certificate." } });
    // Org certs may be revoked — verify reflects it instantly (PRD §15.9).
    const issuer = cert.orgId ? await prisma.organization.findUnique({ where: { id: cert.orgId }, select: { name: true } }) : null;
    return {
      success: true,
      data: {
        title: cert.title, score: cert.score, type: cert.type,
        issuedAt: cert.issuedAt, recipient: cert.user.name, college: cert.user.college,
        issuer: issuer?.name ?? null,
        skillsAsserted: cert.skillsAsserted ?? null,
        revoked: cert.revokedAt != null,
        revokeReason: cert.revokeReason ?? null,
      },
    };
  });

  app.get("/:id/pdf", async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const cert = await prisma.certificate.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });
    if (!cert) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
    const pdf = await renderCertificatePdf({
      name: cert.user.name,
      title: cert.title,
      score: cert.score,
      verificationCode: cert.verificationCode,
      issuedAt: cert.issuedAt,
    });
    return reply
      .header("content-type", "application/pdf")
      .header("content-disposition", `inline; filename="cert-${cert.verificationCode}.pdf"`)
      .send(pdf);
  });

  // Issue a certificate. Admin-only — clients earn certs via system events,
  // not by self-minting (the body takes an arbitrary userId).
  app.post("/issue", { preHandler: [app.requireAuth, requirePermission("issue:certificates")] }, async (req) => {
    const body = z.object({
      userId: z.string(),
      type: z.nativeEnum(CertificateType),
      title: z.string(),
      score: z.number().int().optional(),
      metadata: z.record(z.unknown()).optional(),
    }).parse(req.body);
    const code = randomBytes(8).toString("hex").toUpperCase();
    const cert = await prisma.certificate.create({
      data: {
        userId: body.userId,
        type: body.type,
        title: body.title,
        score: body.score,
        metadata: (body.metadata as object | undefined) ?? undefined,
        verificationCode: code,
      },
    });
    return { success: true, data: cert };
  });
}
