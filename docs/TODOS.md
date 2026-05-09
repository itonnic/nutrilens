# TODOS — Master Implementation Checklist

Status against the original brief. Items grouped by phase and domain.

Legend: `[x]` shipped · `[~]` intentionally deferred (post-MVP) · `[ ]` outstanding.

---

## Phase 0 — Setup & Foundations

### Project bootstrap
- [x] Initialize monorepo (pnpm workspaces, `web/` + `api/` + `packages/shared/`)
- [~] Set up Git, branch strategy (no repo init done — owner does this)
- [~] Set up commit convention (Conventional Commits) — owner-side
- [x] Configure ESLint, Prettier, TypeScript strict mode in both apps
- [x] Create `.env.example` files with all required variables
- [~] Configure CI (lint + typecheck + build) — out of MVP scope; root scripts ready

### Infrastructure
- [x] Provision PostgreSQL — local docker-compose (port 5433)
- [x] Provision Redis — local docker-compose
- [x] Provision object storage — local fs driver; S3-compatible interface ready
- [~] Configure deployment targets — README documents Vercel + Railway/Render

### Auth bootstrap
- [x] Choose auth strategy — custom JWT (Option B)
- [x] Implement email/password registration
- [x] Implement email/password login
- [x] Implement logout (stateless)
- [x] Implement `/auth/me`
- [~] Optional: Google OAuth (post-MVP)

---

## Phase 1 — Foundation

### Database (Prisma schema)
- [x] `User`, `UserProfile`, `NutritionTarget`, `Meal`, `MealItem`, `DailyLog`, `WaterEntry`, `WeightEntry`, `AiAnalysisJob`
- [x] Seed/demo data (`demo@nutrilens.app` / `demo1234`)

### Landing page
- [x] Hero, How-it-works, Feature cards, Demo mockup, Disclaimer, Pricing placeholder, Footer (with /privacy link)

### Auth pages
- [x] Login page (with "Forgot password?" link)
- [x] Register page
- [x] Forgot-password page (beta workaround copy)

### Onboarding wizard
- [x] 5-step wizard (basics, goal, speed, diet preferences, target preview)
- [x] Persists to `UserProfile` and `NutritionTarget`

### App shell
- [x] AppShell, SidebarNav (desktop), MobileBottomNav (mobile), FAB

### Profile & goals page
- [x] All 4 tabs (Profile, Targets, Weight log, Account) with full editing

---

## Phase 2 — Meal Upload & AI

### Image upload
- [x] File input, drag & drop with visual feedback, mobile camera capture, paste from clipboard
- [x] Client-side image compression (canvas → JPEG, max 1920px longest side)
- [x] Server-side thumbnail + optimization via sharp
- [x] Validate file type and size (image MIME, ≤10MB)
- [x] Image storage abstraction (local + S3-ready)

### Meal upload UI states
- [x] All 6 states: empty, selected, analyzing, result/review, edit, success

### AI pipeline
- [x] `MealVisionAnalyzer` interface + `OpenAiMealVisionAnalyzer` + `MockMealAnalyzer`
- [x] BullMQ queue with retry/backoff + `AiAnalysisJob` lifecycle
- [x] `aiRawJson` persisted on `Meal`
- [x] Rate limit AI endpoints via named throttler (`AI_RATE_LIMIT_PER_MINUTE`)
- [x] Sanitize user notes (HTML strip + control-char strip + prompt-injection patterns)

### AI 4-step pipeline
- [x] Step 1: vision detection (OpenAI Structured Outputs)
- [~] Step 2: USDA FoodData Central matching (post-MVP — analyzer provides nutrition values inline)
- [x] Step 3: AI summary (assumptions/warnings/suggestions in result)
- [x] Step 4: User confirmation gate (only `CONFIRMED` meals affect daily totals)

### AI result page
- [x] Image, AI title, calories, macros, detected items, confidence pill, assumptions, Confirm/Edit/Re-analyze

### Manual correction
- [x] Editable name, quantity, unit, calories, macros, fiber/sugar/sodium with live recalc
- [x] Original AI estimate preserved in `aiRawJson`

### Backend endpoints (Meals + AI)
- [x] `POST /meals/upload`, `POST /meals/analyze`, `POST /meals/:id/confirm`, `PATCH /meals/:id`, `DELETE /meals/:id`, `GET /meals?date=...`, `GET /meals/:id`
- [x] `POST /ai/analyze-meal` (spec-canonical alias)
- [x] `GET /ai/jobs/:id`

---

## Phase 3 — Dashboard

### Daily dashboard
- [x] Greeting (time-of-day aware), DateSwitcher, CalorieRing, calories remaining, 4 macro cards, today's meals, quick upload CTA, AI insight, WaterTracker, weight entry shortcut, balance score

### Daily endpoint
- [x] `GET /dashboard/daily?date=YYYY-MM-DD`
- [x] In-memory per-user cache (30s TTL, invalidated on writes)

### Water tracking
- [x] `POST /water`, `GET /water?date=...`, `DELETE /water/:id`

### Weight tracking
- [x] `POST /weight`, `GET /weight`, `DELETE /weight/:id`

### Nutrition logic
- [x] Mifflin-St Jeor BMR
- [x] Activity factor multipliers (1.2 / 1.375 / 1.55 / 1.725 / 1.9)
- [x] Goal adjustments (−250 / −500 / +250 / +400 / 0)
- [x] Macro defaults (general / weight loss / muscle gain) + user override
- [x] Daily Balance Score (0–100, weights 35/25/15/15/10) + 4 labels

---

## Phase 4 — Diary & Analytics

### Food diary
- [x] Chronological list, date/type/calorie/search filters, Edit + Delete, MealCard with image/name/macros/time

### Meal detail page
- [x] Full image, detected items, breakdown, AI assumptions, confidence pill, "Improve estimate" (re-analyze)
- [~] Corrections history audit log (post-MVP)

### Weekly analytics
- [x] Bar chart (calories vs target reference line), averages, target hit rates, best/highest day, missed days, AI insight

### Monthly analytics
- [x] Calendar heatmap, avg calories, avg protein, weight LineChart, top foods, AI insight

### Analytics endpoints
- [x] `GET /dashboard/weekly?start=...`, `GET /dashboard/monthly?month=...`

---

## Phase 5 — Polish

### Cross-cutting UI states
- [x] Loading skeletons across pages
- [x] Empty states (`<EmptyState>` with CTA)
- [x] Error states with retry where applicable
- [x] Success toasts via global toaster

### Mobile responsive QA
- [x] Mobile-first layouts at 390px, desktop centered shell, FAB + bottom nav

### AI prompt iteration
- [x] Single tuned system prompt with 10 rules (concise, conservative, JSON-only)
- [~] Iteration loop with eval set — post-MVP

### Confidence UI
- [x] Confidence pill on result page (green/amber/red)
- [x] Confidence badge on MealCard
- [x] "Needs review" badge for low-confidence items

### Final design pass
- [x] Color palette (off-white bg, accent green/orange/yellow/purple)
- [x] Typography stack (Geist/Inter via tailwind config)
- [x] Rounded 2xl/3xl cards consistent
- [x] Soft shadows + ample whitespace

---

## Edge Cases

- [x] Poor image quality → analyzer reports `imageQuality.score` + warnings
- [x] Multiple plates / hidden ingredients → analyzer warnings surfaced in UI
- [~] "Multiple plates" explicit "Is this all yours?" UI prompt — post-MVP
- [x] Hidden ingredients → estimation warning shown
- [~] Packaged food OCR → post-MVP (barcode scanner road-mapped)
- [x] Drinks support — `DRINK` meal type + drinks fixture in mock analyzer
- [x] Homemade mixed meals → assumptions surfaced in UI
- [x] Duplicate upload within 10 min → 409 with `duplicateMealId` + UI handler

---

## Security checklist

- [x] Validate file type + size
- [x] Object storage (not DB) for images
- [~] Signed URLs (post-MVP — currently public read for local dev convenience)
- [x] All queries scoped by `userId`
- [x] Cannot read another user's meals
- [x] Rate limit on AI endpoints (`AI_RATE_LIMIT_PER_MINUTE`)
- [x] Sanitize user notes (XSS strip + prompt-injection neutralization)
- [~] HTTPS-only cookies — JWT in `Authorization` header instead; HTTPS handled at deploy edge

---

## Privacy checklist

- [x] Privacy policy placeholder (`/privacy`)
- [~] Account deletion — post-MVP (planned in schema)
- [x] Image deletion when meal deleted (storage cleanup)
- [x] Clear "estimate, not medical advice" disclaimer in landing + result page

---

## Performance checklist

- [x] Compress images client-side before upload
- [x] Generate thumbnails server-side (sharp)
- [x] Lazy-load meal images (`loading="lazy" decoding="async"`)
- [x] Cache `dashboard/daily` summaries (30s TTL with invalidation)
- [x] AI analysis runs in BullMQ queue (no blocking HTTP)
- [x] Avoid blocking the main thread for >100ms operations

---

## MVP Acceptance Criteria

1. [x] User can register/login.
2. [x] User can complete onboarding.
3. [x] User can upload a meal photo.
4. [x] AI returns food estimate.
5. [x] User can edit estimate.
6. [x] User can save meal.
7. [x] Dashboard updates immediately (cache-invalidated).
8. [x] User can view daily meals.
9. [x] User can view weekly/monthly analytics.
10. [x] App is responsive and works well on mobile browser.
11. [x] UI feels clean, abstract, and simple.
12. [x] AI results clearly labeled as estimates.
13. [x] Backend protects user data.
14. [x] Images stored properly (object-storage abstraction).
15. [x] Codebase ready for future mobile app migration (PWA manifest + shared package).

---

## Future scope (intentionally out of MVP)

- [~] Manual meal entry path (`MealSource.MANUAL` enum already in schema)
- [~] PWA install prompt (manifest is shipped, custom install UX is post-MVP)
- [~] React Native / Expo / Capacitor wrapper
- [~] Barcode scanner
- [~] Recipe builder
- [~] Meal recommendations
- [~] AI nutrition coach chat
- [~] Wearable integrations (Apple Health, Google Fit, Garmin, Fitbit)
- [~] Water reminders
- [~] Weight trend projection
- [~] Social features
