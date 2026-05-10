# 9.3 · DSA Module

**Priority:** `P0` (run/submit core) / `P1` (full feature set)

---

## Requirements

| # | Requirement |
|---|-------------|
| 1 | Problem list with filter / search / pagination |
| 2 | Problem detail page — statement, examples, code editor |
| 3 | **Run** endpoint — executes against sample or custom input |
| 4 | **Submit** endpoint — evaluates against hidden test cases |
| 5 | Store per-submission: status, runtime, memory usage, language |
| 6 | Success state shows **Next Problem** CTA + **Visualize** CTA |

---

## Execution Flow

```
User writes code
  → Run (sample input)   → Sandbox executes → Return stdout/stderr/runtime
  → Submit (hidden tests) → All tests pass?
      ✅ Accepted  → Success state → Next / Visualize CTAs
      ❌ WA/TLE/RE → Failure state → Retry
```

---

## Plan Constraints

| Plan | Daily Submission Limit |
|------|----------------------|
| Free | 10/day |
| Basic | 50/day |
| Pro | Unlimited |
| Elite | Unlimited |

Exceeding limit → `QUOTA_EXCEEDED` error.

---

## Related APIs

- `GET /api/v1/problems`
- `GET /api/v1/problems/{id}`
- `POST /api/v1/problems/{id}/run`
- `POST /api/v1/problems/{id}/submit`

## Related Flows

- [Core Solve Flow](../08-user-flows/README.md#172-core-solve-flow)

## Related Docs

- [Execution Sandbox](../10-non-functional/execution-sandbox.md)
- [Visualizer](./visualizer.md)
