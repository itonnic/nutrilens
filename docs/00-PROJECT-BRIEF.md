# 00 — Project Brief: NutriLens

## Product Name

**Working name:** NutriLens

### Alternative Names
- PlateIQ
- DailyFuel
- CalorieLens
- MacroMap
- FoodScope
- NutriFlow

> Use **NutriLens** for now unless a better brand direction is needed later.

---

## One-Line Pitch

NutriLens is an AI-powered nutrition tracking web app where users upload meal photos, receive estimated calories and macro/micronutrient breakdowns, and track daily, weekly, and monthly nutrition progress through a clean abstract dashboard.

---

## Core Product Idea

Users eat something, take a photo, upload it into the web app, and the system analyzes the meal using AI.

### The app should estimate:
- Detected foods
- Portion estimates
- Calories
- Protein
- Carbs
- Fat
- Fiber
- Sugar
- Sodium
- Optional micronutrients where reasonable
- Confidence score
- Possible ambiguity warnings
- Suggested corrections

The user can then confirm or edit the AI result.

### The system stores each meal under the user's daily nutrition log and updates:
- Daily calorie intake
- Remaining calories
- Macro progress
- Water intake
- Meal distribution
- Weekly average intake
- Monthly trends
- Goal adherence
- Nutrition quality score

The UI should feel simple, calm, modern, abstract, and premium. It should not look like a complicated fitness app or spreadsheet.

---

## Strategic Notes

- **Webapp MVP first**, with mobile app-ready architecture
- **AI provider:** OpenAI vision-capable model + Structured Outputs (JSON Schema-conformant responses)
- **Nutrition data source:** USDA FoodData Central API (do NOT trust AI estimates as single source of truth — match against authoritative nutrition database where possible)
- **Quality bar:** The most critical MVP quality point is NOT perfect AI estimation. It is a smooth flow of: estimate + confidence + easy correction + accurate daily totals.

### Positioning Statement
> "A visual food diary that helps normal people understand what they eat without manually entering everything."

NOT a hardcore bodybuilding macro tracker.

---

## References Used

- OpenAI vision models with Structured Outputs (JSON Schema)
- USDA FoodData Central REST API for nutrient/food data integration
