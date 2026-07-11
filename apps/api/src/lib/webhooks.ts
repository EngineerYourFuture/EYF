/**
 * Outbound webhooks (PRD §14/§24). Delivery is durable: the triggering request
 * only records a pending delivery and enqueues a BullMQ job, so a slow or dead
 * customer endpoint never adds latency to (or fails) the request that fired it.
 * The webhook worker performs the HTTP POST with retry/backoff and a dead-letter.
 *
 * Each payload is HMAC-signed over `<timestamp>.<body>` and sent with the
 * timestamp header so receivers can reject replays. See jobs/webhook.worker.ts.
 */
import { createHmac, randomBytes } from "node:crypto";
import { prisma, Prisma } from "@eyf/db";
import { webhookQueue } from "../jobs/webhook.queue.js";

export function newWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

/** Sign `<timestamp>.<body>` so the signature is bound to a moment in time. */
export function signPayload(secret: string, body: string, timestamp: number): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/** Record a pending delivery for every subscribed endpoint of `orgId` and
 *  enqueue it for the worker. Never throws — webhook wiring must not break the
 *  triggering request. */
export async function fireWebhook(orgId: string, event: string, data: unknown): Promise<void> {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { orgId, active: true, events: { has: event } },
      select: { id: true, url: true, secret: true },
    });
    await Promise.all(
      endpoints.map(async (ep) => {
        const body = JSON.stringify({ event, data, ts: new Date().toISOString() });
        const delivery = await prisma.webhookDelivery.create({
          data: { endpointId: ep.id, event, payload: { event, data } as Prisma.InputJsonValue, status: "pending" },
          select: { id: true },
        });
        await webhookQueue.add(
          "deliver",
          { endpointId: ep.id, deliveryId: delivery.id, event, body, secret: ep.secret },
          { jobId: delivery.id }, // idempotent enqueue
        );
      }),
    );
  } catch {
    /* webhooks are best-effort at the enqueue boundary; never surface to the caller */
  }
}
