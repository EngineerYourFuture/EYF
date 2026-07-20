/**
 * Recurring jobs — registered once at startup, executed by the worker.
 * Spec recurring touchpoints:
 *   - streak-break alert at 9pm IST for users with active streak & nothing solved today
 *   - weekly leaderboard digest Mondays 8am IST
 *   - daily content digest 7am IST
 */
import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export type CronJobName = "streak-break-alert" | "weekly-leaderboard" | "daily-digest" | "parent-digest";

export const cronQueue = new Queue<unknown, void, CronJobName>("cron", { connection: redis });

export async function registerCronJobs(): Promise<void> {
  await cronQueue.upsertJobScheduler(
    "streak-break-alert",
    { pattern: "30 15 * * *" }, // 21:00 IST = 15:30 UTC
    { name: "streak-break-alert", data: {} },
  );
  await cronQueue.upsertJobScheduler(
    "daily-digest",
    { pattern: "30 1 * * *" }, // 07:00 IST = 01:30 UTC
    { name: "daily-digest", data: {} },
  );
  await cronQueue.upsertJobScheduler(
    "weekly-leaderboard",
    { pattern: "30 2 * * 1" }, // Monday 08:00 IST
    { name: "weekly-leaderboard", data: {} },
  );
  await cronQueue.upsertJobScheduler(
    "parent-digest",
    { pattern: "30 2 * * 0" }, // Sunday 08:00 IST — parents read the week's recap
    { name: "parent-digest", data: {} },
  );
}
