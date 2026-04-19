# 25 · 15-Day Delivery Plan

Total: **15 engineering days** from repo setup to release gate.

---

## Phase 1 · Foundation (Days 1–5)

| Day | Focus | Tasks |
|-----|-------|-------|
| **Day 1** | Project Foundation | Repo setup, CI pipeline, `dev`/`staging`/`prod` environments, DB migration skeleton |
| **Day 2** | Auth & JWT | Register API, Login API, JWT issuance, IP + identifier rate limiting |
| **Day 3** | Session Security | Single-session enforcement, refresh token family rotation, replay detection |
| **Day 4** | Risk Engine & 2FA | Risk scoring (device/IP/ASN/geo), TOTP 2FA flows (setup/verify/disable), login event logging |
| **Day 5** | Entitlements & Middleware | Plan entitlement table, daily usage counters, middleware access framework |

---

## Phase 2 · Core DSA Loop (Days 6–8)

| Day | Focus | Tasks |
|-----|-------|-------|
| **Day 6** | Problem Schema & APIs | Problems schema, list API (filter/search/paginate), detail API |
| **Day 7** | Run Endpoint & Sandbox | Run endpoint, Docker sandbox adapter, sandbox hardening (network-off, FS limits, seccomp) |
| **Day 8** | Submit & Quota | Submit endpoint, hidden test evaluation, transactional daily quota enforcement |

---

## Phase 3 · Features (Days 9–12)

| Day | Focus | Tasks |
|-----|-------|-------|
| **Day 9** | Dashboard & Recommendations | Dashboard API, recommendation engine v1 (rule-based) |
| **Day 10** | Visualizer & Content Protection | Visualizer trace API, Pro/Elite gate, forensic watermark, signed URLs |
| **Day 11** | Placement, Mock & Mentorship | Placement attempt APIs, mock interview gate (Pro/Elite), mentorship quota logic |
| **Day 12** | Resume & PDF Export | Resume CRUD, PDF export with watermark, entitlement checks |

---

## Phase 4 · Billing & Operations (Days 13–14)

| Day | Focus | Tasks |
|-----|-------|-------|
| **Day 13** | Checkout & Billing Webhooks | Checkout session, webhook idempotency, atomic plan change |
| **Day 14** | Authority, Support & Analytics | Authority queue + action APIs, admin problem CRUD, support tickets, analytics events, audit hardening |

---

## Phase 5 · QA & Release (Day 15)

| Day | Focus | Tasks |
|-----|-------|-------|
| **Day 15** | Regression, Security & Release | Full regression suite, security probes (IDOR/XSS/injection), performance benchmarks, Release Gate validation |

---

## See Also

- [Definition of Done](./definition-of-done.md)
- [Release Gate](./release-gate.md)
