# Environment & Deployment

**Section 20 of PRD.**

---

## Environments

| Environment | Purpose |
|-------------|---------|
| `dev` | Local development and feature work |
| `staging` | Pre-production — mirrors billing, webhook, and email behavior |
| `prod` | Live production |

---

## Deployment Rules

1. `staging` must mirror prod billing/webhook/email behavior before any billing changes
2. DB migration must include:
   - Forward migration script
   - Rollback script
   - Tested against staging before prod
3. Feature flags required for high-risk rollouts:
   - Billing changes
   - Security changes (session, 2FA)
   - Visualizer rollout

---

## Release Sequence

```
1. Run DB migration on staging
2. Deploy to staging
3. Run regression + smoke tests on staging
4. Review release gate checklist
5. Run DB migration on prod (with rollback ready)
6. Deploy to prod
7. Monitor for 30 mins post-deploy
```

---

## Related

- [Release Gate](../09-delivery/release-gate.md)
- [15-Day Plan](../09-delivery/15-day-plan.md)
