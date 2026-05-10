# 03 · Architecture & Zone Split

## Zone Overview

EYF has two distinct zones with separate access rules.

---

## 6.1 · Public Zone

| Property | Value |
|----------|-------|
| Routes | `/auth/*`, `/app/*` |
| Actor | `role=user` |
| Entitlement checks | ✅ Apply |

---

## 6.2 · Authority Zone

| Property | Value |
|----------|-------|
| Routes | `/authority/login`, `/authority/*` |
| Actors | `role=staff`, `role=admin` |
| Entitlement checks | ❌ No user plan logic |
| RBAC | ✅ Full RBAC applies |

---

## 6.3 · Global Access Rule

Every protected request must satisfy **all** of the following guards in order:

```
Allow = ZoneGuard
      + JWTAuth
      + SessionGuard
      + RBAC
      + OwnershipCheck
      + EntitlementCheck  ← (role=user only)
```

> **Note:** EntitlementCheck (plan-based access) only applies to `role=user` requests. Authority actors (staff/admin) are not subject to plan entitlement logic.

---

## See Also
- [Roles, Plans & Entitlements](./roles-plans-entitlements.md)
- [Security Policies](../04-security/README.md)
