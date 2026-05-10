# 34.4–34.5 · Home Aggregation — Query Optimization & Failure Fallback

---

## 34.4 · Query Optimization

| Optimization | Details |
|-------------|---------|
| **Covering indexes** | `(user_id, created_at DESC)` on all activity tables |
| **Snapshot tables** | Keyed by `user_id` — single-row lookup per user |
| **Bulk module fetch** | All 5 module progress rows fetched in **one query** — no N+1 |
| **Read replica** | All non-transactional home reads use a **read replica** |

### Index Examples

```sql
-- submissions feed
CREATE INDEX idx_submissions_user_created
  ON submissions(user_id, created_at DESC);

-- recent activity feed
CREATE INDEX idx_recent_activity_user_created
  ON recent_activity(user_id, created_at DESC);

-- module progress bulk read
CREATE INDEX idx_module_progress_user
  ON module_progress(user_id);
```

---

## 34.5 · Failure Fallback

### If Recommendation Service is Unavailable

```json
{
  "recommendation_preview": null,
  "degraded": true,
  ...
}
```

- Summary is returned without the recommendation.
- `degraded: true` signals the client to show a degraded state for the recommendation card only.
- Everything else on the home screen renders normally.

### If One Module Fails to Aggregate

```json
{
  "modules": [...],          // partial — only successfully aggregated modules
  "module_errors": [
    { "module_key": "tech_skills", "error": "aggregation_timeout" }
  ]
}
```

- Home renders with available modules.
- Failed module card shows an error/retry state.
- Does **not** fail the entire home request.

---

## Related

- [Aggregation Strategy](./aggregation-strategy.md)
- [Response Contracts](./response-contracts.md)
