# 28.4 · Recommendation Engine — Component Definitions

## Component Definitions per Module

### `goal_alignment(m)`
- Matches the module against the user's `target_role` roadmap in `user_learning_goals`.
- Higher score if this module is in `priority_modules` for the target role.

### `urgency(m)`
- Based on days since `module_progress.last_activity_at`.
- Normalized via **sigmoid** function so urgency increases non-linearly with inactivity.
- Example: 0 days = 0.0, 3 days = 0.3, 7 days = 0.7, 14+ days ≈ 1.0.

### `stagnation(m)`
- Set to `1.0` if user shows **no measurable progress** in last N actions for the module.
- "Measurable progress" is module-specific:
  - DSA: new problem accepted
  - Core: topic marked complete or revised
  - Placement: new mock completed
  - Resume: completeness score improved
  - Tech Skills: task status → `passed`

### `weakness_signal(m)`

| Module | Signal |
|--------|--------|
| DSA | Topic failure ratio (failed / total attempts per topic) |
| Core Subjects | Low retention / low revision frequency on topic |
| Placement | Declining mock attempt scores over time |
| Resume | Completeness below target threshold (e.g., < 70%) |
| Tech Skills | Milestone overdue (past expected completion date) |

### `deadline_pressure(m)`
- Higher score if `user_learning_goals.target_timeline` is **within 30 days**.
- Applied uniformly across all modules (not module-specific).

### `entitlement_bonus(m)`
- `+1.0` if the **core feature** of the module is **fully available** on user's current plan.
- `0.0` if the module is **partially or fully locked**.

### `novelty_bonus(m)`
- **Penalizes** recommending the same module more than **2 consecutive times**.
- Prevents the engine from being stuck in a single-module loop.
- Novelty = `1.0` if module was **not** in last 2 recommendations; `0.0` if it was.

### `fatigue_penalty(m)`
- Applied if user spent **> 70%** of recent actions in the **same module**.
- Prevents burnout-inducing over-focusing on a single area.
- Fatigue = `1.0` at 100% concentration; scaled linearly from the 70% threshold.
