# EYF — Production Operations Runbook

Owner: on-call engineer. This is the document you open at 3 AM. It covers
migrations, health, observability, backups/PITR, disaster recovery, and the
deploy/rollback procedure. Targets assume managed Postgres (Neon/RDS), managed
Redis (Upstash/ElastiCache), and Cloudflare in front of the origin.

---

## 1. Deploy & rollback

**Model:** rolling, health-gated. See `.github/workflows/cd.yml`.

1. **Migrate first (expand phase).** `pnpm --filter @eyf/db exec prisma migrate deploy`
   runs against `DIRECT_DATABASE_URL`. Migrations must be **backward-compatible**
   with the currently-running app (expand → deploy → contract): add columns/tables
   now, remove them only in a later release once no running code references them.
2. **Deploy api + workers** (judge, cron, webhook) on the new image. They must be
   compatible with both the old and new schema.
3. **Gate on readiness.** Do not shift traffic until `GET /readyz` returns `200`
   (checks Postgres + Redis). `GET /livez` is liveness only.
4. **Deploy web**, then flip traffic.
5. **Rollback:** redeploy the previous image tag (`ghcr.io/<repo>/<svc>:<prev-sha>`).
   Because migrations are expand-only, the old image runs against the new schema
   safely — **never** auto-run a down-migration on rollback. If a schema change
   must be reverted, ship a new forward migration.

## 2. Health, metrics, alerts

| Endpoint | Meaning | Orchestrator action on failure |
|----------|---------|--------------------------------|
| `GET /livez`  | process up | restart the pod |
| `GET /readyz` | Postgres + Redis reachable | pull from LB rotation (don't restart) |
| `GET /metrics`| Prometheus metrics (Bearer `METRICS_TOKEN`) | scrape target |

- **Errors → Sentry** (`SENTRY_DSN`). 5xx and unhandled rejections auto-report
  with the request correlation id (`x-request-id`, echoed on every response).
- **SLOs (define alerts):** API p99 latency < 1s; 5xx rate < 0.5%; judge queue
  depth < 500; webhook delivery success > 99%; `/readyz` uptime > 99.9%.

## 3. Backups & Point-in-Time Recovery (PITR)

> **An untested backup is not a backup.** A restore drill is mandatory quarterly.

- **Automated backups:** enable managed daily snapshots + continuous WAL
  archiving (Neon: history retention; RDS: automated backups + PITR window).
  **Target retention: 30 days.** RPO ≤ 5 min (WAL), RTO ≤ 1 hour.
- **On-demand logical backup** (before risky changes):
  ```bash
  pg_dump --format=custom --no-owner "$DIRECT_DATABASE_URL" > eyf-$(date +%F).dump
  ```
- **Restore drill (quarterly, into a scratch DB — never prod):**
  ```bash
  createdb eyf_restore_test
  pg_restore --no-owner --dbname eyf_restore_test eyf-YYYY-MM-DD.dump
  # sanity: row counts on users, subscriptions, problem_solutions; app boots against it
  ```
  Record the measured RTO in the drill log. If it exceeds target, fix before the
  next release.
- **PITR restore (incident):** provision a new instance restored to a timestamp
  just before the incident, repoint `DATABASE_URL`/`DIRECT_DATABASE_URL`, run
  `prisma migrate status` to confirm schema, then cut over.

## 4. Disaster recovery / business continuity

| Scenario | Response | RTO / RPO |
|----------|----------|-----------|
| App instance dies | Orchestrator restarts (liveness) / reschedules | seconds |
| Postgres primary lost | Failover to managed replica; if none, PITR restore | ≤ 1h / ≤ 5m |
| Redis lost | Queues/cache rebuild from Postgres; workers reconnect (AOF persistence on) | minutes |
| Region outage | Restore Postgres snapshot + redeploy images in secondary region | ≤ 4h |
| Bad deploy | Rollback to previous image tag (§1) | minutes |
| Secret leak | Rotate via Terraform (`random_password` → secret store), redeploy | ≤ 1h |

- **Data residency:** primary region is India (`ap-south-1`) per DPDP.
- **Game days:** run a failover + restore drill each quarter; log RTO/RPO actuals.

## 5. Redis

Single logical Redis serves queues + cache + peer signaling. For scale, split
into separate instances/DBs (BullMQ, cache, pub/sub) or move to a Redis Cluster.
Enable AOF persistence (`--appendonly yes`, already set in compose) so in-flight
jobs survive a restart.

## 6. Abuse / edge (Cloudflare)

WAF managed ruleset ON, Bot Fight Mode ON, edge rate limiting on `/v1/auth/*`
and `/v1/*` write paths, DDoS protection (automatic), and cache rules for static
assets. App-layer rate limiting (Redis-backed, per plan) is the second layer —
see `apps/api/src/app.ts`. Origin should only accept traffic from Cloudflare IPs.
