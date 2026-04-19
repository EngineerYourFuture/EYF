# 32.4–32.5 · Session Devices — Forced Logout UX & Suspicious Activity

---

## 32.4 · Forced Logout UX Messaging

### Trigger

A session is invalidated when a new login from any device/IP replaces the active session.

### HTTP Response

```
401 SESSION_REVOKED
```

### Frontend Modal

```
Title: Session ended
Body:  Your account was signed in on another device. Please log in again.
CTA:   Log In
```

### Rules

- **Refresh token cannot recover** a revoked session — full credential login required.
- Modal must be shown **immediately** on the next API call that receives `SESSION_REVOKED`.
- All pending client state should be cleared before redirecting to `/auth/login`.

---

## 32.5 · Suspicious Activity Handling

### Trigger

Risk score at login reaches or exceeds the **block threshold** (≥ 85).

### Response Flow

| Step | Action |
|------|--------|
| 1 | **Deny login** — return `RISK_CHALLENGE_REQUIRED` |
| 2 | Create a `login_events` entry with `outcome = blocked` |
| 3 | Send **account alert email** to user |
| 4 | Expose confirm workflow: `GET /api/v1/security/logins/{id}/confirm` |

### Confirm Workflow

- User receives email with a time-limited confirmation link.
- Clicking the link marks the login event as user-confirmed.
- Does **not** auto-approve login — user must re-authenticate after confirmation.

---

## Related

- [Risk & 2FA](../05-functional-requirements/risk-2fa.md)
- [Security Policies — Error Codes](../04-security/README.md#error-codes)
