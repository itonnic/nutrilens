# syntax=docker/dockerfile:1.6
#
# Multi-stage build for the Next.js web app.
#
# Build from repo root:
#     docker build -f web/Dockerfile -t nutrilens-web .
# Run:
#     docker run --rm -e NEXT_PUBLIC_API_URL=https://api.example.com/api -p 3000:3000 nutrilens-web

FROM node:20-bookworm-slim AS deps
ENV PNPM_HOME=/usr/local/pnpm-global PATH=$PATH:/usr/local/pnpm-global
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY packages/shared/package.json ./packages/shared/
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile --filter @nutrilens/web... --filter @nutrilens/shared...

# ---

FROM deps AS build
WORKDIR /repo
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY packages/shared ./packages/shared
COPY web ./web
RUN pnpm --filter @nutrilens/shared build && pnpm --filter @nutrilens/web build

# ---

FROM node:20-bookworm-slim AS runner
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml* ./
COPY --from=build /repo/packages/shared/package.json ./packages/shared/
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/web/package.json /repo/web/next.config.mjs ./web/
COPY --from=build /repo/web/.next ./web/.next
COPY --from=build /repo/web/public ./web/public
RUN pnpm install --frozen-lockfile --prod --filter @nutrilens/web... --filter @nutrilens/shared...

USER node
EXPOSE 3000
CMD ["sh", "-c", "cd web && node node_modules/next/dist/bin/next start -p $PORT"]
