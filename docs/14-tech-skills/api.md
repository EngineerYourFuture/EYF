# 29.5 · Tech Skills — API

All endpoints prefixed with `/api/v1`.

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tech-skills/catalog` | List all skills by category |
| `GET` | `/tech-skills/{skill_key}` | Skill detail: tasks by level, user progress |
| `GET` | `/tech-skills/progress` | User's full tech skill progress across all skills |
| `POST` | `/tech-skills/tasks/{task_key}/start` | Mark task as started |
| `POST` | `/tech-skills/tasks/{task_key}/submit` | Submit task attempt with evidence |
| `GET` | `/tech-skills/tasks/{task_key}/status` | Get current attempt status |

---

## Submit Request Body

```json
{
  "evidence_url": "https://github.com/user/docker-project",
  "answers": [
    { "q": "q1", "a": "My answer..." }
  ],
  "metadata": {
    "repo": "https://github.com/...",
    "notes": "Deployed using Docker Compose"
  }
}
```

---

## Submit Response

```json
{
  "task_key": "docker-l2-project",
  "status": "passed",
  "awarded_xp": 48,
  "skill_level_before": 2,
  "skill_level_after": 3,
  "next_task_key": "k8s-l3-reading"
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| `status` | `started` / `submitted` / `passed` / `failed` |
| `awarded_xp` | XP awarded = `base_points * quality_factor` |
| `skill_level_before` | User's level before this submission |
| `skill_level_after` | User's level after — may increase if level-up criteria met |
| `next_task_key` | Recommended next task (or `null` if no more tasks at this level) |

---

## Related

- [Data Model](./data-model.md)
- [API Surface](../06-api/api-surface.md)
