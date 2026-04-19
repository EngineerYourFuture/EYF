# 35.1–35.2 · Analytics — Event Schema & Ingestion Pipeline

---

## 35.1 · Event Schema

All analytics events must conform to this envelope:

```json
{
  "event_id": "evt_01J...",
  "event_type": "problem_submitted",
  "event_version": "1.0",
  "occurred_at": "2026-04-17T17:30:00Z",
  "user_id": "uuid",
  "session_id": "uuid",
  "role": "user|staff|admin",
  "plan": "free|basic|pro|elite|null",
  "module": "dsa|core_subjects|placement|resume|tech_skills|authority",
  "context": {
    "page": "/app/problems/abc",
    "request_id": "req_..."
  },
  "payload": {},
  "idempotency_key": "string"
}
```

### Field Notes

| Field | Notes |
|-------|-------|
| `event_id` | Server-generated unique ID per event |
| `event_version` | Schema version — allows backward-compatible evolution |
| `role` / `plan` | Captured at event time — not joined later |
| `module` | Which product module triggered this event |
| `context.request_id` | Links event to the originating API request for trace correlation |
| `payload` | Event-specific data (e.g., `problem_id`, `status`, `topic_key`) |
| `idempotency_key` | Client-provided — used for dedup |

---

## 35.2 · Ingestion Pipeline

```
Client / Server emits event
  → POST /api/v1/analytics/events
  → Schema validation (reject unknown event_type or invalid schema with 422)
  → Enqueue to event queue
  → Async consumer
      → Write to data warehouse (analytics store)
      → Write to operational DB (for real-time dashboards / risk alerts)
```

### Validation Rules

| Rule | On Failure |
|------|-----------|
| `event_type` must be in known event catalog | `422 INVALID_EVENT_TYPE` |
| Required fields must be present and typed correctly | `422 SCHEMA_VALIDATION_FAILED` |
| `idempotency_key` must be a string ≤ 128 chars | `422` |
