# 36.3–36.5 · Concurrency — Webhook, Session & Mentorship Races

---

## 36.3 · Webhook Out-of-Order / Duplication

| Problem | Solution |
|---------|---------|
| Duplicate webhook delivery | Deduped by `UNIQUE(provider, provider_event_id)` in `billing_events` |
| Out-of-order events | Store `last_event_at` on subscription; ignore events where `event.occurred_at < last_event_at` |

---

## 36.4 · Session Replacement Race

### Problem

Two login requests arrive simultaneously. Both read `active_session_id` before either writes — resulting in both sessions being "active".

### Solution

```sql
BEGIN;

-- Row lock on the user record
SELECT active_session_id FROM users
WHERE id = $user_id
FOR UPDATE;

-- Create new session
INSERT INTO user_sessions (...) VALUES (...) RETURNING id;

-- Revoke old session + set new one atomically
UPDATE users
SET active_session_id = $new_session_id
WHERE id = $user_id;

COMMIT;
```

### Rules

- Both **login** and **refresh** flows must acquire the row lock before updating `active_session_id`.
- Access token validation always reads **the latest** `active_session_id` — never cached.

---

## 36.5 · Mentorship Booking Race

### Problem

User makes two simultaneous booking requests when 1 mentorship slot remains — both could succeed.

### Solution

```sql
BEGIN;

-- Lock the monthly usage row
SELECT mentorship_used FROM user_monthly_usage
WHERE user_id = $1 AND month = $current_month
FOR UPDATE;

-- Validate quota
-- if mentorship_used >= mentorship_limit → ROLLBACK + MENTORSHIP_QUOTA_EXCEEDED

-- Increment + create booking atomically
UPDATE user_monthly_usage SET mentorship_used = mentorship_used + 1 ...;
INSERT INTO mentorship_bookings (...) VALUES (...);

COMMIT;
```

### Unique Slot Constraint

To further prevent double-booking the same time slot:

```sql
ALTER TABLE mentorship_bookings
ADD CONSTRAINT uq_mentor_slot UNIQUE (mentor_id, scheduled_at);
```

---

## Related

- [Quota Locking](./quota-locking.md)
- [Billing Webhook Idempotency](../16-billing-spec/webhook-mapping.md)
