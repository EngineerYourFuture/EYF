# 37.1–37.2 · Security Controls — Request Idempotency & CSRF Policy

---

## 37.1 · Request Idempotency for Critical Writes

### Requirement

`X-Idempotency-Key` header is **required** on the following endpoints:

| Endpoint | Reason |
|----------|--------|
| `POST /api/v1/billing/checkout` | Prevent duplicate checkout sessions |
| `POST /api/v1/billing/change-plan` | Prevent duplicate plan changes |
| `POST /api/v1/mentorship/bookings` | Prevent double-booking |
| `POST /api/v1/problems/{id}/submit` | Prevent double submission and quota double-charge |

### Missing Key Response

```json
HTTP 400
{
  "error": {
    "code": "IDEMPOTENCY_KEY_REQUIRED",
    "message": "X-Idempotency-Key header is required for this endpoint."
  }
}
```

---

## 37.2 · CSRF Policy

### Cookie-Based Auth

If auth tokens are stored in cookies:
- Enforce **CSRF token validation** on all state-changing routes (`POST`, `PUT`, `PATCH`, `DELETE`)
- CSRF token must be present in a non-cookie header (e.g., `X-CSRF-Token`)
- Token verified server-side against session

### Bearer Token Auth (Recommended)

If auth tokens are passed as `Authorization: Bearer <token>`:
- **Block cross-origin credentials** — `credentials: include` not allowed from foreign origins
- Maintain a **strict CORS allowlist** of permitted origins
- Simple CORS policy: only allow `GET` from external origins; all state-changing requests require explicit origin allowlisting

> **Recommendation:** Use Bearer tokens to avoid CSRF complexity entirely.
