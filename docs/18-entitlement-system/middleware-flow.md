# 33.1 & 33.4 · Entitlement — Middleware Flow & Enforcement Points

---

## 33.1 · Middleware Logic Flow (Exact)

Every protected request must pass through these 7 steps **in order**:

| Step | Check | On Failure |
|------|-------|------------|
| 1 | Resolve `user_id`, `role`, `plan` from authenticated token | `401 UNAUTHORIZED` |
| 2 | If `role != user` → **skip plan checks** | RBAC still applies to authority actors |
| 3 | Resolve required **feature key** from the route map | `403 FORBIDDEN` |
| 4 | Load **entitlement snapshot** (cache-first) | 500 if cache fails — use DB fallback |
| 5 | Validate **boolean feature flag** (is feature enabled for this plan?) | `403 FEATURE_LOCKED` |
| 6 | Validate **numeric quotas** (daily/monthly) via transaction when action consumes quota | `403 QUOTA_EXCEEDED` |
| 7 | **Return 403** with appropriate code on deny | — |

---

## 33.4 · Enforcement Points

Entitlement checks apply **before** business logic and **before** expensive compute on these endpoints:

| Endpoint / Feature | Check Type |
|-------------------|-----------|
| `POST /problems/{id}/submit` | Daily submission quota |
| `GET /visualizer/*` | Boolean feature flag (Pro/Elite only) |
| `POST /placement/mock-attempts` | Boolean feature flag (Pro/Elite only) |
| `POST /mentorship/bookings` | Monthly mentorship quota |
| `POST /resume/export-pdf` | Boolean feature flag |
| Advanced analytics | Boolean feature flag |
| Question bank full access | Boolean feature flag |

> **Rule:** Entitlement is enforced **server-side only**. Frontend state is cosmetic only.

---

## Related

- [Cache Strategy](./cache-strategy.md)
- [Race Conditions](./race-conditions.md)
