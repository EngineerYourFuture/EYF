# 30.1–30.2 · Visualizer — Trace Generation & Storage

---

## 30.1 · MVP Trace Generation Strategy

### Scope

- Traces only supported for the **curated problem set** where `visualizer_enabled = true` at the problem level.

### Generation Modes

| Mode | When Used |
|------|-----------|
| **Runtime instrumentation** | Primary — instruments code during accepted submission for supported languages |
| **Canonical precomputed trace** | Fallback — used if runtime instrumentation fails |

### Async Generation

- Traces generated **asynchronously** by a background worker.
- Submit API returns quickly with a `trace_job_id`.
- Client polls `GET /api/v1/visualizer/{submission_id}` for status.

---

## 30.2 · Trace Storage Format

Stored in the `visualizer_traces` table.

### JSON Schema

```json
{
  "trace_version": "1.0",
  "problem_id": "uuid",
  "submission_id": "uuid",
  "algorithm": "sorting|binary_search",
  "input_snapshot": { "arr": [5, 2, 1] },
  "frames": [
    {
      "i": 0,
      "timestamp_ms": 0,
      "state": { "arr": [5, 2, 1], "l": 0, "r": 2, "mid": 1 },
      "highlight": { "indices": [0, 1], "op": "compare" },
      "annotation": "compare arr[0] and arr[1]"
    }
  ],
  "summary": {
    "steps": 42,
    "time_ms": 12,
    "truncated": false
  }
}
```

### Frame Fields

| Field | Description |
|-------|-------------|
| `i` | Frame index (0-based) |
| `timestamp_ms` | Relative timestamp from start |
| `state` | Full algorithm state at this frame |
| `highlight.indices` | Which array indices to highlight |
| `highlight.op` | Operation type: `compare` / `swap` / `pivot` / `found` |
| `annotation` | Human-readable explanation of this step |
