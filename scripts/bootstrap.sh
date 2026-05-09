#!/usr/bin/env bash
# First-run bootstrap. Idempotent.
#
#   ./scripts/bootstrap.sh
#
# - Creates root .env from .env.example if missing
# - Brings up the full stack
# - Runs migrations + seeds the demo user
# - Smoke tests the result
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example — review it before going to production."
  fi
fi

echo "Building and starting stack…"
docker compose up -d --build

./scripts/wait-healthy.sh

echo "Applying migrations…"
docker compose exec -T api sh -c "cd /app/api && pnpm db:migrate:deploy" || true

echo "Seeding demo user…"
docker compose exec -T api sh -c "cd /app/api && pnpm db:seed" || true

./scripts/smoke.sh
