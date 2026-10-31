#!/usr/bin/env bash
#
# EYF Postgres backup → compressed custom-format dump, optionally shipped off-site.
# See docs/DEVOPS.md#backups. Two EYF-specific gotchas are handled here:
#
#   1. RLS: HARD-1 puts `FORCE ROW LEVEL SECURITY` on org-scoped tables, which blocks
#      pg_dump for the app's OWN (RLS-enforced) role. The backup MUST run as a role with
#      BYPASSRLS. Create a dedicated one (do NOT reuse the app role):
#        CREATE ROLE eyf_backup LOGIN BYPASSRLS PASSWORD '…';
#        GRANT pg_read_all_data TO eyf_backup;   -- read-only, RLS-exempt
#      Point BACKUP_DATABASE_URL at it.
#   2. Prisma appends `?schema=public`, which pg_dump rejects — we strip the query string.
#
# Env:
#   BACKUP_DATABASE_URL   (required)  BYPASSRLS/superuser connection string
#   BACKUP_DIR            (opt)       local output dir            [default: /tmp]
#   BACKUP_S3_URI         (opt)       off-site target, e.g. s3://eyf-backups or an R2 bucket
#   BACKUP_S3_ENDPOINT    (opt)       S3-compatible endpoint (set for Cloudflare R2)
#   BACKUP_RETENTION_DAYS (opt)       prune local dumps older than N days   [default: 7]
#   BACKUP_MEDIA_DIR      (opt)       mounted PRIVATE_MEDIA_DIR to archive alongside DB
set -euo pipefail
umask 077

: "${BACKUP_DATABASE_URL:?set BACKUP_DATABASE_URL to a BYPASSRLS/superuser connection string}"
CLEAN_URL="${BACKUP_DATABASE_URL%%\?*}"          # drop Prisma's ?schema=public
DIR="${BACKUP_DIR:-/tmp}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${DIR}/eyf-${TS}.dump"
MEDIA_OUT="${DIR}/eyf-${TS}.media.tar.gz"
mkdir -p "$DIR"
if [ -n "${BACKUP_MEDIA_DIR:-}" ] && [ ! -d "$BACKUP_MEDIA_DIR" ]; then
  echo "[backup] private media directory is missing; refusing an incomplete backup." >&2
  exit 1
fi

echo "[backup] pg_dump → ${OUT}"
pg_dump "$CLEAN_URL" -Fc --no-owner --no-privileges -f "$OUT"
echo "[backup] size: $(du -h "$OUT" | cut -f1)"

# Verify the dump is readable before we trust it (an unverified backup is not a backup).
pg_restore -l "$OUT" >/dev/null
echo "[backup] verified: $(pg_restore -l "$OUT" | grep -c 'TABLE DATA') tables captured"

if [ -n "${BACKUP_MEDIA_DIR:-}" ]; then
  tar -czf "$MEDIA_OUT" -C "$BACKUP_MEDIA_DIR" .
  tar -tzf "$MEDIA_OUT" >/dev/null
  echo "[backup] private media archived and verified."
else
  echo "[backup] media omitted: set BACKUP_MEDIA_DIR when private uploads are enabled."
fi

if [ -n "${BACKUP_S3_URI:-}" ]; then
  aws s3 cp "$OUT" "${BACKUP_S3_URI%/}/eyf-${TS}.dump" \
    ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"}
  echo "[backup] uploaded → ${BACKUP_S3_URI%/}/eyf-${TS}.dump"
  if [ -f "$MEDIA_OUT" ]; then
    aws s3 cp "$MEDIA_OUT" "${BACKUP_S3_URI%/}/eyf-${TS}.media.tar.gz" \
      ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"}
  fi
fi

find "$DIR" -name 'eyf-*.dump' -mtime "+${BACKUP_RETENTION_DAYS:-7}" -delete 2>/dev/null || true
find "$DIR" -name 'eyf-*.media.tar.gz' -mtime "+${BACKUP_RETENTION_DAYS:-7}" -delete 2>/dev/null || true
echo "[backup] done."
