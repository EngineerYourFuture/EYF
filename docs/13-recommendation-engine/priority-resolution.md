# 28.5–28.7 · Priority Resolution, Cold-Start & Conflict Resolution

---

## 28.5 · Priority Resolution

### Steps

| Step | Action |
|------|--------|
| 1 | Compute `score(m)` for all 5 modules |
| 2 | **Exclude** modules fully inaccessible by entitlement (fully locked) |
| 3 | **Select top module** by score |
| 4 | **Select top action** inside that module by action score |
| 5 | Apply **tiebreakers** in strict order (see below) |

### Tiebreaker Rules (Strict Order)

| Priority | Tiebreaker |
|----------|-----------|
| 1st | Higher `weakness_signal` |
| 2nd | Lower `last_action_at` (older is higher priority) |
| 3rd | Lower `estimated_effort_minutes` (easier wins tie) |
| 4th | Lexical `action_id` — **final deterministic tiebreak** |

---

## 28.6 · Cold-Start Logic

**Condition:** User has `< 3` total tracked actions.

| Step | Recommendation |
|------|---------------|
| 1 | Show onboarding action in `/app/home` |
| 2 | **First** recommendation → DSA easy starter problem |
| 3 | **Second** recommendation → Core Subjects intro topic |
| 4 | **Third** recommendation → Resume baseline setup |
| 5 | Switch to full scoring model |

> After 3+ actions, the scoring model takes over. Cold-start sequence is **not** repeated.

---

## 28.7 · Conflict Resolution

| Condition | Resolution |
|-----------|-----------|
| Top module action blocked by quota/plan | Downgrade to next highest available action in **same module** |
| No available action in top module | Fallback to **next module** by score |
| **All** actions blocked across all modules | Return `action_type = "upgrade_prompt"` with `required_plan` |

> "Blocked" means: quota exceeded (`QUOTA_EXCEEDED`) OR feature locked (`FEATURE_LOCKED`) for the user's current plan.
