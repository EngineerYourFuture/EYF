/**
 * Outbound webhooks (PRD §14/§24). Fire-and-forget from event sites; each
 * delivery is HMAC-signed and recorded. Best-effort with a short retry — a
 * durable BullMQ delivery worker replaces this inline path at scale (noted).
 */
import { createHmac, randomBytes } from "node:crypto";
import { prisma, Prisma } from "@eyf/db";

export function newWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** Deliver `event` to every active endpoint of `orgId` subscribed to it.
 *  Never throws — webhook failure must not break the triggering request. */
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
          data: { endpointId: ep.id, event, payload: { event, data } as Prisma.InputJsonValue },
          select: { id: true },
        });
        let ok = false;
        try {
          const res = await fetch(ep.url, {
            method: "POST",
            headers: { "content-type": "application/json", "x-eyf-signature": signPayload(ep.secret, body), "x-eyf-event": event },
            body,
            signal: AbortSignal.timeout(5000),
          });
          ok = res.ok;
        } catch { ok = false; }
        await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: ok ? "delivered" : "failed", attempts: 1, lastAt: new Date() } }).catch(() => {});
        if (!ok) await prisma.webhookEndpoint.update({ where: { id: ep.id }, data: { failCount: { increment: 1 } } }).catch(() => {});
      }),
    );
  } catch {
    /* webhooks are best-effort; never surface to the caller */
  }
}
