# 30.5 · Visualizer — Failure Handling

---

## Status Transitions

```
processing
  → ready    (trace generated successfully)
  → failed   (all generation attempts exhausted)
```

---

## On Failure

| Step | Action |
|------|--------|
| 1 | Return deterministic error code: `TRACE_GENERATION_FAILED` |
| 2 | Expose retry endpoint (max **2 retries**) |
| 3 | If still failed after retries → show **canonical explanation card** |

---

## Retry Endpoint

```
POST /api/v1/visualizer/{submission_id}/trace/retry
```

- Maximum **2 retries** per submission.
- Returns the updated status immediately (still async generation).
- On 3rd failure (after 2 retries) → canonical fallback is served.

---

## Canonical Explanation Card

- A static, pre-written explanation of the algorithm for that problem.
- Shown when trace generation fails permanently.
- Ensures users always receive value even when live trace is unavailable.

---

## Error Code

| Code | Description |
|------|-------------|
| `TRACE_GENERATION_FAILED` | Trace worker failed to generate a valid trace after max retries |

---

## Related

- [Trace Generation](./trace-generation.md)
- [Functional Requirements — Visualizer](../05-functional-requirements/visualizer.md)
