# 31 · Billing System Specification

> Provider-abstracted billing with full idempotency, dunning logic, and hardened edge-case handling.

---

## Files in This Section

| File | Description |
|------|-------------|
| [provider-abstraction.md](./provider-abstraction.md) | BillingProvider interface + subscription states |
| [webhook-mapping.md](./webhook-mapping.md) | Event → state mapping + idempotency DDL + processing algorithm |
| [dunning-edge-cases.md](./dunning-edge-cases.md) | Retry schedule, grace period, edge-case handling |
