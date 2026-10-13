import { prisma } from "@eyf/db";
import type { OrgContext } from "../middleware/org.js";

export function scopedMembers(ctx: OrgContext) {
  return { orgId: ctx.orgId, status: "ACTIVE" as const, ...(ctx.scope === "department" ? { departmentId: ctx.departmentId ?? "__none__" } : {}) };
}

export async function cohortReport(cohortId: string, ctx: OrgContext) {
  const cohort = await prisma.cohort.findFirst({ where: { id: cohortId, orgId: ctx.orgId }, include: {
    path: { include: { items: { where: { required: true }, include: { course: { select: { lessons: { select: { id: true } } } } } } } },
    enrollments: { where: { member: scopedMembers(ctx) }, include: { member: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { id: "asc" } },
  } });
  if (!cohort) return null;
  const lessonIds = [...new Set(cohort.path.items.flatMap((i) => i.course.lessons.map((l) => l.id)))];
  const progress = lessonIds.length ? await prisma.lessonProgress.findMany({ where: { lessonId: { in: lessonIds }, userId: { in: cohort.enrollments.map((e) => e.member.userId) } }, select: { userId: true, completedAt: true } }) : [];
  const byUser = new Map<string, Date[]>();
  for (const p of progress) { const dates = byUser.get(p.userId) ?? []; dates.push(p.completedAt); byUser.set(p.userId, dates); }
  const now = new Date();
  const rows = cohort.enrollments.map((e) => {
    const dates = byUser.get(e.member.userId) ?? [];
    const progressPct = lessonIds.length ? Math.floor(dates.length * 100 / lessonIds.length) : 0;
    const lastActivityAt = dates.length ? new Date(Math.max(...dates.map(Number))) : null;
    const cutoffCount = cohort.driveDeadline ? dates.filter((d) => d <= cohort.driveDeadline!).length : dates.length;
    const cutoffPct = lessonIds.length ? Math.floor(cutoffCount * 100 / lessonIds.length) : 0;
    const reasons = eligibilityReasons(lessonIds.length, cutoffPct, cohort.minimumProgress, !!cohort.driveDeadline);
    const activeStatus = progressPct === 100 ? "COMPLETED" : "ENROLLED";
    if (e.status === "DROPPED") reasons.push("Enrollment is dropped.");
    return { enrollmentId: e.id, member: { id: e.member.id, name: e.member.user.name, email: e.member.user.email }, progressPct, lastActivityAt,
      stuckFlag: e.status !== "DROPPED" && progressPct < 100 && now.getTime() - (lastActivityAt ?? e.enrolledAt).getTime() > 7 * 86_400_000,
      status: e.status === "DROPPED" ? e.status : activeStatus,
      eligibility: { eligible: reasons.length === 0, reasons },
      followUp: { status: e.followUpStatus, note: e.followUpNote, dueAt: e.followUpDueAt, updatedAt: e.followUpUpdatedAt,
        overdue: ["OPEN", "CONTACTED"].includes(e.followUpStatus) && !!e.followUpDueAt && e.followUpDueAt < now },
    };
  });
  return { generatedAt: now, cohort: { id: cohort.id, name: cohort.name, path: cohort.path.title, driveTitle: cohort.driveTitle, driveDeadline: cohort.driveDeadline, minimumProgress: cohort.minimumProgress },
    funnel: { enrolled: rows.length, started: rows.filter((r) => r.progressPct > 0).length, halfway: rows.filter((r) => r.progressPct >= 50).length, completed: rows.filter((r) => r.status === "COMPLETED").length, stuck: rows.filter((r) => r.stuckFlag).length, eligible: rows.filter((r) => r.eligibility.eligible).length }, rows };
}

function eligibilityReasons(lessonCount: number, progressPct: number, minimum: number, hasDeadline: boolean) {
  if (!lessonCount) return ["Program has no required lessons."];
  if (progressPct < minimum) return [`${minimum}% required${hasDeadline ? " by the deadline" : ""}; ${progressPct}% achieved.`];
  return [];
}
