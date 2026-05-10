# 07 · Data Model

## Required Tables (22)

### Auth & Session

| Table | Key Fields |
|-------|-----------|
| `users` | id, email, role, plan, active_session_id, created_at |
| `user_sessions` | id, user_id, session_id, device, ip, created_at, revoked_at |
| `refresh_tokens` | id, user_id, family_id, token_hash, used, revoked, created_at |
| `user_security_settings` | user_id, totp_enabled, totp_secret, backup_codes |
| `login_events` | id, user_id, ip, device, geo, risk_score, outcome, created_at |

---

### Entitlements & Usage

| Table | Key Fields |
|-------|-----------|
| `plan_entitlements` | plan, feature_key, enabled, limit_value |
| `daily_submission_usage` | user_id, date, count |
| `user_monthly_usage` | user_id, month, mentorship_used |

---

### DSA / Execution

| Table | Key Fields |
|-------|-----------|
| `problems` | id, title, difficulty, topics, plan_access, created_at |
| `problem_test_cases` | id, problem_id, input, expected_output, is_hidden |
| `submissions` | id, user_id, problem_id, language, status, runtime, memory, created_at |
| `execution_runs` | id, submission_id, input_type, stdout, stderr, runtime, exit_code |
| `visualizer_traces` | id, submission_id, algorithm, frames_json, created_at |

---

### Content & Learning

| Table | Key Fields |
|-------|-----------|
| `core_subject_notes` | id, subject, topic, plan_level, content_md, updated_at |

---

### Placement & Mentorship

| Table | Key Fields |
|-------|-----------|
| `placement_attempts` | id, user_id, company, role, outcome, date |
| `mentorship_bookings` | id, user_id, mentor_id, scheduled_at, status, month |

---

### Resume

| Table | Key Fields |
|-------|-----------|
| `resumes` | id, user_id, template, data_json, updated_at |

---

### Billing

| Table | Key Fields |
|-------|-----------|
| `subscriptions` | id, user_id, plan, status, period_start, period_end, provider_sub_id |
| `billing_events` | id, provider_event_id (UNIQUE), type, user_id, payload, processed_at |

---

### Operations / Support

| Table | Key Fields |
|-------|-----------|
| `analytics_events` | id, user_id, event_type, payload, created_at |
| `support_tickets` | id, user_id, subject, body, status, created_at |
| `admin_audit_logs` | id, actor_id, actor_role, action, resource_type, resource_id, created_at |

---

## Transaction & Concurrency Rules

| # | Rule |
|---|------|
| 1 | Daily quota check → transaction + row lock on `daily_submission_usage` |
| 2 | Mentorship booking → transaction + row lock on `user_monthly_usage` |
| 3 | Billing webhook → insert idempotency key first; duplicate → no-op |
| 4 | Subscription state change + user plan update → atomic single transaction |
| 5 | Ownership check must occur before any read/write of user-owned resource |

---

## Additional Tables (Section 27 — Module Home)

Four new tables added to support the module-first product structure.

| Table | Purpose |
|-------|---------|
| `module_progress` | Per-user progress per module (completion %, last activity, status) |
| `user_learning_goals` | User's target role, timeline, and priority modules |
| `tech_skill_progress` | Per-skill level and milestone tracking for Tech Skills module |
| `recent_activity` | Cross-module activity feed for `/app/home` |

> **See full schema:** [Data Model Additions](../12-module-home/data-model-additions.md)
