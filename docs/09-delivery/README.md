# 09 · Delivery Plan

## Files

| File | Description |
|------|-------------|
| [15-day-plan.md](./15-day-plan.md) | Day-by-day delivery breakdown |
| [definition-of-done.md](./definition-of-done.md) | DoD checklist per feature |
| [release-gate.md](./release-gate.md) | Release gate — all must pass before launch |

---

## Environment Strategy

| Environment | Purpose |
|-------------|---------|
| `dev` | Active development |
| `staging` | Mirrors prod billing / webhook / email behavior |
| `prod` | Live production |

- Release sequence includes DB migration safety and rollback plan
- Feature flags used for risky rollouts: billing, security, visualizer
