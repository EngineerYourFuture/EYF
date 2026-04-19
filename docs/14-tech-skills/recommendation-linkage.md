# 29.4 · Tech Skills — Recommendation Linkage

How the Tech Skills module feeds into and is influenced by the [Recommendation Engine](../13-recommendation-engine/README.md).

---

## Score Boost Rules

| Condition | Effect on Recommendation Score |
|-----------|-------------------------------|
| DSA weakness in topic requiring a **missing tech prerequisite** | Increase Tech Skills module score by `+0.15` |
| User has **no activity in Tech Skills for 7 days** AND roadmap is active | Set `urgency` floor to `0.6` (cannot drop below) |

---

## Action Type

When the recommendation engine selects Tech Skills as the top module, it emits:

```json
{
  "action_type": "complete_skill_task",
  "action_id": "docker-l2-project",
  "module": "tech_skills"
}
```

---

## Dependency Graph

Tasks have a `dependencies` field (array of `task_key`s). The recommendation engine must respect this:

- Only recommend tasks whose **all dependencies** are in `passed` status.
- This prevents recommending advanced tasks before prerequisites.

---

## Related

- [Recommendation Engine — Component Definitions](../13-recommendation-engine/component-definitions.md)
- [Tech Skills API](./api.md)
