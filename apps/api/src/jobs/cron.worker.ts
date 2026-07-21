/**
 * Cron worker — handles streak-break alerts, daily digest, weekly leaderboard.
 * Run alongside the judge worker: `pnpm --filter @eyf/api dev:cron`.
 */
import { Worker } from "bullmq";
import { prisma } from "@eyf/db";
import { redis } from "../lib/redis.js";
import { registerCronJobs, type CronJobName } from "./scheduler.js";
import { pickDailyChallenge } from "../services/daily.js";
import { sendPushToUser } from "../services/push.js";
import {
  sendEmail, streakBreakEmail, dailyDigestEmail, weeklyLeaderboardEmail, parentDigestEmail,
} from "../services/email.js";
import { parentDigestFor } from "../services/parent-digest.js";

async function streakBreakAlert(): Promise<{ checked: number; emailed: number; pushed: number }> {
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const candidates = await prisma.userProfile.findMany({
    where: { streakDays: { gt: 0 } },
    select: { userId: true, streakDays: true, user: { select: { email: true, name: true } } },
  });
  let emailed = 0, pushed = 0;
  for (const c of candidates) {
    const today = await prisma.dailyStreak.findUnique({
      where: { userId_date: { userId: c.userId, date: start } },
    });
    if (today && today.problemsSolved > 0) continue;
    const email = await sendEmail({
      to: c.user.email,
      subject: `Your ${c.streakDays}-day streak is at risk`,
      html: streakBreakEmail(c.user.name, c.streakDays),
    });
    if (email.sent) emailed += 1;
    const push = await sendPushToUser(c.userId, {
      title: "🔥 Streak at risk",
      body: `${c.streakDays} days. One problem keeps it alive.`,
      data: { route: "/dashboard" },
    });
    if (push.sent > 0) pushed += push.sent;
  }
  console.log(`[streak-alert] checked=${candidates.length} emailed=${emailed} pushed=${pushed}`);
  return { checked: candidates.length, emailed, pushed };
}

async function dailyDigest(): Promise<{ sent: number; failed: number }> {
  const users = await prisma.user.findMany({
    where: { subscription: { isNot: null }, deletedAt: null },
    select: { id: true, name: true, email: true, profile: { select: { streakDays: true } } },
  });
  let sent = 0, failed = 0;
  for (const u of users) {
    try {
      const [challenge, due] = await Promise.all([
        pickDailyChallenge(u.id),
        prisma.flashcardReview.count({ where: { userId: u.id, dueAt: { lte: new Date() } } }),
      ]);
      if (!challenge?.problem) continue;
      const res = await sendEmail({
        to: u.email,
        subject: `Today's plan, ${u.name.split(" ")[0]}`,
        html: dailyDigestEmail(u.name, {
          challengeTitle: challenge.problem.title,
          challengeSlug:  challenge.problem.slug,
          difficulty:     challenge.problem.difficulty,
          dueFlashcards:  due,
          streakDays:     u.profile?.streakDays ?? 0,
        }),
      });
      if (res.sent) sent += 1; else failed += 1;
    } catch { failed += 1; }
  }
  console.log(`[daily-digest] sent=${sent} failed=${failed} of ${users.length}`);
  return { sent, failed };
}

async function weeklyLeaderboard(): Promise<{ top: string[] }> {
  const top = await prisma.userProfile.findMany({
    orderBy: { currentXp: "desc" },
    take: 10,
    include: { user: { select: { id: true, name: true, email: true, college: true } } },
  });
  const lines = top.map((p, i) => `${i + 1}. ${p.user.name} (${p.user.college ?? "—"}) · ${p.currentXp} XP`);
  // Send digest to everyone on the leaderboard (small N, cheap).
  for (const p of top) {
    await sendEmail({
      to: p.user.email,
      subject: "EYF · top 10 this week",
      html: weeklyLeaderboardEmail(p.user.name, lines),
    });
  }
  console.log(`[weekly-leaderboard] notified ${top.length}\n${lines.join("\n")}`);
  return { top: lines };
}

async function parentDigest(): Promise<{ sent: number; failed: number }> {
  const students = await prisma.user.findMany({
    where: { parentEmail: { not: null }, deletedAt: null },
    select: { id: true, parentEmail: true },
  });
  let sent = 0, failed = 0;
  for (const s of students) {
    try {
      const digest = await parentDigestFor(s.id);
      if (!digest) { failed += 1; continue; }
      const res = await sendEmail({
        to: s.parentEmail!,
        subject: digest.headline,
        html: parentDigestEmail(digest),
      });
      if (res.sent) sent += 1; else failed += 1;
    } catch { failed += 1; }
  }
  console.log(`[parent-digest] sent=${sent} failed=${failed} of ${students.length}`);
  return { sent, failed };
}

export const cronWorker = new Worker<unknown, void, CronJobName>(
  "cron",
  async (job) => {
    switch (job.name) {
      case "streak-break-alert": await streakBreakAlert(); return;
      case "daily-digest":       await dailyDigest(); return;
      case "weekly-leaderboard": await weeklyLeaderboard(); return;
      case "parent-digest":      await parentDigest(); return;
    }
  },
  { connection: redis, concurrency: 1 },
);

cronWorker.on("failed",    (job, err) => console.error(`[cron] ${job?.name} failed:`, err));
cronWorker.on("completed", (job) => console.log(`[cron] ${job.name} done`));

await registerCronJobs();
console.log("[cron] worker started, jobs registered");

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    console.log(`[cron] ${sig} draining…`);
    await cronWorker.close();
    process.exit(0);
  });
}
