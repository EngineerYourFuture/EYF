# 26 · Release Gate

> 🚫 **Release is BLOCKED unless every item below is cleared.**

---

## Gate Checklist

| # | Gate Item | Status |
|---|-----------|--------|
| 1 | Core loop stable — no `P0` defects open | ⬜ |
| 2 | RBAC + entitlements enforced server-side — verified | ⬜ |
| 3 | Single-session enforcement + replay defense validated | ⬜ |
| 4 | Webhook signature verification + idempotency validated | ⬜ |
| 5 | Execution sandbox isolation validated | ⬜ |
| 6 | Authority workflows + immutable audit trails operational | ⬜ |
| 7 | DB rollback plan documented and tested | ⬜ |
| 8 | Alerting configured and verified (auth spikes, webhook failures, sandbox failures) | ⬜ |

---

## Sign-Off Required From

- [ ] Engineering Lead
- [ ] Security Reviewer
- [ ] Product Owner

---

## Related

- [Definition of Done](./definition-of-done.md)
- [QA Strategy](../11-qa/README.md)
- [15-Day Delivery Plan](./15-day-plan.md)
