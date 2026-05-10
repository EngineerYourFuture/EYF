# 31.5–31.6 · Billing — Dunning & Edge Cases

---

## 31.5 · Retry / Dunning Logic

### Trigger

`invoice.payment_failed` event received.

### Retry Schedule

| Day | Action |
|-----|--------|
| D+0 | Payment failed — subscription → `past_due` |
| D+1 | Retry attempt 1 + notify user |
| D+3 | Retry attempt 2 + notify user |
| D+5 | Retry attempt 3 + notify user |
| D+7 | Grace expires → downgrade to Free/Basic |

### During Grace Period

- Subscription state = `grace_period` (internal)
- **Entitlement preserved** — user retains current plan access during all retries
- Notification sent at each retry and before final downgrade

---

## 31.6 · Edge-Case Handling

| Edge Case | Handling |
|-----------|---------|
| **Double webhook** | Deduped by unique `(provider, provider_event_id)` — no-op on duplicate |
| **Out-of-order events** | Ignore stale events where `event.occurred_at < subscription.last_event_at` |
| **Partial payment** | Do NOT activate plan until provider marks fully paid |
| **Checkout success but webhook delay** | Temporary `pending_activation` state — max timeout 10 min, then fallback check |
| **Downgrade mid-cycle** | Apply at period boundary unless explicit immediate downgrade policy is set |

---

## Payment Failure UX Rule

> **A payment failure must NEVER silently downgrade the user's plan.**
>
> The existing entitlement is preserved through the entire grace period and dunning sequence. Downgrade only occurs after grace expires without successful payment.

---

## Related

- [Provider Abstraction & States](./provider-abstraction.md)
- [Webhook Mapping](./webhook-mapping.md)
- [Security Policies](../04-security/README.md)
