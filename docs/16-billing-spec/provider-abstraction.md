# 31.1–31.2 · Billing — Provider Abstraction & Subscription States

---

## 31.1 · Provider Abstraction Layer

All billing operations go through a **provider-agnostic interface**. The concrete implementation (e.g., Stripe) is injected at the service layer.

### Interface

```typescript
interface BillingProvider {
  createCheckoutSession(input): Promise<{
    sessionId: string;
    redirectUrl: string;
  }>;

  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  changePlan(
    providerSubscriptionId: string,
    targetPlan: string
  ): Promise<void>;

  verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody: Buffer
  ): {
    valid: boolean;
    eventId: string;
    eventType: string;
    occurredAt: string;
  };

  normalizeWebhookEvent(raw: unknown): NormalizedBillingEvent;
}
```

### Benefits

- Provider can be swapped (Stripe → Paddle → custom) without changing business logic.
- All webhook events normalized to `NormalizedBillingEvent` before processing.
- Test implementations can be injected in CI.

---

## 31.2 · Internal Subscription States

| State | Description |
|-------|-------------|
| `trialing` | In trial period — full access without payment |
| `active` | Payment confirmed — full entitlement active |
| `past_due` | Payment failed — in grace period |
| `grace_period` | Extension of `past_due` — entitlement preserved up to 7 days |
| `paused` | Subscription paused by user |
| `canceled` | Canceled — entitlement ends at period boundary |
| `incomplete` | Checkout started but payment not confirmed |
| `incomplete_expired` | Checkout timed out — abandoned session |

### State Flow

```
incomplete → active (payment confirmed)
          → incomplete_expired (timeout)

active    → past_due (payment fails on renewal)
          → canceled (user cancels)

past_due  → grace_period (dunning period begins)
          → active (retry succeeds)
          → canceled (grace expires without payment)
```
