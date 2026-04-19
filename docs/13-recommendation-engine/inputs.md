# 28.2 · Recommendation Engine — Inputs

## Authoritative Input Signals

All signals are loaded as a single **feature snapshot** for the user before scoring begins.

| Signal | Source Table | Window |
|--------|-------------|--------|
| `submissions` | `submissions` | Last 30 days |
| `daily_submission_usage` | `daily_submission_usage` | Current day |
| `placement_attempts` | `placement_attempts` | Last 30 days |
| `core_subject_progress` | `core_subject_notes` / progress tracking | Topic completion + `last_revised_at` |
| `resumes` | `resumes` | Completeness score |
| `tech_skill_progress` | `user_tech_skill_progress` | Current state |
| `module_progress` | `module_progress` | All modules |
| `user_learning_goals` | `user_learning_goals` | Target role, priority modules |
| `plan_entitlements` + `users.plan` | `plan_entitlements`, `users` | Current plan |
| `user_monthly_usage` | `user_monthly_usage` | Mock/mentorship usage this month |

---

## Snapshot Loading

```
snap = load_feature_snapshot(user_id)
snap.total_actions = count of all tracked actions (submissions + placements + topics + skills)
```

> The snapshot must be loaded atomically — all signals from the **same point in time** — to ensure determinism.

---

## Related

- [Scoring Model](./scoring-model.md)
- [Data Model Section 27](../12-module-home/data-model-additions.md)
- [Tech Skills Data Model](../14-tech-skills/data-model.md)
