/**
 * Skill Ledger service (PRD §15.13). Records evidence and recomputes the
 * materialized snapshot from history via the pure math in @eyf/types. v1
 * recomputes synchronously on write; a rollup worker takes over at scale.
 */
import { prisma, EvidenceSource } from "@eyf/db";
import { computeSkillLevel } from "@eyf/types";

export async function findOrCreateSkill(slug: string, name?: string): Promise<string> {
  // Linear trim of leading/trailing dashes (no regex end-anchor → no backtracking).
  const normalized = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  let lo = 0, hi = normalized.length;
  while (lo < hi && normalized[lo] === "-") lo++;
  while (hi > lo && normalized[hi - 1] === "-") hi--;
  const clean = normalized.slice(lo, hi).slice(0, 60);
  const skill = await prisma.skill.upsert({
    where: { slug: clean },
    update: {},
    create: { slug: clean, name: name ?? clean.replaceAll("-", " ") },
    select: { id: true },
  });
  return skill.id;
}

/** Append one evidence row, then recompute the (user, org, skill) snapshot. */
export async function recordEvidence(input: {
  userId: string;
  orgId: string | null;
  skillId: string;
  level: number;
  weight: number;
  sourceType: EvidenceSource;
  sourceId?: string | null;
  decayHalfLifeDays?: number;
}): Promise<void> {
  await prisma.skillEvidence.create({
    data: {
      userId: input.userId,
      orgId: input.orgId,
      skillId: input.skillId,
      level: Math.max(0, Math.min(100, Math.round(input.level))),
      weight: input.weight,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      decayHalfLifeDays: input.decayHalfLifeDays ?? 180,
    },
  });
  await recomputeSnapshot(input.userId, input.orgId, input.skillId);
}

/** Rebuild one snapshot from all evidence for (user, org-context, skill). */
export async function recomputeSnapshot(userId: string, orgId: string | null, skillId: string): Promise<void> {
  const evidence = await prisma.skillEvidence.findMany({
    where: { userId, orgId, skillId },
    select: { level: true, weight: true, createdAt: true, decayHalfLifeDays: true },
  });
  const computed = computeSkillLevel(evidence);
  if (!computed) return;
  // find-then-write (not upsert): Postgres treats NULL orgId as distinct in a
  // unique index, so upsert-by-unique is unreliable for platform-wide rows.
  const existing = await prisma.skillSnapshot.findFirst({ where: { userId, orgId, skillId }, select: { id: true } });
  if (existing) {
    await prisma.skillSnapshot.update({ where: { id: existing.id }, data: { level: computed.level, evidenceCount: computed.evidenceCount, computedAt: new Date() } });
  } else {
    await prisma.skillSnapshot.create({ data: { userId, orgId, skillId, level: computed.level, evidenceCount: computed.evidenceCount } });
  }
}

/** A member's org-scoped ledger: skill → level with names, richest first. */
export async function memberLedger(userId: string, orgId: string) {
  const snaps = await prisma.skillSnapshot.findMany({
    where: { userId, orgId },
    orderBy: { level: "desc" },
  });
  const skills = await prisma.skill.findMany({
    where: { id: { in: snaps.map((s) => s.skillId) } },
    select: { id: true, slug: true, name: true, category: true },
  });
  const byId = new Map(skills.map((s) => [s.id, s]));
  return snaps.map((s) => ({
    skillId: s.skillId,
    slug: byId.get(s.skillId)?.slug ?? s.skillId,
    name: byId.get(s.skillId)?.name ?? s.skillId,
    category: byId.get(s.skillId)?.category ?? null,
    level: s.level,
    evidenceCount: s.evidenceCount,
    computedAt: s.computedAt,
  }));
}
