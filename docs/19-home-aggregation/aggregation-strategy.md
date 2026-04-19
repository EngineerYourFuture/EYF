# 34.2 · Home Aggregation — Strategy & Snapshot Tables

---

## Aggregation Approach

Home data is built from **pre-aggregated materialized snapshot tables** that are updated by event consumers — not computed on-the-fly per request.

### Snapshot Tables

| Table | Purpose |
|-------|---------|
| `home_summary_snapshot` | XP, streak, usage, plan — keyed by `user_id` |
| `module_progress_snapshot` | Per-module progress — keyed by `(user_id, module_key)` |

---

## Read Path

```
1. snapshot read (fast path) — return immediately if fresh
2. if stale > 5 minutes → trigger async refresh + return stale data with stale_at timestamp
3. if snapshot missing → synchronous fallback query with 500ms budget
```

### Stale-While-Revalidate

- Client receives stale data labeled with `stale: true` and `generated_at`.
- Async refresh updates the snapshot in the background.
- Next request receives fresh data.

---

## Snapshot Update Triggers

Snapshots are updated by background consumers when:
- A submission is accepted
- A topic is marked complete
- A mentorship booking is created
- A resume is saved with improved completeness score
- A tech skill task is passed
- A plan is changed

---

## Related

- [Response Contracts](./response-contracts.md)
- [Query Optimization](./query-optimization.md)
