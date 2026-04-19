# 33.5 · Entitlement — Race Conditions

---

## Quota Race Condition

### Problem

Two parallel requests from the same user could both pass the quota check and both succeed, exceeding the limit by 1.

### Solution: SELECT FOR UPDATE

All quota-consuming endpoints must:

```sql
BEGIN;

-- 1. Lock the usage row
SELECT * FROM daily_submission_usage
WHERE user_id = $1 AND date = CURRENT_DATE
FOR UPDATE;

-- 2. Validate the limit
-- (if count >= limit → raise QUOTA_EXCEEDED)

-- 3. Increment in same transaction
UPDATE daily_submission_usage
SET count = count + 1
WHERE user_id = $1 AND date = CURRENT_DATE;

-- 4. Execute the critical action (e.g., submit code)
-- Only if steps 1-3 succeeded

COMMIT;
```

> **Critical rule:** The actual quota-consuming action (e.g., launching the sandbox) happens **only after** the increment commits successfully.

### INSERT ON CONFLICT Pattern

If the usage row doesn't exist yet for today:

```sql
INSERT INTO daily_submission_usage (user_id, date, count)
VALUES ($1, CURRENT_DATE, 0)
ON CONFLICT (user_id, date) DO NOTHING;

-- Then immediately SELECT FOR UPDATE
```

### Never Compute Quota Client-Side

> The frontend may display remaining quota as a convenience, but **all quota enforcement decisions are made server-side** in the transaction above.

---

## Related

- [Middleware Flow](./middleware-flow.md)
- [Transaction & Concurrency Rules](../07-data-model/README.md#transaction--concurrency-rules)
- [Concurrency Controls (Section 36)](../21-concurrency/README.md)
