#!/usr/bin/env bash
# Block until every service in the compose project reports `healthy`.
# Used by `make up` so callers don't have to guess when the stack is ready.
set -euo pipefail

TIMEOUT_SECS="${TIMEOUT_SECS:-180}"
INTERVAL_SECS=2
deadline=$(( $(date +%s) + TIMEOUT_SECS ))

services=$(docker compose config --services)

while :; do
  unhealthy=()
  for svc in $services; do
    cid=$(docker compose ps -q "$svc" 2>/dev/null || true)
    [ -z "$cid" ] && continue
    state=$(docker inspect -f '{{.State.Health.Status}}{{if not .State.Health}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo "unknown")
    case "$state" in
      healthy|running) ;;
      *)
        unhealthy+=("$svc=$state")
        ;;
    esac
  done

  if [ ${#unhealthy[@]} -eq 0 ]; then
    echo "✓ All services healthy"
    exit 0
  fi

  if [ "$(date +%s)" -ge "$deadline" ]; then
    echo "✗ Timeout waiting for services. Still not healthy: ${unhealthy[*]}" >&2
    docker compose ps >&2
    exit 1
  fi

  printf '\r  waiting on: %-60s' "${unhealthy[*]}"
  sleep "$INTERVAL_SECS"
done
