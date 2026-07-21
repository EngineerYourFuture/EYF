#!/usr/bin/env bash
#
# EYF Postgres restore. DESTRUCTIVE — drops and recreates objects in the TARGET database.
# See docs/DEVOPS.md#disaster-recovery. Restore into a FRESH/empty database, never blindly
# over a live one. The dump already contains the RLS policies + `FORCE ROW LEVEL SECURITY`,
# so they come back with the schema; verify afterward with the RLS check.
#
# Env:
#   RESTORE_DATABASE_URL  (required)  TARGET connection string (BYPASSRLS/superuser role)
# Usage:
#   RESTORE_DATABASE_URL=… scripts/db-restore.sh <dump-file>
set -euo pipefail

DUMP="${1:?usage: db-restore.sh <dump-file>}"
: "${RESTORE_DATABASE_URL:?set RESTORE_DATABASE_URL to the TARGET database}"
[ -f "$DUMP" ] || { echo "no such dump: $DUMP" >&2; exit 1; }
CLEAN_URL="${RESTORE_DATABASE_URL%%\?*}"
REDACTED="$(echo "$CLEAN_URL" | sed -E 's#//[^@]*@#//***@#')"

echo "⚠️  DESTRUCTIVE: restoring '${DUMP}' into ${REDACTED}"
read -r -p "Type RESTORE to proceed: " confirm
[ "$confirm" = "RESTORE" ] || { echo "aborted."; exit 1; }

pg_restore --clean --if-exists --no-owner --no-privileges -d "$CLEAN_URL" "$DUMP"
echo "[restore] done. Now verify RLS is intact:"
echo "    pnpm --filter @eyf/db db:rls:verify"
