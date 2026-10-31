/**
 * College batch analytics for the TPO (Training & Placement Officer) channel
 * (Innovation Roadmap A1). Aggregates a college's students into a "batch health"
 * summary a placement officer would act on — how active the batch is, how far
 * along, and what they're aiming for. Pure and signal-agnostic: v1 ranks on
 * stored profile stats (cheap); a materialized Readiness Index (HARD-6) upgrades
 * the depth later without touching this shape.
 */
export type StudentStat = {
  level: number;
  currentXp: number;
  streakDays: number;
  totalSolved: number;
  targetRole: string | null;
  graduationYear: number | null;
};

export type BatchHealth = {
  students: number;
  active: number; // has solved at least one problem
  engaged: number; // on a 7+ day streak
  avgLevel: number;
  avgXp: number;
  avgSolved: number;
  topTargetRoles: { role: string; count: number }[]; // top 3, most-wanted first
  gradYears: { year: number; count: number }[]; // ascending
};

const round = (n: number) => Math.round(n);
const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

/** Tally a nullable key into descending-count entries. */
function tally<T extends string | number>(values: (T | null)[]): { key: T; count: number }[] {
  const counts = new Map<T, number>();
  for (const v of values) {
    if (v === null) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].map(([key, count]) => ({ key, count }));
}

export function collegeBatchHealth(students: readonly StudentStat[]): BatchHealth {
  const roles = tally(students.map((s) => s.targetRole))
    .sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : 1))
    .slice(0, 3)
    .map(({ key, count }) => ({ role: key, count }));

  const years = tally(students.map((s) => s.graduationYear))
    .sort((a, b) => a.key - b.key)
    .map(({ key, count }) => ({ year: key, count }));

  return {
    students: students.length,
    active: students.filter((s) => s.totalSolved > 0).length,
    engaged: students.filter((s) => s.streakDays >= 7).length,
    avgLevel: round(avg(students.map((s) => s.level))),
    avgXp: round(avg(students.map((s) => s.currentXp))),
    avgSolved: round(avg(students.map((s) => s.totalSolved))),
    topTargetRoles: roles,
    gradYears: years,
  };
}
