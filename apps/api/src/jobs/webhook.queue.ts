import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export type WebhookJobData = {
  endpointId: string;
  deliveryId: string;
  event: string;
  body: string; // pre-serialized JSON payload (what we sign)
  secret: string;
};

/** Durable outbound-webhook delivery. Retries with backoff; exhausted jobs
 *  land in the failed set (dead-letter) for inspection/replay. */
export const webhookQueue = new Queue<WebhookJobData, void, "deliver">("webhook", {
  connection: redis,
  defaultJobOptions: {
    attempts: 6,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 7 * 86_400 }, // keep a week for replay/debug
  },
});
