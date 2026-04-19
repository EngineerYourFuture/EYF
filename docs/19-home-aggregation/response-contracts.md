# 34.3 · Home Aggregation — Response Contracts

---

## `GET /api/v1/home/summary` Full Response

```json
{
  "user": {
    "id": "uuid",
    "plan": "pro",
    "xp": 1200,
    "streak": 7
  },
  "usage": {
    "daily_submissions_used": 12,
    "daily_submissions_limit": null,
    "mentorship_used": 1,
    "mentorship_limit": 1
  },
  "modules": [
    {
      "key": "dsa",
      "status": "unlocked",
      "progress_percent": 64,
      "last_activity_at": "2026-04-17T14:00:00Z",
      "cta": "continue"
    },
    {
      "key": "core_subjects",
      "status": "unlocked",
      "progress_percent": 40,
      "last_activity_at": "2026-04-15T10:00:00Z",
      "cta": "continue"
    },
    {
      "key": "placement",
      "status": "partially_locked",
      "progress_percent": 20,
      "last_activity_at": "2026-04-10T09:00:00Z",
      "cta": "continue"
    },
    {
      "key": "resume",
      "status": "unlocked",
      "progress_percent": 55,
      "last_activity_at": "2026-04-12T16:00:00Z",
      "cta": "continue"
    },
    {
      "key": "tech_skills",
      "status": "unlocked",
      "progress_percent": 22,
      "last_activity_at": "2026-04-09T11:00:00Z",
      "cta": "start"
    }
  ],
  "recommendation_preview": {
    "module": "core_subjects",
    "action_id": "dbms-normalization-l1"
  },
  "generated_at": "2026-04-17T17:30:00Z",
  "stale": false
}
```

### Key Fields

| Field | Notes |
|-------|-------|
| `daily_submissions_limit` | `null` for Unlimited plans (Pro/Elite) |
| `mentorship_used/limit` | Only present for Pro/Elite; omitted for Free/Basic |
| `recommendation_preview` | Lightweight preview — full rec from `/home/recommendation` |
| `stale` | `true` if snapshot is > 5 min old; async refresh triggered |
