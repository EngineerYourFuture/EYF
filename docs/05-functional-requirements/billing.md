# 9.9 · Billing

**Priority:** `P0` (webhook/entitlement) / `P1` (full billing flows)

---

## Requirements

| # | Requirement |
|---|-------------|
| 1 | Public plans listing endpoint |
| 2 | Checkout session creation — provider-hosted page |
| 3 | Webhook processing with signature verification and idempotency |
| 4 | Plan upgrade with immediate entitlement effect |
| 5 | Plan downgrade with effective-date rules (period-end) |
| 6 | Payment failure must **preserve existing entitlement** — no downgrade on failure |

---

## Webhook Rules

- Signature must be verified on every incoming webhook
- Idempotency key inserted before processing — duplicate events return success/no-op
- Subscription state change + user plan update must be **atomic** (single transaction)

---

## Plan Change Rules

| Change | Effective Date |
|--------|---------------|
| Upgrade (Free → Paid) | Immediate |
| Upgrade (Paid → Higher) | Immediate |
| Downgrade | End of current billing period |
| Cancellation | End of current billing period |

---

## Billing Operations (see also)

See [Billing Operations](../10-non-functional/billing-operations.md) for:
- Refund policy
- Dunning / retry schedule
- Chargeback handling
- Invoice / receipt generation
- Tax handling

---

## Related APIs

- `GET /api/v1/plans`
- `POST /api/v1/billing/checkout`
- `POST /api/v1/billing/webhook`
- `POST /api/v1/billing/change-plan`

## Related Flows

- [Upgrade & Billing Flow](../08-user-flows/README.md#174-upgrade--billing-flow)
- [S3 Payment Failure Recovery](../08-user-flows/README.md#s3-payment-failure-recovery)
