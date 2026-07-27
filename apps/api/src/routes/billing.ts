import type { FastifyInstance, FastifyBaseLogger } from "fastify";
import { z } from "zod";
import { prisma, Prisma, SubscriptionStatus } from "@eyf/db";
import {
  razorpay,
  createOrder,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  PLAN_PRICING_INR,
  PLAN_TIER_MAP,
} from "../services/razorpay.js";
import { decideWebhook } from "../lib/subscription.js";

type RazorpayEvent = {
  event: string;
  created_at?: number;
  payload: {
    payment?: { entity: { notes?: { userId?: string; plan?: string; interval?: string }; amount: number; id: string } };
    subscription?: { entity: { id: string } };
  };
};

async function applyPaymentCaptured(event: RazorpayEvent, eventCreatedAt: Date): Promise<{ stale: boolean }> {
  const notes = event.payload.payment?.entity.notes ?? {};
  const userId = notes.userId;
  const plan = notes.plan as "basic" | "pro" | "elite" | undefined;
  const interval = (notes.interval ?? "monthly") as "monthly" | "annual";
  if (!(userId && plan && plan in PLAN_PRICING_INR)) return { stale: false };
  const existing = await prisma.subscription.findUnique({ where: { userId }, select: { lastEventAt: true } });
  if (decideWebhook({ alreadyProcessed: false, eventCreatedAt, lastEventAt: existing?.lastEventAt ?? null }) === "stale") {
    return { stale: true };
  }
  const endsAt = new Date(eventCreatedAt);
  endsAt.setMonth(endsAt.getMonth() + (interval === "annual" ? 12 : 1));
  const data = {
    plan: PLAN_TIER_MAP[plan],
    status: SubscriptionStatus.ACTIVE,
    amountInr: event.payload.payment!.entity.amount,
    intervalMonths: interval === "annual" ? 12 : 1,
    endsAt,
    canceledAt: null,
    lastEventAt: eventCreatedAt,
  };
  await prisma.subscription.upsert({ where: { userId }, update: data, create: { userId, ...data } });
  return { stale: false };
}

async function applySubscriptionCancelled(event: RazorpayEvent, eventCreatedAt: Date, log: FastifyBaseLogger): Promise<void> {
  // Cancel-at-period-end: keep endsAt, mark CANCELED — gating keeps access
  // until endsAt, then the plan resolves to FREE.
  const subId = event.payload.subscription?.entity.id;
  const sub = subId ? await prisma.subscription.findUnique({ where: { razorpaySubId: subId }, select: { lastEventAt: true } }) : null;
  if (sub && decideWebhook({ alreadyProcessed: false, eventCreatedAt, lastEventAt: sub.lastEventAt }) === "apply") {
    await prisma.subscription.update({
      where: { razorpaySubId: subId! },
      data: { status: SubscriptionStatus.CANCELED, canceledAt: eventCreatedAt, lastEventAt: eventCreatedAt },
    });
  } else {
    log.info({ event: event.event, subId }, "subscription.cancelled — no matching sub or stale");
  }
}

export async function billingRoutes(app: FastifyInstance) {
  app.get("/plans", async () => ({
    success: true,
    data: [
      { id: "free",  name: "Free",  priceInr: 0,    annualInr: 0,    interval: "monthly", features: ["5 submissions/day", "10 problems", "OS theory only"] },
      { id: "basic", name: "Basic", priceInr: 249,  annualInr: 1_999, interval: "monthly", features: ["20 submissions/day", "All core subjects", "SQL editor", "Peer mock interviews"] },
      { id: "pro",   name: "Pro",   priceInr: 499,  annualInr: 3_999, interval: "monthly", features: ["Unlimited submissions", "AI mock interviews", "Resume ATS", "All problems"] },
      { id: "elite", name: "Elite", priceInr: 899,  annualInr: 7_199, interval: "monthly", features: ["Everything in Pro", "2 expert mocks/mo", "Mentor priority"] },
    ],
  }));

  app.post(
    "/create-order",
    { preHandler: app.requireAuth },
    async (req, reply) => {
      const { plan, interval } = z
        .object({
          plan: z.enum(["basic", "pro", "elite"]),
          interval: z.enum(["monthly", "annual"]).default("monthly"),
        })
        .parse(req.body);
      try {
        const order = await createOrder({ plan, interval, userId: req.session!.id });
        return { success: true, data: order };
      } catch (err) {
        req.log.error({ err }, "razorpay create-order failed");
        return reply.code(503).send({
          success: false,
          error: { code: "RAZORPAY_UNAVAILABLE", message: "Payments are not configured yet." },
        });
      }
    },
  );

  // Client-side confirmation: Checkout JS gives us {orderId, paymentId, signature}.
  // We verify and immediately reflect the plan; the canonical state still comes
  // from the webhook (which arrives async).
  app.post(
    "/confirm",
    { preHandler: app.requireAuth },
    async (req, reply) => {
      // The client-supplied plan/interval are intentionally NOT read here — the
      // checkout signature only binds orderId|paymentId, so trusting a body-supplied
      // plan would let a caller who paid for `basic` claim `elite`. Any such fields
      // are ignored (Zod strips unknown keys); the plan is re-derived from the order.
      const { orderId, paymentId, signature } = z
        .object({
          orderId: z.string(),
          paymentId: z.string(),
          signature: z.string(),
        })
        .parse(req.body);
      if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
        return reply.code(400).send({
          success: false,
          error: { code: "INVALID_SIGNATURE", message: "Checkout signature failed." },
        });
      }
      // Re-derive the plan from the ORDER's server-set notes (written in createOrder),
      // and bind the order to THIS account — the request body is not trusted for
      // anything that determines the granted tier.
      if (!razorpay) {
        return reply.code(503).send({
          success: false,
          error: { code: "RAZORPAY_UNAVAILABLE", message: "Payments are not configured yet." },
        });
      }
      // The Razorpay SDK mis-types orders.fetch as returning void; cast to the
      // fields we actually read.
      let order: { notes?: Record<string, string | number>; amount?: number | string };
      try {
        order = (await razorpay.orders.fetch(orderId)) as unknown as typeof order;
      } catch (err) {
        req.log.error({ err, orderId }, "razorpay order fetch failed");
        return reply.code(502).send({
          success: false,
          error: { code: "ORDER_LOOKUP_FAILED", message: "Could not verify the order." },
        });
      }
      const notes = (order.notes ?? {}) as { plan?: string; interval?: string; userId?: string };
      const orderPlan = notes.plan as "basic" | "pro" | "elite" | undefined;
      const orderInterval: "monthly" | "annual" = notes.interval === "annual" ? "annual" : "monthly";
      if (!orderPlan || !(orderPlan in PLAN_PRICING_INR) || notes.userId !== req.session!.id) {
        return reply.code(400).send({
          success: false,
          error: { code: "ORDER_MISMATCH", message: "Order does not match this account." },
        });
      }
      const endsAt = new Date();
      endsAt.setMonth(endsAt.getMonth() + (orderInterval === "annual" ? 12 : 1));
      // `order.amount` is authoritative and already in paise; fall back to the plan
      // table only if the SDK returns an unexpected value.
      const amountPaise = Number(order.amount) || PLAN_PRICING_INR[orderPlan][orderInterval] * 100;
      await prisma.subscription.upsert({
        where: { userId: req.session!.id },
        update: {
          plan: PLAN_TIER_MAP[orderPlan],
          status: SubscriptionStatus.ACTIVE,
          amountInr: amountPaise,
          intervalMonths: orderInterval === "annual" ? 12 : 1,
          endsAt,
          canceledAt: null,
        },
        create: {
          userId: req.session!.id,
          plan: PLAN_TIER_MAP[orderPlan],
          status: SubscriptionStatus.ACTIVE,
          amountInr: amountPaise,
          intervalMonths: orderInterval === "annual" ? 12 : 1,
          endsAt,
        },
      });
      return { success: true, data: { plan: orderPlan, interval: orderInterval, endsAt } };
    },
  );

  app.post(
    "/webhook",
    { config: { rawBody: true } },
    async (req, reply) => {
      const signature = req.headers["x-razorpay-signature"] as string | undefined;
      const rawBody = (typeof req.rawBody === "string" ? req.rawBody : req.rawBody?.toString("utf8")) ?? JSON.stringify(req.body);
      if (!signature || !verifyWebhookSignature(rawBody, signature)) {
        return reply.code(400).send({
          success: false,
          error: { code: "INVALID_SIGNATURE", message: "Webhook signature failed." },
        });
      }
      const event = JSON.parse(rawBody) as RazorpayEvent;

      // Idempotency: dedup by the provider's event id. The unique insert is the
      // gate — a duplicate delivery hits the constraint and no-ops. `endsAt` is
      // derived from the event's own timestamp so replays are deterministic.
      const eventCreatedAt = event.created_at ? new Date(event.created_at * 1000) : new Date();
      const eventId = (req.headers["x-razorpay-event-id"] as string | undefined)
        ?? `${event.event}:${event.payload.payment?.entity.id ?? event.payload.subscription?.entity.id ?? "?"}:${event.created_at ?? ""}`;
      try {
        await prisma.webhookEvent.create({ data: { id: eventId, provider: "razorpay", type: event.event } });
      } catch (err) {
        // A duplicate delivery collides with the unique PK (P2002) → idempotent
        // no-op. Any OTHER failure (DB down, etc.) must NOT be acked as handled:
        // Razorpay treats 2xx as delivered and never retries, so a swallowed error
        // would drop the payment event permanently. Rethrow → 500 → Razorpay retries.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return reply.send({ success: true, data: { handled: event.event, deduped: true } });
        }
        throw err;
      }

      if (event.event === "payment.captured") {
        const { stale } = await applyPaymentCaptured(event, eventCreatedAt);
        if (stale) return reply.send({ success: true, data: { handled: event.event, stale: true } });
      } else if (event.event === "subscription.cancelled") {
        await applySubscriptionCancelled(event, eventCreatedAt, req.log);
      }
      return reply.send({ success: true, data: { handled: event.event } });
    },
  );
}
