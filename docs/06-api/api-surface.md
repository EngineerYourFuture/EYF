# 06 · API Surface v1

All endpoints are prefixed with `/api/v1`.

---

## 10.1 · Auth / Security

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login — returns access + refresh tokens |
| `POST` | `/auth/refresh` | Rotate refresh token |
| `POST` | `/auth/logout` | Revoke session |
| `POST` | `/security/2fa/setup` | Initiate TOTP setup |
| `POST` | `/security/2fa/verify` | Verify and activate TOTP |
| `POST` | `/security/2fa/disable` | Disable 2FA |
| `GET` | `/security/sessions` | List active sessions |
| `POST` | `/security/sessions/{id}/revoke` | Revoke a specific session |
| `GET` | `/security/logins` | Recent login activity |

---

## 10.2 · Public Core

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard` | Dashboard data + recommendation |
| `GET` | `/problems` | Problem list (filterable, paginated) |
| `GET` | `/problems/{id}` | Problem detail |
| `POST` | `/problems/{id}/run` | Run code against sample/custom input |
| `POST` | `/problems/{id}/submit` | Submit code against hidden tests |
| `GET` | `/recommendations/next` | Next recommended problem |
| `POST` | `/visualizer/{submission_id}/trace` | Generate visualizer trace |
| `GET` | `/visualizer/{submission_id}` | Fetch visualizer frames |
| `GET` | `/core-subjects` | List all subjects and topics |
| `GET` | `/core-subjects/{subject}/{topic}` | Get topic notes |
| `POST` | `/placement/attempts` | Create placement attempt |
| `GET` | `/placement/attempts` | List placement attempts |
| `POST` | `/placement/mock-attempts` | Create mock interview attempt |
| `POST` | `/mentorship/bookings` | Book mentorship session |
| `GET` | `/mentorship/bookings` | List mentorship bookings |
| `POST` | `/resume/save` | Save resume data |
| `GET` | `/resume` | Get saved resume |
| `POST` | `/resume/export-pdf` | Export resume as PDF |

---

## 10.3 · Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/plans` | List available plans |
| `POST` | `/billing/checkout` | Create provider-hosted checkout session |
| `POST` | `/billing/webhook` | Receive billing provider webhook |
| `POST` | `/billing/change-plan` | Upgrade or downgrade plan |

---

## 10.4 · Support / Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analytics/events` | Track analytics event |
| `POST` | `/support/tickets` | Submit support ticket |

---

## 10.5 · Authority / Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/authority/login` | Authority zone login |
| `GET` | `/authority/queue` | Staff application queue |
| `GET` | `/authority/applications/{id}` | Application detail |
| `POST` | `/authority/applications/{id}/actions` | Take action on application |
| `GET` | `/admin/problems` | List all problems (admin) |
| `POST` | `/admin/problems` | Create problem |
| `PUT` | `/admin/problems/{id}` | Update problem |
| `DELETE` | `/admin/problems/{id}` | Delete problem |

---

## 10.6 · Module Home (Section 27 Additions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/home/summary` | XP, streak, usage counters, plan, module progress summary |
| `GET` | `/home/recommendation` | Next best module/action recommendation (module-aware) |
| `GET` | `/home/recent-activity` | Timeline of actions across all modules |
| `GET` | `/modules/status` | Per-module lock/unlock state, progress %, and CTA state |

> **See also:** [Module Home API Additions](../12-module-home/api-additions.md) for full response schema.

---

## 10.7 · Tech Skills (Section 29 Additions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tech-skills/catalog` | List all skills by category |
| `GET` | `/tech-skills/{skill_key}` | Skill detail with tasks and user progress |
| `GET` | `/tech-skills/progress` | User's full progress across all skills |
| `POST` | `/tech-skills/tasks/{task_key}/start` | Mark task started |
| `POST` | `/tech-skills/tasks/{task_key}/submit` | Submit task with evidence |
| `GET` | `/tech-skills/tasks/{task_key}/status` | Get current task attempt status |

> **See also:** [Tech Skills API](../14-tech-skills/api.md) for full request/response contracts.

---

## 10.8 · Visualizer Additions (Section 30)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/visualizer/{submission_id}/trace/retry` | Retry trace generation (max 2 retries) |

> **See also:** [Visualizer Failure Handling](../15-visualizer-spec/failure-handling.md).
