/**
 * Skill Ledger math (PRD §15.13) — the evidence layer, PURE and shared so the
 * moat logic is deterministic and unit-testable. No self-reported numbers ever
 * enter: a snapshot level is a recency-weighted average of demonstrated
 * evidence, and every level traces back to ≥1 evidence row.
 */

export type Evidence = {
  level: number;    // 0..100 demonstrated on this occasion
  weight: number;   // source trust (lesson < assessment < judged code)
  createdAt: Date;
  decayHalfLifeDays: number;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Decay-weighted level for ONE skill from its evidence.
 *   effWeight_i = weight_i · 0.5 ^ (ageDays_i / halfLife_i)
 *   level       = Σ(level_i · effWeight_i) / Σ effWeight_i
 * Recent, high-trust evidence dominates; old evidence fades but never vanishes
 * (so a skill decays toward stale, matching real forgetting). Empty → null,
 * never a fabricated 0.
 */
export function computeSkillLevel(evidence: Evidence[], now: Date = new Date()): { level: number; evidenceCount: number } | null {
  if (evidence.length === 0) return null;
  let num = 0;
  let den = 0;
  for (const e of evidence) {
    const ageDays = Math.max(0, (now.getTime() - e.createdAt.getTime()) / 86_400_000);
    const halfLife = Math.max(1, e.decayHalfLifeDays);
    const eff = e.weight * Math.pow(0.5, ageDays / halfLife);
    num += e.level * eff;
    den += eff;
  }
  if (den === 0) return { level: 0, evidenceCount: evidence.length };
  return { level: clamp(num / den), evidenceCount: evidence.length };
}

export type SkillLevel = { skillId: string; level: number };
export type RoleBarReq = { skillId: string; requiredLevel: number; weight: number };
export type BarGap = { skillId: string; level: number; required: number; gap: number; met: boolean };

/**
 * Fit of a person's snapshot levels against a role bar.
 *   perSkillFit = min(1, level / required)   (required=0 ⇒ fit 1)
 *   overall     = Σ(weight · perSkillFit) / Σ weight   → 0..100
 * A missing skill counts as level 0 (a gap, not an omission). Returns the
 * overall fit plus the per-skill gap list sorted worst-first — the exact input
 * the gap proposer and onboarding planner consume.
 */
export function barFit(levels: SkillLevel[], bar: RoleBarReq[]): { overall: number; gaps: BarGap[] } {
  if (bar.length === 0) return { overall: 0, gaps: [] };
  const levelOf = new Map(levels.map((l) => [l.skillId, l.level]));
  let wSum = 0;
  let fitSum = 0;
  const gaps: BarGap[] = bar.map((req) => {
    const level = levelOf.get(req.skillId) ?? 0;
    const fit = req.requiredLevel === 0 ? 1 : Math.min(1, level / req.requiredLevel);
    const w = Math.max(0, req.weight);
    wSum += w;
    fitSum += w * fit;
    return { skillId: req.skillId, level, required: req.requiredLevel, gap: Math.max(0, req.requiredLevel - level), met: level >= req.requiredLevel };
  });
  gaps.sort((a, b) => b.gap - a.gap);
  return { overall: wSum === 0 ? 0 : clamp((fitSum / wSum) * 100), gaps };
}

/** Default evidence weight per source — trust ordering is the whole point. */
export const EVIDENCE_WEIGHT: Record<string, number> = {
  LESSON: 0.5,
  ASSESSMENT: 1.0,
  JUDGED_CODE: 1.2,
  PROJECT_REVIEW: 1.3,
  MOCK: 0.9,
  CERT: 1.1,
  MENTOR_RATING: 0.8,
  IMPORT: 0.4,
};
