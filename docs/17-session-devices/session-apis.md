# 32.3 · Session Devices — Visibility APIs

---

## `GET /api/v1/security/sessions`

Returns all active and recent sessions for the authenticated user.

### Response

```json
{
  "active_session_id": "uuid",
  "sessions": [
    {
      "id": "uuid",
      "device_label": "Chrome on Mac",
      "city": "Bengaluru",
      "last_seen_at": "2026-04-17T17:00:00Z",
      "is_current": true
    },
    {
      "id": "uuid",
      "device_label": "Firefox on Windows",
      "city": "Mumbai",
      "last_seen_at": "2026-04-16T09:30:00Z",
      "is_current": false
    }
  ]
}
```

---

## `POST /api/v1/security/sessions/{id}/revoke`

Revokes a specific session by ID.

- If `id` is the current session → equivalent to logout.
- If `id` is another session → remote revocation.
- Revoked session returns `401 SESSION_REVOKED` on next request.

---

## `GET /api/v1/security/logins`

Returns recent login events with risk signals.

```json
{
  "logins": [
    {
      "id": "uuid",
      "device_label": "Chrome on Mac",
      "ip": "masked",
      "city": "Bengaluru",
      "risk_score": 12,
      "outcome": "allowed",
      "created_at": "2026-04-17T16:00:00Z"
    }
  ]
}
```

---

## Related

- [Security Policies](../04-security/README.md)
- [Forced Logout UX](./forced-logout-ux.md)
