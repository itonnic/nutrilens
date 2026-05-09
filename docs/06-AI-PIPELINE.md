# 06 — AI Architecture & Pipeline

> **Critical principle:** Do not directly trust AI calories as final truth.

Use a **two-step AI pipeline** with a confirmation layer.

---

## Pipeline Steps

### Step 1 — Vision Food Detection

**Input:**
- Meal image
- Optional user note
- Meal type
- User region if available

**Output:**
- Food items
- Portion estimates
- Confidence
- Possible preparation method
- Visible ingredients
- Ambiguities

### Step 2 — Nutrition Matching

For each detected food:
- Search nutrition database
- Match closest food item
- Estimate grams/serving
- Calculate nutrition values

### Step 3 — AI Summary

Generate user-friendly explanation:
- "This looks like a high-carb meal"
- "Protein is moderate"
- "The estimate may be less accurate because sauce quantity is unclear"

### Step 4 — User Confirmation

User confirms or edits.
**Only confirmed meals affect official daily totals.**

---

## AI JSON Schema

The AI analysis response should follow this shape:

```ts
type MealAnalysisResult = {
  mealTitle: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "unknown";
  confidence: number; // 0-1
  imageQuality: {
    score: number;
    issues: string[];
  };
  detectedItems: Array<{
    name: string;
    category: string;
    estimatedQuantity: number;
    unit: "g" | "ml" | "piece" | "tbsp" | "cup" | "serving";
    portionConfidence: number;
    visible: boolean;
    preparationMethod?: string;
    assumptions: string[];
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  assumptions: string[];
  warnings: string[];
  suggestions: string[];
};
```

---

## AI Provider Abstraction

Create an interface so AI providers can be swapped later:

```ts
interface MealVisionAnalyzer {
  analyzeMeal(input: {
    imageUrl: string;
    userNote?: string;
    mealType?: string;
    locale?: string;
  }): Promise<MealAnalysisResult>;
}
```

### Implement
- `OpenAiMealVisionAnalyzer`

### Later possible
- `GeminiMealVisionAnalyzer`
- `ClaudeMealVisionAnalyzer`
- `CustomModelMealVisionAnalyzer`

> This will make it easy to switch models.

---

## AI Prompt for Meal Analysis

Create a backend prompt similar to:

```text
You are a nutrition estimation assistant inside a food tracking app.

Analyze the provided meal image and optional user note.

Your task:
1. Identify visible food and drink items.
2. Estimate portion sizes.
3. Estimate calories and nutrition values.
4. State assumptions clearly.
5. Return only valid JSON matching the required schema.
6. Use conservative estimates when uncertain.
7. Include confidence scores.
8. Warn when sauce, oil, dressing, hidden ingredients, or portion size are unclear.
9. Do not give medical advice.
10. Do not claim exact accuracy.

Optional user note:
{{userNote}}

Meal type:
{{mealType}}

Return JSON only.
```

---

## AI Pipeline Implementation Notes

- Store the **raw AI result JSON** on the `Meal` row (`aiRawJson`) for auditing and future re-evaluation.
- Mark all AI nutrition values clearly as **estimates** in the UI.
- Provide a **mock AI fallback** for local development so contributors do not need API keys to run the app.
- AI calls should run in a **BullMQ queue** so the frontend can show the analyzing state without holding an HTTP connection.
- Persist `AiAnalysisJob` rows for status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) and error messages.
- Rate-limit the AI analysis endpoint per user to avoid abuse and cost spikes.
