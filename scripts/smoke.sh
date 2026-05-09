#!/usr/bin/env bash
# Verifies the running stack: liveness + readiness + a real login round-trip.
# Exits non-zero if anything looks off, so it can be wired into CI / make up.
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@nutrilens.app}"
DEMO_PASS="${DEMO_PASS:-demo1234}"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }

step() { printf '\033[1m%s\033[0m\n' "$*"; }

step "API liveness"
curl -fsS "${API_URL}/health" >/dev/null && ok "${API_URL}/health → 200" \
  || fail "API liveness failed"

step "API readiness (DB + Redis)"
ready=$(curl -fsS "${API_URL}/health/ready")
echo "$ready" | grep -q '"db":"ok"'    && ok "DB    → ok" || fail "DB not ready: $ready"
echo "$ready" | grep -q '"redis":"ok"' && ok "Redis → ok" || fail "Redis not ready: $ready"

step "Web home"
curl -fsS "${WEB_URL}/" | grep -q "Track your meals from photos" \
  && ok "${WEB_URL}/ rendered hero copy" \
  || fail "Web did not render the landing page"

step "Demo user login"
login=$(curl -fsS -X POST "${API_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASS}\"}" || true)
token=$(printf '%s' "$login" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
if [ -z "$token" ]; then
  fail "Login failed. If this is the first boot, run: make seed"
fi
ok "Got JWT for ${DEMO_EMAIL} (${#token} chars)"

step "Authenticated dashboard"
curl -fsS "${API_URL}/api/dashboard/daily?date=$(date -u +%Y-%m-%dT00:00:00.000Z)" \
  -H "Authorization: Bearer ${token}" \
  | grep -q '"targets"' \
  && ok "/api/dashboard/daily authorized + returned targets" \
  || fail "Dashboard call did not return expected payload"

echo
echo "All smoke checks passed."
echo "Open the app: ${WEB_URL}"
