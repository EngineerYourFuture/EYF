import Razorpay from "razorpay";
import crypto from "node:crypto";
import { env } from "../env.js";
import type { Plan } from "@eyf/types";
import { PlanTier } from "@eyf/db";

export const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

export const PLAN_PRICING_INR: Record<Exclude<Plan, "free">, { monthly: number; annual: number }> = {
  basic: { monthly: 249,  annual: 1_999 },
  pro:   { monthly: 499,  annual: 3_999 },
  elite: { monthly: 899,  annual: 7_199 },
};

export const PLAN_TIER_MAP: Record<Plan, PlanTier> = {
  free:  PlanTier.FREE,
  basic: PlanTier.BASIC,
  pro:   PlanTier.PRO,
  elite: PlanTier.ELITE,
};

export async function createOrder(input: {
  plan: Exclude<Plan, "free">;
  interval: "monthly" | "annual";
  userId: string;
}): Promise<{ orderId: string; amountInr: number; currency: "INR"; keyId: string }> {
  if (!razorpay || !env.RAZORPAY_KEY_ID) throw new Error("Razorpay not configured");
  const amountInr = PLAN_PRICING_INR[input.plan][input.interval];
  const order = await razorpay.orders.create({
    amount: amountInr * 100, // paisa
    currency: "INR",
    receipt: `eyf_${input.userId}_${Date.now()}`,
    notes: { plan: input.plan, interval: input.interval, userId: input.userId },
  });
  return { orderId: order.id, amountInr, currency: "INR", keyId: env.RAZORPAY_KEY_ID };
}

/**
 * Verify the x-razorpay-signature header on a webhook request body.
 * https://razorpay.com/docs/webhooks/validate-test/
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // timingSafeEqual throws on unequal lengths — a malformed/short signature must
  // reject (→ 400), not crash the handler (→ 500).
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verify the checkout success payload signature (returned by Razorpay Checkout JS).
 */
export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length) return false; // reject malformed signature, don't throw
  return crypto.timingSafeEqual(a, b);
}
