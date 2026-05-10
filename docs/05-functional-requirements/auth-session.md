# 9.1 · Authentication & Session

**Priority:** `P0`

---

## Requirements

| # | Requirement |
|---|-------------|
| 1 | Register with unique email — `409 Conflict` on duplicate |
| 2 | Login returns `access_token` + `refresh_token` |
| 3 | Refresh rotates token; previous refresh token revoked immediately |
| 4 | Logout revokes the current session |
| 5 | All protected endpoints reject unauthenticated requests with `401 UNAUTHORIZED` |
| 6 | Login rate limiting by IP + identifier |
| 7 | Token replay detection revokes full token family + active session |

---

## Session Model

- One active session per user at all times (all plans)
- JWT must include `session_id`
- New login from any device/IP revokes the previous session
- Revoked session → `401 SESSION_REVOKED` on next request

---

## Related Flows

- [Onboarding Flow](../08-user-flows/README.md#171-onboarding-flow)
- [Session Security Flow](../08-user-flows/README.md#176-session-security-flow)

## Related APIs

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
