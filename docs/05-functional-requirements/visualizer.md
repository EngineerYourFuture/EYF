# 9.4 · Visualizer

**Priority:** `P1`

---

## Requirements

| # | Requirement |
|---|-------------|
| 1 | Playback controls: play, pause, step-next, speed control |
| 2 | MVP algorithms: **sorting** (bubble/merge/quick) + **binary search** |
| 3 | Access restricted to **Pro** and **Elite** plans only |
| 4 | Free / Basic users see locked state with upgrade prompt |

---

## Access Control

| Plan | Visualizer Access |
|------|-----------------|
| Free | ❌ Locked — shows upgrade prompt |
| Basic | ❌ Locked — shows upgrade prompt |
| Pro | ✅ Enabled |
| Elite | ✅ Enabled |

Locked state → error code: `FEATURE_LOCKED`

---

## Trace Flow

```
Successful Submit
  → POST /api/v1/visualizer/{submission_id}/trace   ← generates trace
  → GET  /api/v1/visualizer/{submission_id}         ← fetch frames
  → Playback UI renders step-by-step
```

---

## Related APIs

- `POST /api/v1/visualizer/{submission_id}/trace`
- `GET /api/v1/visualizer/{submission_id}`

## Related Storyboards

- [S1 Core Loop (Pro)](../08-user-flows/README.md#s1-core-loop-pro)
- [S2 Feature Lock (Free/Basic)](../08-user-flows/README.md#s2-feature-lock-freebasic)
