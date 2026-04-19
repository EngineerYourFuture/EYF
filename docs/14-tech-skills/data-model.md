# 29.1 · Tech Skills — Data Model

## Database Schema (DDL)

### `tech_skill_catalog`

Catalogue of all trackable skills.

```sql
CREATE TABLE tech_skill_catalog (
  id           UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_key    TEXT     UNIQUE NOT NULL,       -- e.g. "git", "docker", "django-rest"
  name         TEXT     NOT NULL,
  category     TEXT     NOT NULL,              -- backend|frontend|devops|data
  level_min    INT      NOT NULL DEFAULT 1,
  level_max    INT      NOT NULL DEFAULT 5,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### `tech_skill_tasks`

Tasks that belong to a skill at a specific level.

```sql
CREATE TABLE tech_skill_tasks (
  id                         UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id                   UUID     NOT NULL REFERENCES tech_skill_catalog(id) ON DELETE CASCADE,
  task_key                   TEXT     UNIQUE NOT NULL,
  task_type                  TEXT     NOT NULL CHECK (task_type IN ('project','quiz','reading','checkpoint')),
  title                      TEXT     NOT NULL,
  description_md             TEXT     NOT NULL,
  level                      INT      NOT NULL,                    -- 1..5
  estimated_effort_minutes   INT      NOT NULL,
  points                     INT      NOT NULL DEFAULT 10,
  dependencies               JSONB    NOT NULL DEFAULT '[]'::jsonb, -- array of task_keys
  is_active                  BOOLEAN  NOT NULL DEFAULT TRUE
);
```

---

### `user_tech_skill_progress`

Per-user, per-skill progress tracking.

```sql
CREATE TABLE user_tech_skill_progress (
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id         UUID NOT NULL REFERENCES tech_skill_catalog(id) ON DELETE CASCADE,
  current_level    INT  NOT NULL DEFAULT 1,
  xp_points        INT  NOT NULL DEFAULT 0,
  milestone_index  INT  NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, skill_id)
);
```

---

### `user_tech_skill_task_attempts`

Records each task attempt.

```sql
CREATE TABLE user_tech_skill_task_attempts (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id       UUID         NOT NULL REFERENCES tech_skill_tasks(id) ON DELETE CASCADE,
  status        TEXT         NOT NULL CHECK (status IN ('started','submitted','passed','failed')),
  score         NUMERIC(5,2),
  evidence_url  TEXT,
  metadata      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id, status, created_at)
);
```

---

## Related

- [Progression Model](./progression-model.md)
- [Recommendation Linkage](./recommendation-linkage.md)
