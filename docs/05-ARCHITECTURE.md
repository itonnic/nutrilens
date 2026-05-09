# 05 — Technical Architecture

Build a modern full-stack web app.

---

## Recommended Stack

### Frontend
- **Next.js 15** or latest stable Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts for charts
- React Hook Form
- Zod
- Zustand or Jotai for lightweight client state
- TanStack Query for server data fetching
- UploadThing, S3-compatible upload, or direct backend upload

### Backend — Two Options

#### Option A — Full Next.js (Fast MVP)
- Next.js API routes / server actions
- Prisma
- PostgreSQL
- Auth.js

> Good for fast MVP.

#### Option B — Scalable Architecture (Recommended)
- Next.js frontend
- NestJS backend
- PostgreSQL
- Prisma
- Redis queue
- S3/R2 image storage

> Better for future mobile app and AI processing.

**For this project, choose Option B if building production-ready architecture.**

---

## Recommended MVP Architecture (Option B)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js webapp |
| Backend | NestJS API |
| Database | PostgreSQL |
| ORM | Prisma |
| Queue | BullMQ + Redis |
| File Storage | Cloudflare R2 or AWS S3 |
| AI Provider | OpenAI vision model for image understanding (Structured JSON output) |
| Nutrition DB | USDA FoodData Central API + optional fallback local nutrition table |

---

## Deployment

| Component | Provider Options |
|-----------|------------------|
| Frontend | Vercel |
| Backend | Railway / Render / Fly.io / AWS |
| Database | Supabase / Neon / Railway PostgreSQL |
| Redis | Upstash / Railway Redis |
| Storage | Cloudflare R2 |

---

## Mobile-Ready Architecture

The webapp must be designed so it can later become:
- PWA
- React Native app
- Expo app
- Capacitor-wrapped app

> Use shared business logic wherever possible — keep AI, nutrition calculations, and goal logic in the backend (or in framework-agnostic libraries) so a future mobile client can hit the same API surface.
