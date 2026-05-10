-- EYF full MVP v2.2 schema bootstrap
-- Covers 15-day delivery scope across auth, learning modules, billing, operations and concurrency.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free',
  active_session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL DEFAULT 'public',
  device TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  family_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  session_id UUID REFERENCES user_sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_security_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  totp_secret TEXT,
  backup_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  ip TEXT,
  device TEXT,
  geo TEXT,
  risk_score INT NOT NULL,
  outcome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_entitlements (
  plan TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  limit_value INT,
  PRIMARY KEY (plan, feature_key)
);

CREATE TABLE IF NOT EXISTS daily_submission_usage (
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS user_monthly_usage (
  user_id UUID NOT NULL REFERENCES users(id),
  month TEXT NOT NULL,
  mentorship_used INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  plan_access TEXT NOT NULL DEFAULT 'free',
  statement TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problem_test_cases (
  id UUID PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  problem_id UUID NOT NULL REFERENCES problems(id),
  language TEXT NOT NULL,
  source_code TEXT NOT NULL,
  status TEXT NOT NULL,
  runtime_ms INT,
  memory_kb INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS execution_runs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  problem_id UUID NOT NULL REFERENCES problems(id),
  stdout TEXT,
  stderr TEXT,
  runtime_ms INT,
  exit_code INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visualizer_traces (
  id UUID PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  frames_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core_subject_notes (
  id UUID PRIMARY KEY,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  plan_level TEXT NOT NULL DEFAULT 'free',
  content_md TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS placement_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'placement',
  outcome TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentorship_bookings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  mentor_id TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked',
  month TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  template TEXT NOT NULL,
  data_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  provider_sub_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY,
  provider_event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS module_progress (
  user_id UUID NOT NULL REFERENCES users(id),
  module_key TEXT NOT NULL,
  completion_pct INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started',
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, module_key)
);

CREATE TABLE IF NOT EXISTS user_learning_goals (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  target_role TEXT NOT NULL,
  timeline_weeks INT,
  priority_modules TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tech_skill_progress (
  user_id UUID NOT NULL REFERENCES users(id),
  skill_key TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_key)
);

CREATE TABLE IF NOT EXISTS recent_activity (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  module_key TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY,
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  response_code INT,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(namespace, key)
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_created_at ON submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_user_created_at ON login_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_activity_user_created_at ON recent_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_provider_event_id ON billing_events(provider_event_id);
