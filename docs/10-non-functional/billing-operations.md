# Billing Operations Completeness

**Section 22 of PRD.**

---

## Requirements

| Area | Requirement |
|------|-------------|
| **Refund Policy** | Define refund SLA (e.g., within 7 days of charge) |
| **Chargeback / Dispute** | Process for handling provider chargebacks |
| **Dunning / Retry** | Schedule for retrying failed renewals (e.g., Day 1, Day 3, Day 7 → cancel) |
| **Invoices / Receipts** | Auto-generate and email invoices on successful charge |
| **Cancellation** | Cancellation takes effect at period end — entitlement preserved until then |
| **Downgrade** | Downgrade effective date = end of current billing period |
| **Tax Handling** | Jurisdiction-based tax calculation required |

---

## Dunning Schedule (Recommended)

```
Payment fails
  → Day 0:  Retry immediately
  → Day 3:  Retry + notify user
  → Day 7:  Final retry + warning
  → Day 10: Cancel subscription (downgrade to Free)
```

---

## Related

- [Billing Functional Requirements](../05-functional-requirements/billing.md)
- [Billing API](../06-api/api-surface.md#103--billing)
