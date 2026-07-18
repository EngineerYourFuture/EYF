#!/usr/bin/env bash
# Post-deploy health gate. Polls an endpoint until it reports ready, or fails
# the pipeline so a broken release cannot take traffic.
#
#   scripts/health-gate.sh <url> [attempts] [delay_seconds]
#
# Exit 0 only when <url> returns HTTP 200. Point it at the API's /readyz, which
# checks Postgres + Redis (not /livez, which only proves the process is up).
set -euo pipefail

URL="${1:?usage: health-gate.sh <url> [attempts] [delay_seconds]}"
ATTEMPTS="${2:-30}"
DELAY="${3:-10}"

echo "Health gate → ${URL} (up to ${ATTEMPTS} attempts, ${DELAY}s apart)"

for i in $(seq 1 "${ATTEMPTS}"); do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "${URL}" 2>/dev/null || true)"
  code="${code:-000}"
  if [ "${code}" = "200" ]; then
    echo "✓ healthy (HTTP 200) on attempt ${i}"
    exit 0
  fi
  echo "  attempt ${i}/${ATTEMPTS}: HTTP ${code} — retrying in ${DELAY}s"
  sleep "${DELAY}"
done

echo "✖ health gate FAILED: ${URL} never returned 200 after ${ATTEMPTS} attempts."
echo "  The new release is unhealthy. Roll back to the previous image/deploy."
exit 1
