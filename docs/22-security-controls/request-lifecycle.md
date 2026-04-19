# 37.7 · Security Controls — Request Lifecycle Enforcement Order

Every inbound HTTP request must pass through the following **10 enforcement layers** in this exact order.

---

## Enforcement Order

| Step | Layer | Description |
|------|-------|-------------|
| 1 | **TLS Termination** | All traffic over TLS only — no plaintext HTTP |
| 2 | **WAF / Rate Limiting** | Web application firewall + per-IP + per-identifier rate limits |
| 3 | **AuthN** | JWT signature verification + expiry check |
| 4 | **Session Guard** | `session_id` in JWT matches `users.active_session_id` |
| 5 | **Risk Checks + 2FA Challenge** | Risk score evaluated → allow / challenge / block |
| 6 | **RBAC** | Role-based access control — correct role for zone and route |
| 7 | **Ownership** | Resource belongs to authenticated user (IDOR prevention) |
| 8 | **Entitlement** | Plan feature flag + quota validation |
| 9 | **Business Logic** | Core application logic executes |
| 10 | **Audit / Event Write** | Immutable audit log entry + analytics event emitted |

---

## Rules

- Each layer must be validated **before** the next.
- Any layer failure **short-circuits** — subsequent layers are not evaluated.
- Layers 9 and 10 only execute if all gates 1–8 pass.
- **Layer 5 (Risk + 2FA)** is skipped for authority actors; RBAC (layer 6) still applies.
- **Layer 8 (Entitlement)** is skipped for `role=staff` and `role=admin`.

---

## Error Codes by Layer

| Layer | Error Code |
|-------|-----------|
| 3 (AuthN) | `401 UNAUTHORIZED` |
| 4 (Session Guard) | `401 SESSION_REVOKED` |
| 5 (Risk) | `403 TWO_FA_REQUIRED` / `403 RISK_CHALLENGE_REQUIRED` |
| 6 (RBAC) | `403 FORBIDDEN` |
| 7 (Ownership) | `403 FORBIDDEN_RESOURCE_ACCESS` |
| 8 (Entitlement) | `403 FEATURE_LOCKED` / `403 QUOTA_EXCEEDED` |

---

## Related

- [Security Policies](../04-security/README.md)
- [Entitlement Middleware Flow](../18-entitlement-system/middleware-flow.md)
- [Risk & 2FA](../05-functional-requirements/risk-2fa.md)
