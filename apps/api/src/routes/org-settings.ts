/**
 * Org settings — Phase 4 (PRD §24): white-label branding, API keys, webhooks.
 * All gated by org:branding / org:manage (OWNER/ADMIN). Public branding read is
 * unauthenticated so the login/verify chrome can theme before auth.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@eyf/db";
import { requireOrgCapability } from "../middleware/org.js";
import { recordAudit } from "../lib/audit.js";
import { mintApiKey } from "../lib/api-keys.js";
import { newWebhookSecret } from "../lib/webhooks.js";
import { assertPublicUrl } from "../lib/ssrf.js";

const WEBHOOK_EVENTS = [
  "member.joined", "cohort.completed", "enrollment.stuck", "assessment.submitted",
  "certificate.issued", "certificate.revoked", "offer.accepted", "pipeline.stage_changed",
] as const;

export async function orgSettingsRoutes(app: FastifyInstance) {
  const branding = { preHandler: [app.requireAuth, requireOrgCapability("org:branding")] };
  const manage = { preHandler: [app.requireAuth, requireOrgCapability("org:manage")] };

  // Public branding — no auth (themes the login shell / verify page).
  app.get("/:orgId/branding", async (req, reply) => {
    const { orgId } = req.params as { orgId: string };
    const org = await prisma.organization.findFirst({
      where: { OR: [{ id: orgId }, { slug: orgId }] },
      select: { name: true, slug: true, logoUrl: true, brandColor: true, plan: true },
    });
    if (!org) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Not found." } });
    // White-label (custom colors/logo) is Business+.
    const whiteLabel = org.plan === "BUSINESS" || org.plan === "ENTERPRISE" || org.plan === "EDUCATION";
    return { success: true, data: { name: org.name, slug: org.slug, logoUrl: org.logoUrl, brandColor: whiteLabel ? org.brandColor : null } };
  });

  app.patch("/:orgId/branding", branding, async (req) => {
    const body = z.object({
      logoUrl: z.string().url().nullable().optional(),
      brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
    }).parse(req.body);
    const updated = await prisma.organization.update({
      where: { id: req.orgCtx!.orgId },
      data: body,
      select: { logoUrl: true, brandColor: true },
    });
    await recordAudit(req, { action: "update", entity: "org-branding", entityId: req.orgCtx!.orgId, summary: "Updated branding" });
    return { success: true, data: updated };
  });

  // ── API keys ───────────────────────────────────────────────────────
  app.get("/:orgId/api-keys", manage, async (req) => {
    const keys = await prisma.apiKey.findMany({
      where: { orgId: req.orgCtx!.orgId, revokedAt: null },
      select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: keys };
  });

  app.post("/:orgId/api-keys", manage, async (req, reply) => {
    const body = z.object({ name: z.string().trim().min(1).max(60), scopes: z.array(z.string()).max(20).default([]) }).parse(req.body);
    const { raw, prefix, hashedKey } = mintApiKey();
    const key = await prisma.apiKey.create({ data: { orgId: req.orgCtx!.orgId, name: body.name, prefix, hashedKey, scopes: body.scopes } });
    await recordAudit(req, { action: "create", entity: "org-api-key", entityId: key.id, summary: `Created API key "${body.name}"` });
    // The ONLY time the raw key is returned.
    return reply.code(201).send({ success: true, data: { id: key.id, name: key.name, key: raw, prefix, scopes: key.scopes } });
  });

  app.post("/:orgId/api-keys/:keyId/revoke", manage, async (req, reply) => {
    const { keyId } = req.params as { keyId: string };
    const key = await prisma.apiKey.findFirst({ where: { id: keyId, orgId: req.orgCtx!.orgId, revokedAt: null }, select: { id: true } });
    if (!key) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Key not found." } });
    await prisma.apiKey.update({ where: { id: keyId }, data: { revokedAt: new Date() } });
    return { success: true, data: { id: keyId, revoked: true } };
  });

  // ── Webhooks ─────────────────────────────────────────────────────────
  app.get("/:orgId/webhooks", manage, async (req) => {
    const hooks = await prisma.webhookEndpoint.findMany({
      where: { orgId: req.orgCtx!.orgId },
      select: { id: true, url: true, events: true, active: true, failCount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: { endpoints: hooks, availableEvents: WEBHOOK_EVENTS } };
  });

  app.post("/:orgId/webhooks", manage, async (req, reply) => {
    const body = z.object({
      url: z.string().url(),
      events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
    }).parse(req.body);
    // SSRF guard: reject non-https / private / metadata targets before we store
    // the endpoint (re-checked again at delivery time against DNS rebinding).
    try {
      await assertPublicUrl(body.url);
    } catch (e) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_WEBHOOK_URL", message: e instanceof Error ? e.message : "Invalid URL." },
      });
    }
    const secret = newWebhookSecret();
    const ep = await prisma.webhookEndpoint.create({ data: { orgId: req.orgCtx!.orgId, url: body.url, events: body.events, secret } });
    // The signing secret is shown once so the receiver can verify signatures.
    return reply.code(201).send({ success: true, data: { id: ep.id, url: ep.url, events: ep.events, secret } });
  });

  app.get("/:orgId/webhooks/:hookId/deliveries", manage, async (req, reply) => {
    const { hookId } = req.params as { hookId: string };
    const ep = await prisma.webhookEndpoint.findFirst({ where: { id: hookId, orgId: req.orgCtx!.orgId }, select: { id: true } });
    if (!ep) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Endpoint not found." } });
    const deliveries = await prisma.webhookDelivery.findMany({ where: { endpointId: hookId }, select: { event: true, status: true, attempts: true, lastAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 });
    return { success: true, data: deliveries };
  });

  app.post("/:orgId/webhooks/:hookId/delete", manage, async (req, reply) => {
    const { hookId } = req.params as { hookId: string };
    const ep = await prisma.webhookEndpoint.findFirst({ where: { id: hookId, orgId: req.orgCtx!.orgId }, select: { id: true } });
    if (!ep) return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Endpoint not found." } });
    await prisma.webhookEndpoint.delete({ where: { id: hookId } });
    return { success: true, data: { id: hookId } };
  });
}
