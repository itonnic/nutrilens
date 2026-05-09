# 08 — API Endpoints

All endpoints. Group by domain.

---

## Auth

| Method | Path |
|--------|------|
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/logout` |
| GET | `/auth/me` |

---

## Onboarding

| Method | Path |
|--------|------|
| POST | `/profile/onboarding` |
| GET | `/profile` |
| PATCH | `/profile` |
| PATCH | `/nutrition-targets` |

---

## Meals

| Method | Path |
|--------|------|
| POST | `/meals/upload` |
| POST | `/meals/analyze` |
| POST | `/meals/:id/confirm` |
| PATCH | `/meals/:id` |
| DELETE | `/meals/:id` |
| GET | `/meals?date=YYYY-MM-DD` |
| GET | `/meals/:id` |

---

## Dashboard

| Method | Path |
|--------|------|
| GET | `/dashboard/daily?date=YYYY-MM-DD` |
| GET | `/dashboard/weekly?start=YYYY-MM-DD` |
| GET | `/dashboard/monthly?month=YYYY-MM` |

---

## Water

| Method | Path |
|--------|------|
| POST | `/water` |
| GET | `/water?date=YYYY-MM-DD` |
| DELETE | `/water/:id` |

---

## Weight

| Method | Path |
|--------|------|
| POST | `/weight` |
| GET | `/weight` |
| DELETE | `/weight/:id` |

---

## AI

| Method | Path |
|--------|------|
| POST | `/ai/analyze-meal` |
| GET | `/ai/jobs/:id` |
