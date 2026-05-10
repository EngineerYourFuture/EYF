# 37.5 · Security Controls — Secret & Key Management

---

## Secret Management

| Rule | Detail |
|------|--------|
| **Managed vault only** | All secrets stored in a managed secret vault (e.g., AWS Secrets Manager, HashiCorp Vault) |
| **No secrets in code** | Zero tolerance for secrets in source code, environment files committed to git, or logs |
| **Rotation policy** | App secrets rotated every **90 days**; immediate rotation on suspected compromise |
| **Principle of least privilege** | Services can only access the secrets they need |

---

## JWT Signing Key Management

| Area | Policy |
|------|--------|
| **Key storage** | Signing keys stored in vault — never in application config |
| **Key versioning** | Each signing key has a version (`kid` claim in JWT header) |
| **Dual-key verification window** | During rotation, both old and new signing keys are valid for a **transition period** |
| **Rotation window** | Old key accepted for existing tokens until they expire (max 15 min for access tokens) |
| **Rotation trigger** | Manual schedule (90 days) or immediately on compromise |

### JWT Key Rotation Flow

```
1. Generate new signing key → store in vault with new kid
2. Update service config to sign new JWTs with new key
3. Continue verifying tokens signed with old key (transition window)
4. After all old tokens expire → remove old key from verifier
```

> Using `kid` in JWT header allows the verifier to look up the correct public key per token without guessing.

---

## Related

- [Audit Log Integrity](./audit-log-integrity.md)
- [Request Lifecycle](./request-lifecycle.md)
