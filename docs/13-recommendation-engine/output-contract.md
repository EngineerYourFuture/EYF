# 28.8–28.9 · Output Contract & Pseudocode

---

## 28.8 · Output Contract

```json
{
  "recommendation_id": "rec_01J...",
  "generated_at": "2026-04-17T17:30:00Z",
  "user_id": "uuid",
  "module": "dsa|core_subjects|placement|resume|tech_skills|billing",
  "action_type": "solve_problem|revise_topic|take_mock|update_resume|complete_skill_task|upgrade_prompt",
  "action_id": "string",
  "title": "string",
  "reason_code": "WEAK_TOPIC|STAGNATION|GOAL_ALIGNMENT|QUOTA_BLOCKED|COLD_START",
  "score": 0.0,
  "estimated_effort_minutes": 25,
  "difficulty_or_level": "easy|medium|hard|L1|L2|L3",
  "required_plan": "free|basic|pro|elite|null",
  "fallback_action_id": "string|null",
  "expires_at": "2026-04-18T00:00:00Z"
}
```

### Field Notes

| Field | Notes |
|-------|-------|
| `recommendation_id` | Unique per generation event — use for dedup + analytics |
| `module` | `billing` only when `action_type = upgrade_prompt` |
| `required_plan` | Non-null only when `action_type = upgrade_prompt` |
| `fallback_action_id` | Alternate action if primary action becomes unavailable |
| `expires_at` | Recommendation is valid until end of day (midnight UTC) |

### Reason Codes

| Code | Trigger |
|------|---------|
| `WEAK_TOPIC` | `weakness_signal > 0.7` was the top scoring factor |
| `STAGNATION` | `stagnation = 1.0` — no progress in recent actions |
| `GOAL_ALIGNMENT` | `goal_alignment` was the top scoring factor |
| `QUOTA_BLOCKED` | All higher actions blocked; returning accessible action |
| `COLD_START` | User has < 3 total actions |

---

## 28.9 · Pseudocode

```python
function recommend(user_id):
    snap = load_feature_snapshot(user_id)

    if snap.total_actions < 3:
        return cold_start_recommendation(snap)

    module_scores = {}
    for m in MODULES:
        if not is_module_accessible(m, snap.plan):
            continue
        module_scores[m] = calc_module_score(m, snap)

    sorted_modules = sort_desc(
        module_scores,
        tie_break=[weakness_signal, last_action_at, module_name]
    )

    for m in sorted_modules:
        actions = rank_actions_in_module(m, snap)
        for a in actions:
            if is_action_allowed(a, snap):
                return build_recommendation(m, a, snap)

    return build_upgrade_prompt(snap)
```

### Key Functions

| Function | Description |
|----------|-------------|
| `load_feature_snapshot(user_id)` | Loads all input signals atomically |
| `calc_module_score(m, snap)` | Applies [scoring formula](./scoring-model.md) |
| `is_module_accessible(m, plan)` | Checks entitlement — excludes fully locked modules |
| `rank_actions_in_module(m, snap)` | Scores and sorts actions within a module |
| `is_action_allowed(a, snap)` | Checks quota + plan for this specific action |
| `build_upgrade_prompt(snap)` | Returns `upgrade_prompt` with required plan |
