import { PlanTier, SubscriptionStatus, type Subscription } from "@eyf/db";

/**
 * Plan-gating truth. A subscription grants its plan tier only while it is in an
 * access-granting status AND has not passed its period end (`endsAt`).
 *
 * Access statuses: ACTIVE, TRIALING, and CANCELED (cancel-at-period-end — a
 * cancelled sub keeps access until `endsAt`). PAST_DUE / EXPIRED / PAUSED grant
 * nothing (money-safe: no grace window). A null `endsAt` is treated as perpetual,
 * which only affects seeded/manually-created rows — real paid subscriptions
 * always get an `endsAt` from the webhook.
 */
type SubGate = Pick<Subscription, "plan" | "status" | "endsAt"> | null | undefined;

const ACCESS_STATUSES = new Set<SubscriptionStatus>([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.CANCELED,
]);

export function resolveActivePlan(sub: SubGate, now: Date = new Date()): PlanTier {
  if (!sub) return PlanTier.FREE;
  const statusOk = ACCESS_STATUSES.has(sub.status);
  const notExpired = sub.endsAt == null || sub.endsAt.getTime() > now.getTime();
  return statusOk && notExpired ? sub.plan : PlanTier.FREE;
}

/**
 * Webhook processing decision — idempotent + order-safe.
 * - "duplicate": this exact event id was already processed → no-op.
 * - "stale": an older event arriving after a newer one already applied
 *   (out-of-order delivery, e.g. a late activation superseded by a cancel) → no-op.
 * - "apply": process it.
 */
export function decideWebhook(input: {
  alreadyProcessed: boolean;
  eventCreatedAt: Date;
  lastEventAt: Date | null | undefined;
}): "apply" | "duplicate" | "stale" {
  if (input.alreadyProcessed) return "duplicate";
  if (input.lastEventAt && input.eventCreatedAt.getTime() < input.lastEventAt.getTime()) return "stale";
  return "apply";
}
