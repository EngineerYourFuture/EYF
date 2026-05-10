# 28.3 · Recommendation Engine — Scoring Model

## Formula

For each module `m ∈ { dsa, core_subjects, placement, resume, tech_skills }`:

```
score(m) =
  w_goal       * goal_alignment(m)     +
  w_urgency    * urgency(m)            +
  w_stagnation * stagnation(m)         +
  w_weakness   * weakness_signal(m)    +
  w_deadline   * deadline_pressure(m)  +
  w_plan       * entitlement_bonus(m)  +
  w_recent     * novelty_bonus(m)      -
  w_fatigue    * fatigue_penalty(m)
```

All component values are **normalized to [0, 1]**.

---

## Global Default Weights

| Weight | Symbol | Value |
|--------|--------|-------|
| Goal alignment | `w_goal` | `0.30` |
| Urgency | `w_urgency` | `0.20` |
| Stagnation | `w_stagnation` | `0.15` |
| Weakness signal | `w_weakness` | `0.15` |
| Deadline pressure | `w_deadline` | `0.10` |
| Plan entitlement bonus | `w_plan` | `0.05` |
| Novelty bonus | `w_recent` | `0.05` |
| Fatigue penalty | `w_fatigue` | `0.10` |

> Weights must sum to `1.0` when removing the fatigue term (fatigue is a subtraction).

---

## Score Range

| Score | Meaning |
|-------|---------|
| `~1.0` | Maximum priority — all signals align strongly |
| `~0.5` | Moderate priority |
| `~0.0` | Very low priority — module should not be recommended |
| `< 0` | Possible if fatigue penalty is large |

---

## Related

- [Component Definitions](./component-definitions.md)
- [Priority Resolution](./priority-resolution.md)
