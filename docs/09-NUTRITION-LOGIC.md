# 09 — Nutrition Calculation Logic

---

## Daily Calorie Target

Use the **Mifflin-St Jeor formula** as default BMR estimation.

Then multiply by activity factor:

| Activity Level | Factor |
|----------------|--------|
| Sedentary | 1.2 |
| Light | 1.375 |
| Moderate | 1.55 |
| Active | 1.725 |
| Very active | 1.9 |

### Goal Adjustment

| Goal | Adjustment |
|------|-----------|
| Lose weight (slow) | −250 kcal |
| Lose weight (balanced) | −500 kcal |
| Gain weight (slow) | +250 kcal |
| Gain weight (balanced) | +400 kcal |
| Maintain | 0 |

> Allow user override.

---

## Macro Defaults

### General Users
| Macro | Share |
|-------|-------|
| Protein | 25% |
| Carbs | 45% |
| Fat | 30% |

### Weight Loss
| Macro | Share |
|-------|-------|
| Protein | 30% |
| Carbs | 40% |
| Fat | 30% |

### Muscle Gain
| Macro | Share |
|-------|-------|
| Protein | 25% |
| Carbs | 50% |
| Fat | 25% |

> Always allow customization.

---

## Nutrition Score (Daily Balance Score)

Create a simple daily **"Balance Score"** from **0 to 100**.

### Suggested Formula

| Component | Points |
|-----------|--------|
| Calorie target adherence | 35 |
| Protein target adherence | 25 |
| Fiber target adherence | 15 |
| Macro balance | 15 |
| Water target | 10 |
| **Total** | **100** |

> Do not make it feel punitive.

### Labels

| Score Range | Label |
|-------------|-------|
| 85–100 | Balanced day |
| 70–84 | Good progress |
| 50–69 | Needs balance |
| 0–49 | Incomplete tracking |
