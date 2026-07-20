/**
 * Webhook delivery worker. Consumes the durable queue, POSTs the signed payload
 * with a short timeout, and records the outcome. Failures throw so BullMQ retries
 * with exponential backoff; once attempts are exhausted the job is dead-lettered
 * (kept in the failed set for a week) and the endpoint's failCount is bumped.
 *
 * Run as its own process: `pnpm --filter @eyf/api dev:webhook` (dev) /
 * `start:webhook` (prod).
 */
import { Worker } from "bullmq";
import { prisma } from "@eyf/db";
import { redis } from "../lib/redis.js";
import { signPayload } from "../lib/webhooks.js";
import { assertPublicUrl } from "../lib/ssrf.js";
import { initSentry, captureException } from "../lib/observability.js";
import type { WebhookJobData } from "./webhook.queue.js";

initSentry();

const worker = new Worker<WebhookJobData, void, "deliver">(
  "webhook",
  async (job) => {
    const { endpointId, deliveryId, event, body, secret } = job.data;
    const ep = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
      select: { url: true, active: true },
    });
    if (!ep?.active) {
      // endpoint deleted/disabled since enqueue — close the row out instead of
      // leaving it "pending" forever.
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: { status: "skipped", attempts: job.attemptsMade + 1, lastAt: new Date() },
      }).catch(() => {});
      return;
    }

    // Re-check the URL at delivery time (guards against DNS rebinding).
    await assertPublicUrl(ep.url);

    const ts = Math.floor(Date.now() / 1000);
    const res = await fetch(ep.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-eyf-event": event,
        "x-eyf-timestamp": String(ts),
        "x-eyf-signature": signPayload(secret, body, ts),
      },
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`endpoint returned ${res.status}`);

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: { status: "delivered", attempts: job.attemptsMade + 1, lastAt: new Date() },
      // The webhook DID deliver; if we can't record it, surface that rather than
      // swallow it, so a delivered row isn't silently left looking un-delivered.
    }).catch((e) => captureException(e, { deliveryId, phase: "mark-delivered" }));
  },
  { connection: redis, concurrency: 8 },
);

worker.on("failed", async (job, err) => {
  if (!job) return;
  const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
  await prisma.webhookDelivery.update({
    where: { id: job.data.deliveryId },
    data: { status: exhausted ? "failed" : "pending", attempts: job.attemptsMade, lastAt: new Date() },
  }).catch(() => {});
  if (exhausted) {
    await prisma.webhookEndpoint.update({
      where: { id: job.data.endpointId },
      data: { failCount: { increment: 1 } },
    }).catch(() => {});
    captureException(err, { deliveryId: job.data.deliveryId, endpointId: job.data.endpointId });
  }
});

console.log("[webhook] worker started");

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    console.log(`[webhook] ${sig} received, draining…`);
    await worker.close();
    process.exit(0);
  });
}
