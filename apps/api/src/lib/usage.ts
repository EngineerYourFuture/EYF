/**
 * Usage metering (PRD §23, EPIC-04). One counter row per org × metric ×
 * month, incremented atomically — safe under concurrency because the
 * upsert's update path is a DB-side increment, not read-modify-write.
 * Billing reads the current period; limit checks compare against plan caps.
 */
import { prisma } from "@eyf/db";

export type UsageMetric =
  | "exec_minutes"
  | "ai_credits"
  | "proctored_attempts"
  | "storage_mb"
  | "invites_sent";

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
