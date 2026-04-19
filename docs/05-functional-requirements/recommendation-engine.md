# 9.5 · Recommendation Engine v1

**Priority:** `P1`

---

## Overview

Rule-based recommendation engine that suggests the next problem based on the user's solve history.

---

## Inputs

| Signal | Description |
|--------|-------------|
| Solved history | List of problems solved (topic, difficulty, outcome) |
| Failed history | Problems attempted but not solved |
| Topic signal | Derived strong/weak topic tags from history |

---

## Rules

| Condition | Action |
|-----------|--------|
| Strong topic streak (solved ≥N consecutively) | Increase difficulty for that topic |
| Weak topic failure streak (failed ≥N consecutively) | Recommend easier prerequisite problem |

---

## Dashboard Output

The dashboard surfaces for the user:
1. **One next recommended problem** (rule-based)
2. **One weak-topic insight** (e.g., "You're struggling with Trees — try this easier problem")

---

## Related API

- `GET /api/v1/recommendations/next`
- `GET /api/v1/dashboard`

## Related Flows

- [Weak Topic Recovery Flow](../08-user-flows/README.md#173-weak-topic-recovery-flow)
