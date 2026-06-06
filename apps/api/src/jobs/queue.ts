import { Queue, QueueEvents } from "bullmq";
import { redis } from "../lib/redis.js";

export type JudgeJobData = { submissionId: string };

export const judgeQueue = new Queue<JudgeJobData, void, "judge">("judge", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1_000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail:     { age: 86_400 },
  },
});

export const judgeQueueEvents = new QueueEvents("judge", { connection: redis });
