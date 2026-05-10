# 06 · API Surface

See [api-surface.md](./api-surface.md) for the full endpoint listing.

---

## Summary

| Domain | Endpoints |
|--------|-----------|
| Auth / Security | 10 |
| Public Core | 18 |
| Billing | 4 |
| Support / Analytics | 2 |
| Authority / Admin | 8+ |
| **Total** | **42+** |

---

## General Conventions

- All endpoints prefixed with `/api/v1/`
- Auth: Bearer token in `Authorization` header
- Error response always uses the [standard error envelope](../04-security/README.md#standard-error-envelope)
- Webhook endpoints must verify signature before processing
