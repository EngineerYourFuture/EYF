# 9.7 · Placement, Mock Interviews & Mentorship

**Priority:** `P1`

---

## 9.7a · Placement Attempts

| # | Requirement |
|---|-------------|
| 1 | Users can create a placement attempt record |
| 2 | Users can list their placement attempts |

## Related APIs

- `POST /api/v1/placement/attempts`
- `GET /api/v1/placement/attempts`

---

## 9.7b · Mock Interviews

| # | Requirement |
|---|-------------|
| 1 | Mock interviews available to **Pro** and **Elite** plans only |
| 2 | Free / Basic users receive `FEATURE_LOCKED` error |

## Related APIs

- `POST /api/v1/placement/mock-attempts`

---

## 9.7c · Mentorship Bookings

### Monthly Quota

| Plan | Monthly Quota |
|------|--------------|
| Free | 0 |
| Basic | 0 |
| Pro | 1 session/month |
| Elite | 4 sessions/month |

### Requirements

| # | Requirement |
|---|-------------|
| 1 | User books mentorship session |
| 2 | Quota is checked via **transactional row lock** on `user_monthly_usage` |
| 3 | Exceeding quota returns `MENTORSHIP_QUOTA_EXCEEDED` |
| 4 | Quota resets monthly |

## Related APIs

- `POST /api/v1/mentorship/bookings`
- `GET /api/v1/mentorship/bookings`

## Related Flows

- [Mentorship Flow](../08-user-flows/README.md#175-mentorship-flow)
