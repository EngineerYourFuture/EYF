# 32.1–32.2 · Session Devices — Schema & Fingerprinting

---

## 32.1 · Device Schema

```sql
CREATE TABLE user_devices (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_hash    TEXT        NOT NULL,
  device_label   TEXT,                          -- e.g. "Chrome on Mac"
  first_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  trusted        BOOLEAN     NOT NULL DEFAULT FALSE,
  revoked_at     TIMESTAMPTZ,
  UNIQUE(user_id, device_hash)
);
```

---

## 32.2 · Fingerprinting Strategy

### Input Signals

The fingerprint is a **deterministic hash** of the following browser/device signals:

| Signal | Notes |
|--------|-------|
| User-agent family + version | Normalized — strip minor patch version |
| Platform | `macOS`, `Windows`, `Linux`, `Android`, `iOS` |
| Timezone | e.g., `Asia/Kolkata` |
| Language | e.g., `en-IN` |
| Hardware concurrency bucket | Bucketed into ranges (e.g., 1–2, 4, 8, 16+) to reduce entropy |

### Hashing

```
device_hash = HMAC-SHA256(
  normalized_signals_json,
  SERVER_DEVICE_SECRET
)
```

> **Only the hash is stored** — never the raw fingerprint signals.

### Rules

- Never use device fingerprint as the **sole auth factor** — it's a risk signal, not a credential.
- Fingerprint is used to populate `device_label` for the session visibility UI.
- Device hash updates on fingerprint drift (e.g., browser update) create a new `user_devices` row.
