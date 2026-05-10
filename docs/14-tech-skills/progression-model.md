# 29.2–29.3 · Tech Skills — Progression Model & Task Types

---

## 29.2 · Progression Model

### Level Scale

- Levels `L1` → `L5` per skill.
- Users start at `current_level = 1`.

### Level-Up Criterion

Both conditions must be satisfied:

| Condition | Description |
|-----------|-------------|
| **Mandatory tasks complete** | All `project` and `checkpoint` tasks for the current level must be in `passed` status |
| **XP threshold reached** | Total `xp_points` must meet the minimum threshold for the next level |

### XP Formula

```
awarded_xp = base_points * quality_factor
```

| Task Type | Base Points | Quality Factor |
|-----------|------------|---------------|
| `project` | 40 | 0.8 – 1.2 (from score) |
| `checkpoint` | 25 | 0.8 – 1.2 (from score) |
| `quiz` | 15 | 0.8 – 1.2 (from score) |
| `reading` | 10 | 1.0 (binary — complete or not) |

> `quality_factor` is derived from the `score` field on the task attempt (%) mapped linearly to `[0.8, 1.2]`.

---

## 29.3 · Task Types

| Type | Description | Mandatory for Level-Up |
|------|-------------|----------------------|
| `project` | Submit artifact/evidence (link, repo, file) | ✅ Yes |
| `checkpoint` | Gated practical validation — must demonstrate skill | ✅ Yes |
| `quiz` | Objective questions — auto-scored | ❌ No |
| `reading` | Completion + quick follow-up question | ❌ No |

> **Mandatory task rule:** Only `project` and `checkpoint` types block level progression.
