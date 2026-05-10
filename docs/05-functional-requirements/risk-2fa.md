# 9.2 · Risk & 2FA

**Priority:** `P0` (2FA flows) / `P1` (risk engine)

---

## TOTP / 2FA Flows

| Flow | Description |
|------|-------------|
| Setup | User initiates TOTP setup; QR code issued |
| Verify | TOTP code verified to activate 2FA |
| Disable | 2FA disabled after re-authentication |
| Backup Codes | Generated at setup; one-time use each |

---

## Risk Scoring

Risk score is computed per login event using signals:
- Device fingerprint
- IP address
- ASN
- Geo-location anomaly

### Score Thresholds

| Risk Score | Action |
|------------|--------|
| < 60 | ✅ Allow — proceed normally |
| 60 – 84 | 🔶 Require 2FA challenge |
| ≥ 85 | 🚫 Temporary block / step-up challenge |

---

## Login Activity

- Users can view recent login activity (device, IP, timestamp, geo)
- Suspicious events are flagged

---

## Related APIs

- `POST /api/v1/security/2fa/setup`
- `POST /api/v1/security/2fa/verify`
- `POST /api/v1/security/2fa/disable`
- `GET /api/v1/security/sessions`
- `POST /api/v1/security/sessions/{id}/revoke`
- `GET /api/v1/security/logins`
