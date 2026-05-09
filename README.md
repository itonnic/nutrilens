# NutriLens

AI-powered nutrition tracking webapp. Upload a meal photo → AI estimates calories, macros, and nutrition values → confirm or edit → daily/weekly/monthly progress tracked.

> **MVP positioning:** photo-first visual food diary, not a manual macro tracker. Mobile-first webapp ready to evolve into a PWA / React Native app.

## Repository layout

```
diet-app/
├── api/                # NestJS backend (Prisma + BullMQ + OpenAI/mock analyzer)
├── web/                # Next.js 15 App Router frontend
├── packages/
│   └── shared/         # Shared TS types + Zod schemas + nutrition logic
├── docs/               # Product brief, architecture, edge cases, etc.
└── docker-compose.yml  # Postgres + Redis for local dev
```

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), React, TypeScript, Tailwind, Radix UI primitives, Framer Motion, Recharts, React Hook Form, Zod, TanStack Query |
| Backend | NestJS 10, Prisma 5, PostgreSQL 16, BullMQ + Redis 7, JWT auth |
| AI | OpenAI vision (Structured Outputs) + deterministic mock analyzer for local dev |
| Storage | Local filesystem (dev) / S3-compatible interface (R2-ready) |

See [docs/README.md](docs/README.md) for the full product brief.

## Quick start

There are three ways to run the stack. Pick one:

### A) One-command (recommended, no Node needed)

Requirements: Docker.

```bash
./scripts/bootstrap.sh
```

That builds the API + Web images, starts Postgres + Redis + API + Web, runs migrations, seeds the demo user, and smoke-tests the result. When it returns, open **http://localhost:3000**.

Equivalent shortcut: `make up`.

### B) Hot-reload dev mode (in containers)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
# or
make dev
```

Slower first build, but the API and Web auto-rebuild on file change.

### C) Local Node (fastest dev loop)

Requirements: Docker + Node 20 + pnpm 9.

```bash
make local        # runs only postgres + redis in docker
pnpm install
pnpm db:migrate   # creates tables
pnpm db:seed      # creates demo@nutrilens.app / demo1234
pnpm dev          # web on :3000, api on :4000
```

### Demo login

- email: `demo@nutrilens.app`
- password: `demo1234`

### Configuring AI provider (optional)

The API runs in **mock AI mode by default** — deterministic fixtures, no OpenAI key required. To use real OpenAI, edit `.env` (or set in your shell):

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

The same env file feeds the docker-compose stack and the host-side `pnpm dev` flow.

> **Note on Postgres port:** The container exposes Postgres on **5433** (not 5432) so it doesn't conflict with a local Postgres install.

## Make targets

| Target | What it does |
|--------|--------------|
| `make up` | Build + run full stack (postgres + redis + api + web), wait healthy, smoke test |
| `make dev` | Same stack, but with hot reload |
| `make local` | Just postgres + redis (run api/web yourself with `pnpm dev`) |
| `make down` | Stop containers, keep volumes |
| `make wipe` | Stop + delete volumes (destructive — DB and uploads gone) |
| `make logs s=api` | Tail one service |
| `make migrate` | Apply Prisma migrations against running stack |
| `make seed` | Insert demo user (idempotent) |
| `make smoke` | Health probes + login round-trip |
| `make ps` | Container status |
| `make build` | Rebuild api + web images |

## Useful commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run web + api in parallel |
| `pnpm build` | Build shared, api, web in order |
| `pnpm typecheck` | Run TypeScript across all workspaces |
| `pnpm lint` | Lint all workspaces |
| `pnpm db:migrate` | Apply Prisma migrations (dev) |
| `pnpm db:studio` | Open Prisma Studio (DB GUI) |
| `pnpm db:reset` | Wipe DB and re-run migrations |
| `pnpm infra:up` | Start Postgres + Redis containers |
| `pnpm infra:down` | Stop containers |

## Environment variables

### API (`api/.env`)

| Var | Purpose | Default |
|-----|---------|---------|
| `PORT` | API port | `4000` |
| `DATABASE_URL` | Postgres connection | from docker-compose |
| `REDIS_URL` | Redis connection | from docker-compose |
| `JWT_SECRET` | JWT signing secret | dev-only fallback |
| `AI_PROVIDER` | `openai` or `mock` | `mock` |
| `OPENAI_API_KEY` | OpenAI API key | _empty_ |
| `OPENAI_MODEL` | Vision model name | `gpt-4o` |
| `STORAGE_DRIVER` | `local` or `s3` | `local` |
| `MAX_UPLOAD_MB` | Max image size | `10` |
| `AI_RATE_LIMIT_PER_MINUTE` | AI endpoint per-user limit | `10` |

See `api/.env.example` for the full list.

### Web (`web/.env.local`)

| Var | Purpose | Default |
|-----|---------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:4000/api` |

## Architecture highlights

- **AI provider abstraction** — `MealVisionAnalyzer` interface in `api/src/modules/ai/types.ts`. Swap OpenAI for Gemini/Claude/custom by adding a new implementation.
- **Mock AI fallback** — deterministic by image hash so the same photo gives stable results across dev refreshes. No API key required.
- **Two-step pipeline**: vision detection → user confirmation. Only `CONFIRMED` meals contribute to daily totals — drafts and AI suggestions don't.
- **BullMQ queue** for AI jobs so the upload endpoint returns immediately and the frontend polls for status.
- **Image storage abstraction** — `local` for dev, `s3` ready (R2-compatible) for prod.
- **Mobile-first responsive UI** with bottom nav on mobile, sidebar on desktop.
- **Mifflin-St Jeor BMR** + activity factor + goal adjustment computes daily targets server-side; user can override.
- **Balance Score (0-100)** weights: 35 calories / 25 protein / 15 fiber / 15 macro balance / 10 water.

## Production deploy targets

| Component | Recommended provider |
|-----------|---------------------|
| Web | Vercel |
| API | Railway / Render / Fly.io |
| Database | Supabase / Neon |
| Redis | Upstash |
| Object storage | Cloudflare R2 |

## Production deploy checklist

Before flipping the public flag:

### Required env values (production)
- [ ] `JWT_SECRET` — 32+ random bytes, NOT the dev fallback. The API refuses to boot in production without one.
- [ ] `DATABASE_URL` — Postgres connection string with TLS (`?sslmode=require` for managed providers).
- [ ] `REDIS_URL` — TLS Redis URL (Upstash is fine).
- [ ] `AI_PROVIDER=openai` and `OPENAI_API_KEY` — leaving the default `mock` will silently return canned data to real users.
- [ ] `CORS_ORIGINS` — comma-separated list of allowed origins. Lock to the exact frontend host (no wildcards).
- [ ] `STORAGE_DRIVER=s3` plus `S3_*` vars — local fs is dev-only.

### Schema
- [ ] Run `pnpm db:migrate:deploy` (NOT `db:migrate dev`). Deploy migrations should run as part of the API container's start command (`api/Dockerfile` does this).
- [ ] Seed only on the very first deploy (`pnpm db:seed`). Skip thereafter — it upserts a demo user you don't want in prod.

### Health probes
- `GET /health` — liveness. Returns 200 as long as the process is up. Use for container restart policies.
- `GET /health/ready` — readiness. Verifies DB + Redis connectivity. Use for load-balancer routing decisions.

### Observability
- API logs one `METHOD path → status (Xms) ip` line per request via `HttpLoggerMiddleware`. Health probes are skipped to keep the log clean.
- Errors flow through Nest's default exception handler + the custom `ZodFilter`. Hook a Sentry / Datadog SDK into `bootstrap()` for centralized error capture (not done by default to avoid pinning a vendor).

### Graceful shutdown
The API hooks `SIGTERM`/`SIGINT` via `app.enableShutdownHooks()`, so Prisma disconnects, BullMQ workers stop accepting new jobs, and in-flight HTTP requests have a chance to drain. Container schedulers (Kubernetes, ECS, Fly) will get a clean exit.

### Smoke after deploy
```bash
curl -fsS https://api.example.com/health
curl -fsS https://api.example.com/health/ready
curl -fsS -X POST https://api.example.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<seeded>","password":"<seeded>"}'
```
A 200 + token from `/auth/login` is the canonical "the deploy is alive" check.

## Docs

The complete product brief is split into focused files under `docs/`:

- [00-PROJECT-BRIEF.md](docs/00-PROJECT-BRIEF.md) — pitch, core idea
- [01-PRODUCT.md](docs/01-PRODUCT.md) — positioning, MVP scope, future scope
- [05-ARCHITECTURE.md](docs/05-ARCHITECTURE.md) — full stack
- [06-AI-PIPELINE.md](docs/06-AI-PIPELINE.md) — 4-step pipeline + JSON schema + prompts
- [07-DATABASE-SCHEMA.md](docs/07-DATABASE-SCHEMA.md) — all Prisma models
- [08-API-ENDPOINTS.md](docs/08-API-ENDPOINTS.md) — REST endpoints
- [09-NUTRITION-LOGIC.md](docs/09-NUTRITION-LOGIC.md) — BMR, macros, balance score
- [11-EDGE-CASES.md](docs/11-EDGE-CASES.md) — poor images, multiple plates, duplicates
- [TODOS.md](docs/TODOS.md) — master implementation checklist

## License

Private / Proprietary (this is a personal project — no public license yet).
