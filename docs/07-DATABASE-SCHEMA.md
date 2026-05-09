# 07 — Database Schema

Create a Prisma schema with these models.

---

## User

| Field | Notes |
|-------|-------|
| id | |
| email | |
| name | |
| passwordHash | nullable if OAuth |
| image | |
| createdAt | |
| updatedAt | |

---

## UserProfile

| Field | Notes |
|-------|-------|
| id | |
| userId | |
| age | |
| gender | nullable |
| heightCm | |
| weightKg | |
| activityLevel | |
| goalType | |
| targetWeightKg | nullable |
| weeklyGoalRate | nullable |
| dietaryPreferences | string array |
| timezone | |
| unitSystem | |
| createdAt | |
| updatedAt | |

---

## NutritionTarget

| Field |
|-------|
| id |
| userId |
| dailyCalories |
| proteinGrams |
| carbsGrams |
| fatGrams |
| fiberGrams |
| waterMl |
| createdAt |
| updatedAt |

---

## Meal

| Field | Notes |
|-------|-------|
| id | |
| userId | |
| mealType | |
| title | |
| imageUrl | |
| thumbnailUrl | |
| consumedAt | |
| calories | |
| protein | |
| carbs | |
| fat | |
| fiber | |
| sugar | |
| sodium | |
| confidence | |
| source | enum: `AI`, `MANUAL`, `BARCODE`, `RECIPE` |
| status | enum: `DRAFT`, `CONFIRMED`, `NEEDS_REVIEW` |
| aiRawJson | |
| userNote | |
| createdAt | |
| updatedAt | |

---

## MealItem

| Field |
|-------|
| id |
| mealId |
| name |
| quantity |
| unit |
| calories |
| protein |
| carbs |
| fat |
| fiber |
| sugar |
| sodium |
| confidence |
| assumptions |
| createdAt |
| updatedAt |

---

## DailyLog

> Can be computed from meals, but optionally cached.

| Field |
|-------|
| id |
| userId |
| date |
| totalCalories |
| totalProtein |
| totalCarbs |
| totalFat |
| totalFiber |
| totalWaterMl |
| score |
| createdAt |
| updatedAt |

---

## WaterEntry

| Field |
|-------|
| id |
| userId |
| amountMl |
| loggedAt |
| createdAt |

---

## WeightEntry

| Field |
|-------|
| id |
| userId |
| weightKg |
| loggedAt |
| createdAt |

---

## AiAnalysisJob

| Field | Notes |
|-------|-------|
| id | |
| userId | |
| mealId | nullable |
| imageUrl | |
| status | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| resultJson | |
| errorMessage | |
| createdAt | |
| updatedAt | |
