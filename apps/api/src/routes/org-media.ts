import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { z } from "zod";
import { canInOrg } from "@eyf/types";
import { env } from "../env.js";
import { requireOrgCapability, requireOrgMember } from "../middleware/org.js";
import { withOrgContext } from "../lib/org-scoped.js";
import { accountError, lockOrganization } from "../lib/org-accounts.js";
import { recordAudit } from "../lib/audit.js";
import { readBlocks } from "../lib/lms.js";
import { MEDIA_TYPES, mediaId, mediaPath, mediaRange, readMedia, removeMedia, storeMedia } from "../services/private-media.js";

const ticketInput = z.object({ purpose: z.literal("lesson-media"), sub: z.string(), orgId: z.string(), assetId: mediaId, lessonId: z.string().optional() });

async function accessibleMedia(orgId: string, assetId: string, userId: string, lessonId?: string) {
  return withOrgContext(orgId, async (tx) => {
    const member = await tx.orgMember.findFirst({ where: { orgId, userId, status: "ACTIVE", user: { deletedAt: null } } });
    if (!member) return null;
    const asset = await tx.mediaAsset.findFirst({ where: { id: assetId, orgId } });
    if (!asset) return null;
    if (canInOrg(member.roles, "learn:author").granted) return asset;
    if (!lessonId) return null;
    const lesson = await tx.lesson.findFirst({ where: { id: lessonId, course: { orgId, published: true, status: "PUBLISHED" } }, select: { blocks: true } });
    return readBlocks(lesson?.blocks).some((b) => b.data.assetId === assetId || b.data.captionsAssetId === assetId) ? asset : null;
  });
}

export async function orgMediaRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: env.PRIVATE_MEDIA_MAX_MB * 1024 * 1024, files: 1, fields: 0, parts: 1 } });

  app.post("/:orgId/media", { onRequest: [app.requireAuth, requireOrgCapability("learn:author")], config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req, reply) => {
    const orgId = req.orgCtx!.orgId;
    const id = randomUUID();
    let asset;
    try {
      for await (const part of req.parts()) {
        if (part.type !== "file" || !MEDIA_TYPES.has(part.mimetype)) throw accountError(415, "MEDIA_TYPE", "Upload an image, MP4/WebM video, audio, PDF, text, CSV, captions or ZIP file.");
        const size = await storeMedia(id, part.file);
        if (part.file.truncated) throw accountError(413, "MEDIA_TOO_LARGE", `Files must be at most ${env.PRIVATE_MEDIA_MAX_MB} MB.`);
        if (!size) throw accountError(400, "EMPTY_FILE", "Choose a nonempty file.");
        asset = { id, orgId, filename: part.filename.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 180) || "attachment", contentType: part.mimetype, size };
      }
      if (!asset) throw accountError(400, "FILE_REQUIRED", "Choose a file to upload.");
      const upload = asset;
      const data = await withOrgContext(orgId, async (tx) => {
        await lockOrganization(tx, orgId);
        const used = await tx.mediaAsset.aggregate({ where: { orgId }, _sum: { size: true } });
        if ((used._sum.size ?? 0) + upload.size > env.PRIVATE_MEDIA_ORG_LIMIT_MB * 1024 * 1024) throw accountError(409, "STORAGE_FULL", "Your workspace storage is full. Remove unused uploads or contact EYF.");
        return tx.mediaAsset.create({ data: upload });
      });
      await recordAudit(req, { action: "create", entity: "org-media", entityId: id, summary: `Uploaded private media (${data.size} bytes)` });
      return reply.code(201).send({ success: true, data });
    } catch (error) {
      await removeMedia(id);
      throw error;
    }
  });

  app.get("/:orgId/media", { preHandler: [app.requireAuth, requireOrgCapability("learn:author")] }, async (req) => ({
    success: true, data: await withOrgContext(req.orgCtx!.orgId, (tx) => tx.mediaAsset.findMany({ where: { orgId: req.orgCtx!.orgId }, orderBy: { createdAt: "desc" }, take: 100 })),
  }));

  app.delete("/:orgId/media/:assetId", { preHandler: [app.requireAuth, requireOrgCapability("learn:author")] }, async (req) => {
    const { assetId } = z.object({ assetId: mediaId }).parse(req.params);
    const orgId = req.orgCtx!.orgId;
    await withOrgContext(orgId, async (tx) => {
      await lockOrganization(tx, orgId);
      const asset = await tx.mediaAsset.findFirst({ where: { id: assetId, orgId } });
      if (!asset) throw accountError(404, "NOT_FOUND", "Upload not found.");
      const references = await tx.lesson.count({ where: { course: { orgId }, OR: [{ blocks: { array_contains: [{ data: { assetId } }] } }, { blocks: { array_contains: [{ data: { captionsAssetId: assetId } }] } }] } });
      if (references) throw accountError(409, "MEDIA_IN_USE", "This upload is used by a lesson. Remove it from all lessons before deleting.");
      await tx.mediaAsset.delete({ where: { id: assetId } });
    });
    await removeMedia(assetId);
    await recordAudit(req, { action: "delete", entity: "org-media", entityId: assetId, summary: "Removed unused private upload" });
    return { success: true, data: { deleted: true } };
  });

  app.post("/:orgId/media/:assetId/access", { preHandler: [app.requireAuth, requireOrgMember] }, async (req) => {
    const { assetId } = z.object({ assetId: mediaId }).parse(req.params);
    const { lessonId } = z.object({ lessonId: z.string().optional() }).parse(req.body ?? {});
    const orgId = req.orgCtx!.orgId;
    const asset = await accessibleMedia(orgId, assetId, req.session!.id, lessonId);
    if (!asset) throw accountError(404, "NOT_FOUND", "This media is unavailable.");
    const ticket = app.jwt.sign({ purpose: "lesson-media", sub: req.session!.id, orgId, assetId, lessonId }, { expiresIn: "5m" });
    return { success: true, data: { path: `/orgs/${orgId}/media/${assetId}/content?ticket=${ticket}`, contentType: asset.contentType, filename: asset.filename, expiresIn: 300 } };
  });

  app.get("/:orgId/media/:assetId/content", async (req, reply) => {
    const { orgId, assetId } = z.object({ orgId: z.string(), assetId: mediaId }).parse(req.params);
    const { ticket } = z.object({ ticket: z.string().max(2048) }).parse(req.query);
    let claims;
    try { claims = ticketInput.parse(app.jwt.verify(ticket)); }
    catch { throw accountError(401, "MEDIA_EXPIRED", "This media link expired. Reopen it from your lesson."); }
    if (claims.orgId !== orgId || claims.assetId !== assetId) throw accountError(404, "NOT_FOUND", "This media is unavailable.");
    const asset = await accessibleMedia(orgId, assetId, claims.sub, claims.lessonId);
    if (!asset) throw accountError(404, "NOT_FOUND", "This media is unavailable.");
    try { await stat(mediaPath(assetId)); } catch { throw accountError(404, "NOT_FOUND", "This media is unavailable. Contact your instructor."); }
    let range;
    try { range = mediaRange(req.headers.range, asset.size); }
    catch { return reply.code(416).header("Content-Range", `bytes */${asset.size}`).send(); }
    const inline = /^(image|video|audio)\//.test(asset.contentType) || asset.contentType === "text/vtt";
    reply.header("Content-Type", asset.contentType).header("Accept-Ranges", "bytes")
      .header("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(asset.filename)}`)
      .header("Cross-Origin-Resource-Policy", "cross-origin")
      .header("Content-Length", range ? range.end - range.start + 1 : asset.size);
    if (range) reply.code(206).header("Content-Range", `bytes ${range.start}-${range.end}/${asset.size}`);
    return reply.send(readMedia(assetId, range));
  });
}
