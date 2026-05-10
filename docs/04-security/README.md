# 04 · Security Policies

> ⚠️ **Non-Negotiable.** All items below must be implemented before launch. No exceptions.

---

## Policy Checklist

| # | Policy | Detail |
|---|--------|--------|
| 1 | **Single Active Session** | All plans — single session only. New login revokes the previous active session immediately. |
| 2 | **JWT Session Binding** | JWT must carry `session_id`. Mismatch → `401 SESSION_REVOKED`. |
| 3 | **Refresh Token Rotation** | Token family refresh with replay detection. Replay → full family revoke + session revoke. |
| 4 | **2FA (TOTP + Backup Codes)** | Mandatory on risky/sensitive actions. TOTP + one-time backup codes. |
| 5 | **Risk-Aware Auth** | Risk scoring using device/IP/ASN/geo anomalies. Thresholds: <60 allow, 60–84 require 2FA, ≥85 block/challenge. |
| 6 | **Backend-Only Premium Enforcement** | Premium access must never rely on frontend checks alone. |
| 7 | **Ownership Checks** | All user-owned resources must verify ownership before read/write. Prevents IDOR. |
| 8 | **Webhook Security** | Signature verification + idempotency key required on all billing webhooks. |
| 9 | **Execution Sandbox Hardening** | See [Execution Sandbox](../10-non-functional/execution-sandbox.md). |
| 10 | **Premium Content Protection** | Dynamic forensic watermark + short-lived signed URLs (HMAC + nonce + expiry). |
| 11 | **Immutable Audit Logs** | Security and authority action logs must be immutable. |

---

## Error Codes

| Code | When Returned |
|------|--------------|
| `UNAUTHORIZED` | No valid JWT |
| `SESSION_REVOKED` | JWT session_id mismatch |
| `TOKEN_REUSE_DETECTED` | Refresh token replay detected |
| `TWO_FA_REQUIRED` | Risk score 60–84 |
| `RISK_CHALLENGE_REQUIRED` | Risk score ≥85 |
| `FEATURE_LOCKED` | Feature not available on current plan |
| `QUOTA_EXCEEDED` | Daily submission limit reached |
| `MENTORSHIP_QUOTA_EXCEEDED` | Monthly mentorship quota reached |
| `FORBIDDEN_RESOURCE_ACCESS` | Ownership check failed (IDOR prevention) |
| `WEBHOOK_SIGNATURE_INVALID` | Billing webhook signature mismatch |

---

## Standard Error Envelope

```json
{
  "error": {
    "code": "FEATURE_LOCKED",
    "message": "Visualizer is available on Pro and Elite plans only."
  }
}
```

---

## Anti-Piracy & Anti-Sharing

- Dynamic forensic watermark on premium screens
- PDF and video watermark markers
- Short-lived signed URLs (HMAC + nonce + expiry)
- Anti-scraping rate limits and anomaly detection
- Policy enforcement: **warn → temporary lock → suspension**

> **Note:** Screenshots and screen recordings cannot be fully blocked at the OS level on web. The approach is deterrence + traceability.
