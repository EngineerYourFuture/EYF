# 36 · Concurrency — Quota Locking

---

## 36.1 · Quota Update Locking

### Problem

Two parallel requests could both read a quota count below the limit, both pass the check, and both execute — resulting in an over-quota state.

### Solution

```sql
-- Phase 1: Ensure row exists
INSERT INTO daily_submission_usage (user_id, date, count)
VALUES ($1, CURRENT_DATE, 0)
ON CONFLICT (user_id, date) DO NOTHING;

-- Phase 2: Lock + validate + increment in single transaction
BEGIN;

SELECT count FROM daily_submission_usage
WHERE user_id = $1 AND date = CURRENT_DATE
FOR UPDATE;

-- Application code: if count >= limit → ROLLBACK + return QUOTA_EXCEEDED

UPDATE daily_submission_usage
SET count = count + 1
WHERE user_id = $1 AND date = CURRENT_DATE;

COMMIT;
```

### Rules

1. `INSERT ... ON CONFLICT` ensures the row exists before locking.
2. `SELECT ... FOR UPDATE` blocks any other transaction from reading or writing this row.
3. Limit check and increment are **in the same transaction** — no window for races.
4. The actual quota-consuming action (sandbox execution, booking, etc.) runs **only after COMMIT succeeds**.
5. **Never compute quotas client-side** — always enforce at DB level.
