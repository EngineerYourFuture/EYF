# 33.2–33.3 · Entitlement — Cache Strategy & Mid-Request Downgrade

---

## 33.2 · Cache Strategy

| Property | Value |
|----------|-------|
| Cache key format | `entitlements:{plan}:v{version}` |
| TTL | 300 seconds (5 minutes) |
| Invalidation trigger | Plan table update or version bump |
| Quota counters (daily/monthly) | **No cache** for write decisions — always read from DB with lock |

### Cache Notes

- Entitlement snapshots are **plan-level**, not user-level — all users on the same plan share the same cached snapshot.
- Version number in the cache key ensures stale cache is never used after a plan table change.
- Cache miss → load from DB → repopulate cache → proceed.

---

## 33.3 · Downgrade Mid-Request Handling

### Problem

A user's plan may change **between** when their token was issued and when a request is processed.

### Solution

1. JWT token includes an `entitlement_version` claim.
2. Middleware compares token's `entitlement_version` against `users.entitlement_version` in DB.

### Mismatch Handling

| Request Type | Behaviour |
|-------------|-----------|
| **Non-mutating** (GET) | Proceed with **latest entitlements** from DB |
| **Mutating premium** (POST/PUT to premium endpoints) | Return `403 PLAN_CHANGED_REAUTH_REQUIRED` |

> `PLAN_CHANGED_REAUTH_REQUIRED` tells the client to re-authenticate so the new token carries the correct `entitlement_version`.

---

## New Error Code

| Code | When Returned |
|------|--------------|
| `PLAN_CHANGED_REAUTH_REQUIRED` | Mutating premium request where token `entitlement_version` ≠ DB `entitlement_version` |
