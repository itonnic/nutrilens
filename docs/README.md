# NutriLens — Documentation Index

AI-powered nutrition tracking webapp. Mobile-first MVP with mobile-app-ready architecture.

> **One-line pitch:** Upload a meal photo → AI estimates calories/macros → confirm or edit → daily/weekly/monthly nutrition tracked.

---

## How to use these docs

- Hand off to engineering: read in order from [00](00-PROJECT-BRIEF.md) → [16](16-CLAUDE-BUILD-PROMPT.md).
- Track build progress: use [TODOS.md](TODOS.md) as the master checklist.
- Hand off to a UI tool: use [15-DESIGN-PROMPT.md](15-DESIGN-PROMPT.md).
- Hand off to Claude Code: use [16-CLAUDE-BUILD-PROMPT.md](16-CLAUDE-BUILD-PROMPT.md).

---

## Index

| # | File | Topic |
|---|------|-------|
| 00 | [00-PROJECT-BRIEF.md](00-PROJECT-BRIEF.md) | Name, pitch, core idea, strategic notes |
| 01 | [01-PRODUCT.md](01-PRODUCT.md) | Positioning, users, MVP scope, future scope |
| 02 | [02-USER-SCENARIOS.md](02-USER-SCENARIOS.md) | 5 key user scenarios |
| 03 | [03-UI-UX.md](03-UI-UX.md) | Visual style, palette, typography, layout |
| 04 | [04-SCREENS.md](04-SCREENS.md) | Detailed specs for all 9 main screens |
| 05 | [05-ARCHITECTURE.md](05-ARCHITECTURE.md) | Stack, options, deployment |
| 06 | [06-AI-PIPELINE.md](06-AI-PIPELINE.md) | 4-step pipeline, JSON schema, prompts, abstraction |
| 07 | [07-DATABASE-SCHEMA.md](07-DATABASE-SCHEMA.md) | All Prisma models |
| 08 | [08-API-ENDPOINTS.md](08-API-ENDPOINTS.md) | All REST endpoints |
| 09 | [09-NUTRITION-LOGIC.md](09-NUTRITION-LOGIC.md) | Mifflin-St Jeor, macros, balance score |
| 10 | [10-AI-INSIGHTS.md](10-AI-INSIGHTS.md) | Daily / weekly / monthly insight examples |
| 11 | [11-EDGE-CASES.md](11-EDGE-CASES.md) | Poor images, multiple plates, hidden ingredients, duplicates |
| 12 | [12-COMPONENTS-NAVIGATION.md](12-COMPONENTS-NAVIGATION.md) | Reusable components, nav, routes |
| 13 | [13-IMPLEMENTATION-REQUIREMENTS.md](13-IMPLEMENTATION-REQUIREMENTS.md) | Code quality, security, privacy, performance |
| 14 | [14-DEVELOPMENT-PHASES.md](14-DEVELOPMENT-PHASES.md) | 5 phases + MVP acceptance criteria |
| 15 | [15-DESIGN-PROMPT.md](15-DESIGN-PROMPT.md) | Drop-in prompt for UI generation tools |
| 16 | [16-CLAUDE-BUILD-PROMPT.md](16-CLAUDE-BUILD-PROMPT.md) | Drop-in prompt for full-stack build |
| ⭐ | [TODOS.md](TODOS.md) | Master implementation checklist |

---

## Critical principles (do not lose these)

1. **Photo-first visual food diary**, NOT a manual macro tracker.
2. **AI output is an estimate, never medical truth** — always editable, always labeled.
3. **Only confirmed meals affect daily totals.** Drafts and unconfirmed AI results don't.
4. **Mobile-first webapp** that's ready to become a mobile app later (PWA / RN / Expo / Capacitor).
5. **AI provider abstraction** — implement OpenAI now, swap-friendly for Gemini/Claude later.
6. **Mock AI fallback** for local development (no API key needed to run the app).
7. **MVP quality bar** = smooth flow of (estimate + confidence + easy correction + accurate daily totals), NOT perfect AI accuracy.

---

## Recommended stack (Option B — scalable)

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, Framer Motion, Recharts, RHF, Zod, TanStack Query |
| Backend | NestJS, Prisma, PostgreSQL |
| Queue | BullMQ + Redis |
| Storage | Cloudflare R2 / S3 |
| AI | OpenAI vision + Structured Outputs (with abstraction) |
| Nutrition DB | USDA FoodData Central + fallback table |
| Deploy | Vercel (web) + Railway/Render (api) + Supabase/Neon (db) + Upstash (redis) + R2 (storage) |
