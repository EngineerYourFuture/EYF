# 30.3–30.4 · Visualizer — Playback Contract & Performance

---

## 30.3 · Playback Contract

### `GET /api/v1/visualizer/{submission_id}` Response

```json
{
  "submission_id": "uuid",
  "status": "ready|processing|failed",
  "trace_url": "signed-url-or-null",
  "frame_count": 42,
  "max_speed": 4,
  "default_speed": 1,
  "watermark": {
    "id": "wm_...",
    "token": "..."
  }
}
```

### Field Notes

| Field | Description |
|-------|-------------|
| `status` | `processing` → trace not ready yet, `ready` → trace_url is valid, `failed` → error |
| `trace_url` | Signed URL (HMAC + nonce + expiry) — **null** when status ≠ ready |
| `watermark` | Forensic watermark token embedded in playback for content tracing |
| `max_speed` | Maximum playback multiplier (4×) |
| `default_speed` | Default playback speed (1×) |

---

## 30.4 · Performance Constraints

| Constraint | Value |
|-----------|-------|
| Trace generation P95 | < 1200 ms (for MVP problem sizes) |
| Trace payload size limit | ≤ 1.5 MB |
| Maximum frame count | ≤ 1500 frames |
| Frame cap behavior | Truncate with `truncated: true` + summary note in response |

### Truncation Behavior

If either the size or frame limit is exceeded:

1. Frames are truncated at the cap.
2. `summary.truncated = true` is set in the JSON.
3. A summary note is appended explaining the truncation.
4. Playback continues normally from available frames.
