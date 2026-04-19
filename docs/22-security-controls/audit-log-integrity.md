# 37.6 · Security Controls — Audit Log Integrity

---

## Requirements

| Requirement | Implementation |
|-------------|---------------|
| **Append-only** | `admin_audit_logs` table must never allow UPDATE or DELETE |
| **Hash chain** | Each entry includes a `prev_hash` and `entry_hash` field |
| **DB role restriction** | The application DB role has INSERT only — no UPDATE/DELETE on audit log table |
| **Immutability enforcement** | Separate restricted DB role for audit log writes |

---

## Hash Chain Schema Addition

```sql
ALTER TABLE admin_audit_logs
ADD COLUMN prev_hash TEXT,
ADD COLUMN entry_hash TEXT GENERATED ALWAYS AS (
  encode(
    sha256((prev_hash || id::text || actor_id::text || action || created_at::text)::bytea),
    'hex'
  )
) STORED;
```

### How It Works

```
entry[0]: prev_hash = NULL, entry_hash = SHA256(NULL + entry[0] data)
entry[1]: prev_hash = entry[0].entry_hash, entry_hash = SHA256(entry[0].entry_hash + entry[1] data)
entry[N]: prev_hash = entry[N-1].entry_hash, entry_hash = SHA256(prev || entry[N] data)
```

- Any tampering with a past entry invalidates all subsequent hashes.
- Auditors can verify integrity by recomputing the hash chain.

---

## DB Role Permissions

```sql
-- Audit log writer role (application uses this)
GRANT INSERT ON admin_audit_logs TO app_role;

-- Explicitly deny modification
REVOKE UPDATE, DELETE ON admin_audit_logs FROM app_role;
REVOKE UPDATE, DELETE ON admin_audit_logs FROM PUBLIC;
```

---

## Related

- [Security Policies](../04-security/README.md)
- [Authority Operations](../05-functional-requirements/authority-operations.md)
