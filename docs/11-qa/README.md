# 11 · QA Strategy

**Section 24 of PRD.**

---

## Test Layers

### Unit Tests

| Area | Tests |
|------|-------|
| Entitlement resolver | Plan access logic |
| Risk scoring | Score calculation per signal |
| Quota calculators | Daily + monthly usage limits |
| Signed URL verification | HMAC + nonce + expiry validation |
| Token rotation / replay | JWT family revocation logic |

---

### Integration Tests

| Scenario | Description |
|----------|-------------|
| Single-session revocation | New login revokes prior session |
| Refresh replay full revoke | Replayed refresh token → full family revoked |
| Ownership / IDOR checks | Resource access denied for wrong owner |
| Mentorship quota enforcement | Booking fails after quota exceeded |
| Webhook dedupe | Duplicate event IDs processed as no-ops |
| Webhook signature validation | Invalid signature rejected |

---

### E2E Tests

| Scenario | Description |
|----------|-------------|
| Pro full loop | Solve → submit → visualizer all work for Pro user |
| Free/Basic visualizer locked | Visualize CTA shows lock modal |
| Pro second mentorship denied | Second booking in same month fails |
| Payment failure keeps entitlement | Failed payment does not downgrade plan |
| Authority queue action flow | Staff logs in → reviews → takes action → audit logged |

---

### Security Tests

| Test Type | Targets |
|-----------|---------|
| IDOR probes | Access resources owned by other users |
| XSS probes | Input fields, editor, resume content |
| Injection probes | SQL and command injection in all inputs |
| Rate-limit bypass | Test header manipulation, IP rotation |
| Sandbox escape | Network calls, host FS access, privilege escalation |

---

## Related

- [Definition of Done](../09-delivery/definition-of-done.md)
- [Release Gate](../09-delivery/release-gate.md)
