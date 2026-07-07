/**
 * Org API keys (PRD §24) — machine auth for the public API. The raw key is
 * shown once at creation; only a sha-256 hash is stored. Requests present
 * `Authorization: Bearer eyf_live_…`; we look up by prefix, verify the hash,
 * and resolve the key's scoped org capabilities.
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@eyf/db";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function mintApiKey(): { raw: string; prefix: string; hashedKey: string } {
  const prefix = `eyf_live_${randomBytes(4).toString("hex")}`;
  const secret = randomBytes(24).toString("base64url");
  const raw = `${prefix}.${secret}`;
  return { raw, prefix, hashedKey: sha256(raw) };
}

export type ApiKeyContext = { orgId: string; scopes: string[] };

/** Resolve a raw key to its org + scopes, or null. Bumps lastUsedAt. */
export async function resolveApiKey(raw: string): Promise<ApiKeyContext | null> {
  const prefix = raw.split(".")[0];
  if (!prefix?.startsWith("eyf_live_")) return null;
  const key = await prisma.apiKey.findUnique({ where: { prefix }, select: { id: true, hashedKey: true, scopes: true, orgId: true, revokedAt: true } });
  if (!key || key.revokedAt) return null;
  if (key.hashedKey !== sha256(raw)) return null;
  void prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { orgId: key.orgId, scopes: key.scopes };
}
