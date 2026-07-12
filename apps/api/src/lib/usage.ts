/**
 * Usage metering (PRD §23, EPIC-04). One counter row per org × metric ×
 * month, incremented atomically — safe under concurrency because the
 * upsert's update path is a DB-side increment, not read-modify-write.
 * Billing reads the current period; limit checks compare against plan caps.
 */
import { prisma, OrgPlan } from "@eyf/db";

export type UsageMetric =
  | "exec_minutes"
  | "ai_credits"
  | "proctored_attempts"
  | "storage_mb"
  | "invites_sent";

// Monthly ai_credits ceiling per org plan. Metering without a ceiling let an
// authed author burn unbounded Anthropic spend (bounded only by the per-minute
// rate limit); this is the cap the route enforces before each AI call.
// One AI course-draft costs 5 credits, so TRIAL ≈ 8 drafts/month.
export const AI_CREDITS_CAP: Record<OrgPlan, number> = {
  [OrgPlan.TRIAL]: 40,
  [OrgPlan.TEAM]: 300,
  [OrgPlan.BUSINESS]: 1500,
  [OrgPlan.ENTERPRISE]: Number.POSITIVE_INFINITY,
  [OrgPlan.EDUCATION]: Number.POSITIVE_INFINITY,
};

export const currentPeriod = (d = new Date()): string =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export async function bumpUsage(orgId: string, metric: UsageMetric, by = 1): Promise<void> {
  const period = currentPeriod();
  await prisma.usageCounter.upsert({
    where: { orgId_metric_period: { orgId, metric, period } },
    update: { value: { increment: by } },
    create: { orgId, metric, period, value: by },
  });
}

export async function getUsage(orgId: string, period = currentPeriod()) {
  const [counters, seatsUsed, org] = await Promise.all([
    prisma.usageCounter.findMany({ where: { orgId, period }, select: { metric: true, value: true } }),
    prisma.orgMember.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true, seatsLicensed: true } }),
  ]);
  return {
    period,
    plan: org?.plan ?? "TRIAL",
    seats: { used: seatsUsed, licensed: org?.seatsLicensed ?? 0 },
    counters: Object.fromEntries(counters.map((c) => [c.metric, c.value])) as Partial<Record<UsageMetric, number>>,
  };
}

/**
 * True if the org has ai_credits headroom this period for a call that will cost
 * `cost`. Reads the plan cap and the current counter — call BEFORE spending, so
 * an over-cap org can't trigger the LLM. ENTERPRISE/EDUCATION are uncapped.
 */
export async function hasAiCredits(orgId: string, cost = 5): Promise<{ ok: boolean; used: number; cap: number; plan: OrgPlan }> {
  const [org, counter] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true } }),
    prisma.usageCounter.findUnique({
      where: { orgId_metric_period: { orgId, metric: "ai_credits", period: currentPeriod() } },
      select: { value: true },
    }),
  ]);
  const plan = org?.plan ?? OrgPlan.TRIAL;
  const cap = AI_CREDITS_CAP[plan];
  const used = counter?.value ?? 0;
  return { ok: used + cost <= cap, used, cap, plan };
}
