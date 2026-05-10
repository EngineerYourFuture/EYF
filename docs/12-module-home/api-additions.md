# 27.9 · API Additions for Module Home

New endpoints required to power `/app/home` and the module system.

All endpoints prefixed with `/api/v1`.

---

## New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/home/summary` | XP, streak, usage counters, plan, module progress summary |
| `GET` | `/home/recommendation` | Next best module/action recommendation (module-aware) |
| `GET` | `/home/recent-activity` | Timeline of actions across all modules |
| `GET` | `/modules/status` | Per-module lock/unlock state, progress %, and CTA state |

---

## Endpoint Details

### `GET /api/v1/home/summary`

**Response includes:**

| Field | Description |
|-------|-------------|
| `xp` | Total XP earned |
| `streak` | Current active streak in days |
| `daily_submissions` | `{ used, limit, remaining }` |
| `mentorship_usage` | `{ used, quota }` — Pro/Elite only |
| `plan` | Current plan name |
| `module_progress` | Summary object per module (see `/modules/status`) |

---

### `GET /api/v1/home/recommendation`

**Response includes:**

| Field | Description |
|-------|-------------|
| `recommended_module` | Module key (e.g., `dsa`, `resume`, `subjects`) |
| `recommended_action` | Human-readable action string |
| `reason_code` | Machine-readable reason |
| `difficulty_or_level` | Difficulty / level label |
| `estimated_effort` | e.g., `"~15 min"` |
| `cta_route` | Deep link to the recommended action |

---

### `GET /api/v1/home/recent-activity`

**Response includes:**

| Field | Description |
|-------|-------------|
| `items[]` | Array of activity items |
| `items[].module_key` | Which module |
| `items[].action_type` | e.g., `PROBLEM_SUBMITTED`, `RESUME_UPDATED`, `TOPIC_COMPLETED` |
| `items[].metadata` | Context-specific metadata |
| `items[].created_at` | Timestamp |

---

### `GET /api/v1/modules/status`

**Response includes one entry per module:**

| Field | Description |
|-------|-------------|
| `module_key` | Module identifier |
| `access_state` | `unlocked` / `partially_locked` / `locked` |
| `completion_percent` | 0–100 |
| `last_activity_at` | Timestamp of last activity |
| `cta` | `start` / `continue` / `upgrade` |
| `locked_reason` | If locked: reason string |
| `required_plan` | If locked: minimum plan required |

---

## Existing Endpoint Updates

| Endpoint | Change |
|----------|--------|
| `GET /api/v1/recommendations/next` | Still exists for DSA-only context; `/home/recommendation` is module-aware extension |
| `GET /api/v1/dashboard` | May be replaced or supplemented by `/home/summary` |

---

## Related

- [Data Model Additions](./data-model-additions.md)
- [Full API Surface](../06-api/api-surface.md)
