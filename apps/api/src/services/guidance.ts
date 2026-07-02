/**
 * Guidance engine — the active layer on top of Placement Readiness.
 *
 * Gathers every pillar signal server-side (mirrors skill-graph.ts), computes
 * readiness DETERMINISTICALLY (shared pure fn in @eyf/types), ranks the next
 * best actions DETERMINISTICALLY, then optionally enriches the top action with
 * a one-line LLM coach note — cached per user per day, with a HARD fallback to
 * the deterministic reason when Anthropic is absent, errors, or times out.
 *
 * The LLM never scores or ranks. If it's unavailable the engine still returns
 * a full, correct guidance payload — so dev (no key) and prod outages both
 * degrade to the deterministic path, never a blank screen.
 */
import { prisma, Verdict } from "@eyf/db";
import {
  computeReadiness,
  rankActions,
  type ReadinessInput,
  type Readiness,
  type GuidanceAction,
} from "@eyf/types";
import { generateCoachNote } from "./anthropic.js";
import { redis } from "../lib/redis.js";

export type Guidance = {
  readiness: Readiness;
  actions: GuidanceAction[];
  coachNote: string;
  generatedAt: string;
  partial: boolean; // true if a signal query failed and we computed from a subset
};

/** Best MCQ score per category from raw attempts. */
function bestByCategory(attempts: { category: string; score: number }[]) {
  const out: ReadinessInput["mcqBest"] = {};
  for (const a of attempts) {
    const k = a.category as keyof ReadinessInput["mcqBest"];
    if (k === "APTITUDE" || k === "LOGICAL" || k === "VERBAL" || k === "TECHNICAL") {
      out[k] = Math.max(out[k] ?? 0, a.score);
    }
  }
  return out;
}

/**
 * Assemble ReadinessInput from the DB. Uses allSettled so one failing query
 * degrades to a partial result instead of a 500 — readiness from a subset of
 * pillars is more useful than nothing.
 */
async function gatherReadinessInput(userId: string): Promise<{ input: ReadinessInput; partial: boolean }> {
  const [accepted, allSubs, profile, mocks, resumes, projects, mcqAttempts, commDrills] =
    await Promise.allSettled([
      prisma.problemSolution.findMany({
        where: { userId, verdict: Verdict.ACCEPTED }, distinct: ["problemId"],
        select: { problem: { select: { difficulty: true } } },
      }),
      prisma.problemSolution.count({ where: { userId } }),
      prisma.userProfile.findUnique({ where: { userId }, select: { streakDays: true, longestStreak: true } }),
      prisma.mockSession.findMany({ where: { candidateId: userId }, select: { feedback: true } }),
      prisma.resume.findMany({ where: { userId }, select: { atsScore: true } }),
      prisma.userProject.findMany({ where: { userId }, select: { status: true } }),
      prisma.mcqAttempt.findMany({ where: { userId }, select: { category: true, score: true } }),
      prisma.communicationDrill.findMany({ where: { userId }, select: { score: true } }),
    ]);

  let partial = false;
  const val = <T>(r: PromiseSettledResult<T>, fallback: T): T => {
    if (r.status === "fulfilled") return r.value;
    partial = true;
    return fallback;
  };

  const acceptedRows = val(accepted, [] as { problem: { difficulty: string } }[]);
  const totalSubs = val(allSubs, 0);
  const prof = val(profile, null as { streakDays: number; longestStreak: number } | null);
  const mockRows = val(mocks, [] as { feedback: unknown }[]);
  const resumeRows = val(resumes, [] as { atsScore: number | null }[]);
  const projectRows = val(projects, [] as { status: string }[]);
  const mcqRows = val(mcqAttempts, [] as { category: string; score: number }[]);
  const drillRows = val(commDrills, [] as { score: number }[]);

  const difficultyMap = new Map<string, number>();
  for (const r of acceptedRows) {
    difficultyMap.set(r.problem.difficulty, (difficultyMap.get(r.problem.difficulty) ?? 0) + 1);
  }

  const input: ReadinessInput = {
    totalSolved: acceptedRows.length,
    acceptanceRate: totalSubs > 0 ? acceptedRows.length / totalSubs : 0,
    difficultyMix: [...difficultyMap.entries()].map(([difficulty, count]) => ({ difficulty, count })),
    mocks: mockRows.map((m) => {
      const f = m.feedback as { overallScore?: number; score?: number } | null;
      const overallScore = f?.overallScore ?? f?.score ?? 0;
      return { feedback: overallScore > 0 ? { overallScore } : null };
    }),
    resumes: resumeRows,
    projects: projectRows,
    streak: prof?.streakDays ?? 0,
    longestStreak: prof?.longestStreak ?? 0,
    mcqBest: bestByCategory(mcqRows),
    commDrills: drillRows,
  };
  return { input, partial };
}

/** Deterministic fallback coach note — always valid, no LLM. */
function fallbackNote(readiness: Readiness, actions: GuidanceAction[]): string {
  if (actions.length === 0) return readiness.summary;
  return actions[0]!.reason;
}

/**
 * Full guidance for a user. Coach note is best-effort: cached per day, LLM-
 * enriched when possible, deterministic reason otherwise. Never throws for a
 * missing/broken LLM.
 */
export async function computeGuidance(userId: string): Promise<Guidance> {
  const { input, partial } = await gatherReadinessInput(userId);
  const readiness = computeReadiness(input);
  const actions = rankActions(readiness);
  const fallback = fallbackNote(readiness, actions);

  const coachNote = await resolveCoachNote(userId, readiness, actions, fallback);

  return { readiness, actions, coachNote, generatedAt: new Date().toISOString(), partial };
}

const CACHE_TTL_SECONDS = 60 * 60 * 24; // one day

/** Cache key includes the day and the overall score so a score change re-generates. */
function coachCacheKey(userId: string, overall: number): string {
  const day = new Date().toISOString().slice(0, 10);
  return `guidance:coach:${userId}:${day}:${overall}`;
}

async function resolveCoachNote(
  userId: string,
  readiness: Readiness,
  actions: GuidanceAction[],
  fallback: string,
): Promise<string> {
  if (actions.length === 0) return fallback;
  const key = coachCacheKey(userId, readiness.overall);
  try {
    const cached = await redis.get(key);
    if (cached) return cached;
  } catch { /* cache read best-effort */ }

  let note = fallback;
  try {
    const weakPillars = readiness.pillars
      .filter((p) => p.score < 90)
      .map((p) => `${p.label} ${p.score}`)
      .join(", ");
    const llm = await generateCoachNote({
      band: readiness.band,
      overall: readiness.overall,
      topAction: actions[0]!.label,
      topReason: actions[0]!.reason,
      weakPillars,
    });
    if (llm) note = llm;
  } catch { /* no key / LLM error / timeout → deterministic fallback */ }

  try { await redis.set(key, note, "EX", CACHE_TTL_SECONDS); } catch { /* best-effort */ }
  return note;
}
