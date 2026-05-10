# 9.10 · Authority Operations

**Priority:** `P0` (login/access) / `P1` (full operations)

---

## Overview

The Authority Zone provides a separate interface for staff and admin actors to manage operations, review applications, and manage platform content.

---

## Staff Requirements

| # | Requirement |
|---|-------------|
| 1 | `/authority/login` — separate entry point |
| 2 | Queue dashboard — list of pending applications |
| 3 | Application detail — view full application data |
| 4 | Action flow — approve / reject / flag application |
| 5 | Every action creates an immutable audit log entry |

---

## Admin Requirements

| # | Requirement |
|---|-------------|
| 1 | Problem CRUD — create, read, update, delete problems |
| 2 | Test case management per problem |
| 3 | Billing / subscription status views |
| 4 | User management (plan adjustments, suspensions) |
| 5 | Export reports |
| 6 | All actions audited |

---

## Audit Requirements

- Every authority action must produce an `admin_audit_logs` entry
- Audit log fields: actor, action, resource, timestamp
- Logs are **immutable** — no update or delete allowed

---

## Related APIs

- `POST /api/v1/authority/login`
- `GET /api/v1/authority/queue`
- `GET /api/v1/authority/applications/{id}`
- `POST /api/v1/authority/applications/{id}/actions`
- `GET /api/v1/admin/problems`
- `POST /api/v1/admin/problems`
- `PUT /api/v1/admin/problems/{id}`
- `DELETE /api/v1/admin/problems/{id}`

## Related Flows

- [Authority Staff Flow](../08-user-flows/README.md#177-authority-staff-flow)
- [Authority Admin Flow](../08-user-flows/README.md#178-authority-admin-flow)
- [S5 Authority Processing](../08-user-flows/README.md#s5-authority-processing)
