# 35.3–35.5 · Analytics — Critical Events, Idempotency & Real-Time vs Batch

---

## 35.3 · Must-Track Critical Events

| Domain | Events |
|--------|--------|
| **Auth** | `login_success`, `login_fail`, `twofa_challenge`, `session_revoked` |
| **Learning** | `problem_opened`, `problem_run`, `problem_submitted`, `problem_result`, `visualizer_opened` |
| **Conversion** | `upgrade_cta_clicked`, `checkout_started`, `checkout_success`, `checkout_failed` |
| **Access** | `feature_locked`, `quota_exceeded` |
| **Mentorship** | `booking_created`, `booking_quota_denied` |
| **Authority** | `application_action_taken`, `admin_crud_action` |

> Missing any of the above events will break **conversion funnels, risk detection, and product analytics**. Treat as `P0` for instrumentation.

---

## 35.4 · Idempotency

### Dedup Rule

```sql
CREATE UNIQUE INDEX uq_analytics_events_idempotency
  ON analytics_events(event_type, idempotency_key);
```

- Duplicate event (same `event_type` + `idempotency_key`) → return `202 accepted_duplicate`.
- No data written on duplicate.
- Client considers the event successfully recorded.

---

## 35.5 · Real-Time vs Batch Processing

| Processing Mode | Latency SLA | Use Cases |
|----------------|-------------|-----------|
| **Real-time** | < 5 seconds | Operational dashboards, risk event detection, quota/lock alerts |
| **Batch (hourly)** | < 1 hour | Cohort analysis, daily active users |
| **Batch (daily)** | < 24 hours | Retention cohorts, conversion funnels, long-term product analytics |

### Real-Time Events (Must be < 5s)

- `session_revoked`, `login_fail` (risk pipeline)
- `feature_locked`, `quota_exceeded` (access monitoring)
- `checkout_failed` (conversion alerts)

### Batch Events

- All learning events → rolled up into daily/weekly aggregated tables
- Revenue and plan cohort metrics → daily batch

---

## Related

- [Event Schema](./event-schema.md)
- [Ingestion Pipeline](./event-schema.md#352--ingestion-pipeline)
