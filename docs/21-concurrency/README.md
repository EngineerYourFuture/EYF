# 36 · Concurrency and Race Condition Controls

> Row-level locking strategies, idempotency key enforcement, and session replacement safety across all critical write paths.

---

## Files in This Section

| File | Description |
|------|-------------|
| [quota-locking.md](./quota-locking.md) | Quota update locking + INSERT ON CONFLICT pattern |
| [idempotency-table.md](./idempotency-table.md) | `request_idempotency` DDL + submission race handling |
| [session-webhook-race.md](./session-webhook-race.md) | Session replacement race + webhook out-of-order + mentorship booking race |
