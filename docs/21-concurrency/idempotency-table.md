# 36.2 · Concurrency — Idempotency Table (Submission Race)

---

## Problem

A user double-submits or retries a submit request due to a network error. Without idempotency protection, both execute — potentially double-charging quota and returning inconsistent results.

---

## Solution: `request_idempotency` Table

```sql
CREATE TABLE request_idempotency (
  user_id       UUID        NOT NULL,
  endpoint      TEXT        NOT NULL,
  key           TEXT        NOT NULL,
  response_hash TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, endpoint, key)
);
```

---

## Processing Flow

```
1. Client sends POST /api/v1/problems/{id}/submit
   with header: X-Idempotency-Key: <client-generated-uuid>

2. Server attempts INSERT into request_idempotency (user_id, endpoint, key).

3. On UNIQUE CONFLICT → return original response (stored as response_hash or full response).

4. On success → process the submit → store response_hash → return result.
```

---

## Key Rules

| Rule | Detail |
|------|--------|
| **Header required** | `X-Idempotency-Key` must be present on submit, mentorship booking, and billing endpoints |
| **Missing key** | Return `400 IDEMPOTENCY_KEY_REQUIRED` |
| **Key format** | UUID v4, max 128 chars |
| **Key scope** | Scoped to `(user_id, endpoint)` — same key can be reused across different endpoints |
| **TTL** | Keys expire after 24 hours — old completed keys may be purged |

---

## Endpoints Requiring X-Idempotency-Key

- `POST /api/v1/problems/{id}/submit`
- `POST /api/v1/billing/checkout`
- `POST /api/v1/billing/change-plan`
- `POST /api/v1/mentorship/bookings`

---

## Related

- [Quota Locking](./quota-locking.md)
- [Security Controls — Request Idempotency](../22-security-controls/request-idempotency.md)
