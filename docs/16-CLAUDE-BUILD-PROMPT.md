# 16 — Claude Code Full Build Prompt

> Drop-in prompt to hand off to Claude Code (or another full-stack engineering agent) for complete MVP implementation.

---

## Prompt

You are an expert full-stack product engineer and UI designer.

Build a production-quality MVP for an AI-powered nutrition tracking webapp called **NutriLens**.

The app lets users upload meal photos, analyzes food with AI, estimates calories/macros/nutrition values, lets users correct the result, and tracks daily/weekly/monthly nutrition progress.

---

### Use this stack

#### Frontend
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts
- React Hook Form
- Zod
- TanStack Query

#### Backend
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Redis + BullMQ for AI jobs
- Object storage abstraction for meal images

#### AI
- Create an AI provider abstraction.
- Implement a meal vision analyzer service.
- Use structured JSON response.
- Do not hardcode AI output directly into controllers.
- Store raw AI result JSON.
- Mark all AI nutrition values as estimates.

---

### Database

Create Prisma models:
- User
- UserProfile
- NutritionTarget
- Meal
- MealItem
- WaterEntry
- WeightEntry
- AiAnalysisJob

---

### Features

1. Auth
2. Onboarding
3. Nutrition target calculation
4. Meal image upload
5. AI analysis flow
6. Manual correction
7. Daily dashboard
8. Food diary
9. Meal detail page
10. Weekly analytics
11. Monthly analytics
12. Profile/goals settings

---

### UI

Mobile-first, abstract, clean, premium wellness style.

Use off-white background, rounded cards, organic gradients, soft shadows, green/orange/yellow/purple accents, minimal icons, and simple progress components.

Avoid generic admin dashboard style.

---

### Important

- Implement excellent loading states.
- Implement empty states.
- Implement error states.
- Implement responsive layout.
- Use proper validation.
- Use clean folder structure.
- Add comments only where useful.
- Keep business logic isolated.
- Make it easy to later migrate to mobile or PWA.
- Add clear disclaimers that nutrition values are estimates.
- Prioritize working MVP over unnecessary complexity.

---

### Deliver

- Complete project structure
- Database schema
- Backend services/controllers
- Frontend pages/components
- API integration
- AI service abstraction
- Mock AI fallback for local development
- Clear environment variable examples
- Seed/demo data
- README with setup instructions

---

### Start Order

Start by creating the architecture and file structure, then implement the core user flow:

> Register/login → onboarding → upload meal photo → analyze → edit/confirm → dashboard update.
