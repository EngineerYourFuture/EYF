# 31.3–31.4 · Billing — Webhook Mapping & Idempotency

---

## 31.3 · Webhook Event Mapping

| Provider Event | Internal Action |
|---------------|----------------|
| `checkout.session.completed` | Create subscription row + set plan active |
| `invoice.paid` | Confirm active period — update `period_end` |
| `invoice.payment_failed` | Move to `past_due` — schedule dunning |
| `customer.subscription.updated` | Sync plan/status changes |
| `customer.subscription.deleted` | Set `canceled` — at period-end or immediate per policy |
| `charge.refunded` | Apply refund policy + entitlement rollback if required |

---

## 31.4 · Idempotency (DB-Level)

### `billing_events` Table

```sql
CREATE TABLE billing_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT        NOT NULL,
  provider_event_id TEXT        NOT NULL,
  event_type        TEXT        NOT NULL,
  payload           JSONB       NOT NULL,
  processed_at      TIMESTAMPTZ,
  status            TEXT        NOT NULL DEFAULT 'received',
  UNIQUE(provider, provider_event_id)
);
```

### Processing Algorithm

```
1. Attempt to INSERT event row with (provider, provider_event_id).
2. On UNIQUE CONFLICT → return 200 (no-op — already processed or in progress).
3. Process state transition inside a transaction.
4. On success → update processed_at = now() and status = 'processed'.
```

> **Critical:** Steps 3 and 4 must be in the **same transaction** — no partial writes.

---

## Related

- [Dunning & Edge Cases](./dunning-edge-cases.md)
- [Functional Requirements — Billing](../05-functional-requirements/billing.md)
