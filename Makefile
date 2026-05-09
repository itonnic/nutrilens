# NutriLens — common operations.
#
# Usage:
#   make up        # production stack: postgres + redis + api + web
#   make dev       # full stack with hot reload
#   make local     # only postgres + redis (you run api/web on host)
#   make down      # stop containers, keep volumes
#   make wipe      # stop + delete volumes (destructive)
#   make logs s=api
#   make migrate   # apply Prisma migrations against running postgres
#   make seed      # insert demo user
#   make smoke     # quick health + login probe
#   make ps        # service status
#
# All targets require Docker. `make local` additionally needs Node 20 + pnpm
# on the host.

SHELL := /bin/bash

.PHONY: help up dev local down wipe logs migrate seed smoke ps build install \
        web-only api-only

help:
	@grep -E '^[a-zA-Z_-]+:.*?#' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS=":.*?#"}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## Start full prod-style stack (postgres + redis + api + web)
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@./scripts/wait-healthy.sh
	@$(MAKE) -s smoke

dev: ## Start full stack with hot reload (slower first build)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

local: ## Only postgres + redis; run api/web on host (fastest dev loop)
	docker compose up -d postgres redis
	@echo "Postgres + Redis ready. Now in another shell run:"
	@echo "    pnpm dev"

down: ## Stop containers (volumes survive)
	docker compose down

wipe: ## Stop + delete volumes (DB + uploads gone)
	docker compose down -v

logs: ## Tail logs for one service: make logs s=api
	docker compose logs -f $(s)

ps: ## Container status
	docker compose ps

build: ## Rebuild api + web images
	docker compose build api web

install: ## Install host deps for `make local`
	pnpm install
	pnpm --filter @nutrilens/shared build
	pnpm --filter @nutrilens/api db:generate

migrate: ## Apply migrations
	docker compose exec api sh -c "cd /app/api && pnpm db:migrate:deploy"

seed: ## Insert demo user (idempotent)
	docker compose exec api sh -c "cd /app/api && pnpm db:seed"

smoke: ## Hit health probes + demo login
	@./scripts/smoke.sh

web-only: ## Just the web image (assumes API runs elsewhere)
	docker compose up -d web

api-only: ## Just the api + db + redis (no web)
	docker compose up -d postgres redis api
