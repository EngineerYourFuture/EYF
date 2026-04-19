# 27.12 · Acceptance Criteria

All criteria must pass before the module home feature can ship.

---

## Criteria

| # | Criterion | Test Type |
|---|-----------|-----------|
| 1 | Every successful user login lands on `/app/home` | E2E |
| 2 | `/app/home` shows all 5 module cards with progress and CTA | E2E |
| 3 | Module lock states accurately reflect backend entitlements | Integration |
| 4 | Recommendation card displays one concrete next action | Integration |
| 5 | Users can start or continue any unlocked module in **one click** | E2E |
| 6 | Locked module actions always return a clear upgrade path — no dead ends | E2E |
| 7 | Home data loads within performance budget (P95 < 400ms) | Performance |
| 8 | Home layout is responsive for desktop and mobile (< 1024px) | Visual / UX |

---

## Performance Budget

| Data call | Target P95 |
|-----------|-----------|
| `GET /api/v1/home/summary` | < 400 ms |
| `GET /api/v1/home/recommendation` | < 400 ms |
| `GET /api/v1/home/recent-activity` | < 400 ms |
| `GET /api/v1/modules/status` | < 400 ms |
| Full page paint (all data loaded) | < 2.0 s |

---

## Related Sign-Off

- [ ] Engineering — all 8 criteria pass in staging
- [ ] Product — UX states reviewed and approved
- [ ] Security — entitlement enforcement verified server-side
