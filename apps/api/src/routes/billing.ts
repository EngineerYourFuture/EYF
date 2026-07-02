import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, SubscriptionStatus } from "@eyf/db";
import {
  createOrder,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  PLAN_PRICING_INR,
  PLAN_TIER_MAP,
} from "../services/razorpay.js";

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
      const { orderId, paymentId, signature, plan, interval } = z
        .object({
          orderId: z.string(),
          paymentId: z.string(),
          signature: z.string(),
          plan: z.enum(["basic", "pro", "elite"]),
          interval: z.enum(["monthly", "annual"]),
        })
        .parse(req.body);
      if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
        return reply.code(400).send({
          success: false,
          error: { code: "INVALID_SIGNATURE", message: "Checkout signature failed." },
        });
      }
      const amountInr = PLAN_PRICING_INR[plan][interval];
      const endsAt = new Date();
      endsAt.setMonth(endsAt.getMonth() + (interval === "annual" ? 12 : 1));
      await prisma.subscription.upsert({
        where: { userId: req.session!.id },
        update: {
          plan: PLAN_TIER_MAP[plan],
          status: SubscriptionStatus.ACTIVE,
          amountInr: amountInr * 100,
          intervalMonths: interval === "annual" ? 12 : 1,
          endsAt,
          canceledAt: null,
        },
        create: {
          userId: req.session!.id,
          plan: PLAN_TIER_MAP[plan],
          status: SubscriptionStatus.ACTIVE,
          amountInr: amountInr * 100,
          intervalMonths: interval === "annual" ? 12 : 1,
          endsAt,
        },
      });
      return { success: true, data: { plan, interval, endsAt } };
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
      const event = JSON.parse(rawBody) as {
        event: string;
        payload: { payment?: { entity: { notes?: { userId?: string; plan?: string; interval?: string }; amount: number; id: string } } };
      };
      if (event.event === "payment.captured") {
        const notes = event.payload.payment?.entity.notes ?? {};
        const userId = notes.userId;
        const plan = notes.plan as "basic" | "pro" | "elite" | undefined;
        const interval = (notes.interval ?? "monthly") as "monthly" | "annual";
        if (userId && plan && plan in PLAN_PRICING_INR) {
          const endsAt = new Date();
          endsAt.setMonth(endsAt.getMonth() + (interval === "annual" ? 12 : 1));
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              plan: PLAN_TIER_MAP[plan],
              status: SubscriptionStatus.ACTIVE,
              amountInr: event.payload.payment!.entity.amount,
              intervalMonths: interval === "annual" ? 12 : 1,
              endsAt,
              canceledAt: null,
            },
            create: {
              userId,
              plan: PLAN_TIER_MAP[plan],
              status: SubscriptionStatus.ACTIVE,
              amountInr: event.payload.payment!.entity.amount,
              intervalMonths: interval === "annual" ? 12 : 1,
              endsAt,
            },
          });
        }
      } else if (event.event === "subscription.cancelled") {
        // Recurring subscriptions aren't live yet (one-time orders for now);
        // log for observability until the subscription lifecycle is wired.
        req.log.info({ event: event.event }, "subscription cancelled webhook");
      }
      return reply.send({ success: true, data: { handled: event.event } });
    },
  );
}
