# EYF — Engineer Your Future · Project Docs

> **MVP v2.2** · Status: `Ready for Implementation` · 17 Apr 2026

EYF is a guided engineer growth platform that unifies coding practice, concept revision, execution understanding, placement preparation, and resume readiness in one connected workflow.

---

## 📂 Folder Index

| # | Folder | Description |
|---|--------|-------------|
| 01 | [`01-overview/`](./01-overview/) | Product summary, goals & success metrics |
| 02 | [`02-scope/`](./02-scope/) | In-scope / out-of-scope for MVP |
| 03 | [`03-architecture/`](./03-architecture/) | Zone split, roles, plan matrix, entitlements |
| 04 | [`04-security/`](./04-security/) | Non-negotiable security policies |
| 05 | [`05-functional-requirements/`](./05-functional-requirements/) | All 10 functional modules with priority |
| 06 | [`06-api/`](./06-api/) | REST API v1 surface (42+ endpoints) |
| 07 | [`07-data-model/`](./07-data-model/) | DB table definitions & transaction rules |
| 08 | [`08-user-flows/`](./08-user-flows/) | User flows, storyboards & journey narratives |
| 09 | [`09-delivery/`](./09-delivery/) | 15-day delivery plan, DoD & release gate |
| 10 | [`10-non-functional/`](./10-non-functional/) | Sandbox, anti-piracy, UX, compliance, observability |
| 11 | [`11-qa/`](./11-qa/) | QA strategy — unit, integration, E2E, security |
| 12 | [`12-module-home/`](./12-module-home/) | ⭐ Module-first structure, `/app/home`, landing page, new APIs & tables |
| 13 | [`13-recommendation-engine/`](./13-recommendation-engine/) | Deterministic scoring model, cold-start, output contract, pseudocode |
| 14 | [`14-tech-skills/`](./14-tech-skills/) | Tech Skills module — DDL, progression (L1–L5), XP formula, API |
| 15 | [`15-visualizer-spec/`](./15-visualizer-spec/) | Async trace generation, frame schema, playback contract, failure handling |
| 16 | [`16-billing-spec/`](./16-billing-spec/) | Provider interface, subscription states, webhook mapping, dunning |
| 17 | [`17-session-devices/`](./17-session-devices/) | Device fingerprinting, session visibility APIs, forced logout UX |
| 18 | [`18-entitlement-system/`](./18-entitlement-system/) | Middleware flow (exact 7 steps), cache strategy, race conditions |
| 19 | [`19-home-aggregation/`](./19-home-aggregation/) | Snapshot aggregation, full response contract, query optimization |
| 20 | [`20-analytics-events/`](./20-analytics-events/) | Event schema, ingestion pipeline, critical event catalog, real-time vs batch |
| 21 | [`21-concurrency/`](./21-concurrency/) | Row locking, idempotency table DDL, session/webhook/mentorship races |
| 22 | [`22-security-controls/`](./22-security-controls/) | Idempotency, CSRF, file uploads, SSRF, key management, 10-step lifecycle |

---

## ⚡ Core Loop

```
Pick Problem → Solve → Run → Submit → Visualize → Next Problem
```

The MVP connects this loop to measurable progression (XP/streaks), plan-based access, and secure monetization.

---

## 📋 Document Control

| Field | Value |
|-------|-------|
| Product | EYF — Engineer Your Future |
| Document Type | Product Requirements Document (MVP) |
| Version | v2.2 |
| Date | 17 Apr 2026 |
| Owner | Product + Engineering + Security |
| Status | Ready for Implementation |
| Platform | Web (Public + Authority apps) |

---

## 🔗 Quick Links

- [PRD (source)](../PRD.md)
- [Goals & Metrics](./01-overview/product-goals.md)
- [Plan Matrix](./03-architecture/roles-plans-entitlements.md)
- [15-Day Delivery Plan](./09-delivery/15-day-plan.md)
- [Release Gate](./09-delivery/release-gate.md)
- [API Surface](./06-api/api-surface.md)
- [Module Home](./12-module-home/README.md) · [Landing Page](./12-module-home/landing-page.md) · [Acceptance Criteria](./12-module-home/acceptance-criteria.md)
