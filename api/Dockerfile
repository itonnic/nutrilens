# syntax=docker/dockerfile:1.6
#
# Multi-stage build for the NestJS API.
#   - `deps`   : install full pnpm workspace deps from monorepo root
#   - `build`  : compile shared + api with the dev deps
#   - `runner` : minimal runtime image with only the production node_modules + dist
#
# Build from repo root:
#     docker build -f api/Dockerfile -t nutrilens-api .
# Run:
#     docker run --rm --env-file api/.env -p 4000:4000 nutrilens-api

FROM node:20-bookworm-slim AS deps
ENV PNPM_HOME=/usr/local/pnpm-global PATH=$PATH:/usr/local/pnpm-global
# Prisma's query engine binary links against OpenSSL at runtime — bookworm-slim
# ships without it. Without this, Prisma logs warnings and may fail to connect.
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo

# Copy lockfile + workspace manifests first so the install layer is cacheable.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY packages/shared/package.json ./packages/shared/
COPY api/package.json ./api/
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile --filter @nutrilens/api... --filter @nutrilens/shared...

# ---

FROM deps AS build
WORKDIR /repo
COPY packages/shared ./packages/shared
COPY api ./api
RUN pnpm --filter @nutrilens/shared build && pnpm --filter @nutrilens/api db:generate && pnpm --filter @nutrilens/api build

# ---

FROM node:20-bookworm-slim AS runner
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
ENV NODE_ENV=production PORT=4000

# Drop dev deps for a smaller runtime image.
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml* ./
COPY --from=build /repo/packages/shared/package.json ./packages/shared/
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/api/package.json ./api/
COPY --from=build /repo/api/dist ./api/dist
COPY --from=build /repo/api/prisma ./api/prisma
RUN pnpm install --frozen-lockfile --prod --filter @nutrilens/api... --filter @nutrilens/shared... \
 && pnpm --filter @nutrilens/api db:generate

USER node
EXPOSE 4000

# Migrations are NOT run on boot. Supabase's direct URL is IPv6-only and many
# free hosts (Render, Koyeb's free tier) lack IPv6 egress, so `migrate deploy`
# fails to reach the host. Instead run migrations from a developer machine
# whenever the schema changes:
#   cd api && pnpm db:migrate:deploy   # uses DIRECT_URL from .env.prod
# The boot command just starts the API.
CMD ["sh", "-c", "cd api && node dist/src/main.js"]
