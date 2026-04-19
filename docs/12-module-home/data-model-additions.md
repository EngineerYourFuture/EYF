# 27.10 · Data Model Additions

New tables required to support the module-first product structure.

---

## New Tables

### `module_progress`

Tracks per-user progress for each module.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID FK | References `users` |
| `module_key` | string | `dsa` / `subjects` / `placement` / `resume` / `skills` |
| `completion_percent` | int | 0–100 |
| `last_activity_at` | timestamp | Most recent activity in this module |
| `status` | enum | `not_started` / `in_progress` / `completed` |

**Index:** `(user_id, module_key)` — unique

---

### `user_learning_goals`

Stores user's self-declared career goals to inform recommendations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID FK | References `users` — unique |
| `target_role` | string | e.g., `"Backend Engineer"`, `"Fullstack"` |
| `target_timeline` | date | When user wants to be placed |
| `priority_modules` | string[] | Ordered list of priority modules |
| `updated_at` | timestamp | Last updated |

---

### `tech_skill_progress`

Tracks progress within the Tech Skills module.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID FK | References `users` |
| `skill_key` | string | e.g., `react`, `docker`, `system-design` |
| `level` | int | Current level / progress stage |
| `milestones_completed` | int | Count of completed checkpoints |
| `updated_at` | timestamp | Last updated |

**Index:** `(user_id, skill_key)` — unique

---

### `recent_activity`

Cross-module activity timeline for the home feed.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID FK | References `users` |
| `module_key` | string | Module where action occurred |
| `action_type` | string | e.g., `PROBLEM_SUBMITTED`, `TOPIC_COMPLETED`, `RESUME_UPDATED` |
| `metadata` | jsonb | Context-specific data (problem_id, topic, etc.) |
| `created_at` | timestamp | When the action occurred |

**Index:** `(user_id, created_at DESC)` for feed queries

---

## Impact on Existing Tables

| Existing Table | Addition |
|---------------|---------|
| `users` | No change — plan and role already present |
| `submissions` | Already owned per user — feeds `module_progress` for DSA |
| `mentorship_bookings` | Already present — feeds snapshot on home |
| `resumes` | Already present — feeds resume module progress |

---

## Related

- [Existing Data Model](../07-data-model/README.md)
- [API Additions](./api-additions.md)
