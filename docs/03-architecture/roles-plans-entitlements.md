# Roles, Plans & Entitlements

## 7.1 · Roles

| Role | Actor | Description |
|------|-------|-------------|
| `user` | Learner / Customer | Accesses public zone; subject to plan entitlements |
| `staff` | Operations Reviewer | Accesses authority zone; reviews queued applications |
| `admin` | System Operator | Full authority zone access; manages content, billing, users |

---

## 7.2 · Plan Matrix (Final — Locked)

| Feature | Free | Basic | Pro | Elite |
|---------|------|-------|-----|-------|
| DSA Library | Starter | Expanded (limited) | Unlimited | Unlimited |
| Daily Submissions | 10/day | 50/day | Unlimited | Unlimited |
| Core Subjects | Intro | Basic | Full + Videos | Full + Videos |
| Visualizer | ❌ Locked | ❌ Locked | ✅ Enabled | ✅ Enabled |
| Mock Interviews | ❌ No | ❌ No | ✅ Enabled | ✅ Enabled |
| Mentorship Sessions | 0/mo | 0/mo | 1/mo | 4/mo |
| AI Code Review | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Resume PDF Export | ❌ No | Limited | ✅ Yes | ✅ Yes |
| Analytics Depth | Basic | Basic | Advanced | Advanced |
| Personalized Roadmap | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Company Prep Grids | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Referral Access | ❌ No | ❌ No | ❌ No | ✅ Yes |

---

## Entitlement Enforcement Rules

1. Premium access is **enforced on the backend only** — never rely on frontend gating alone.
2. Locked features return error code `FEATURE_LOCKED` with upgrade messaging.
3. Quota-exceeded features return `QUOTA_EXCEEDED` or `MENTORSHIP_QUOTA_EXCEEDED`.
4. Downgrade takes effect at period end; existing entitlement preserved until then.
