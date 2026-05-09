# 02 — Key User Scenarios

These scenarios capture the core user flows that the MVP must support end-to-end.

---

## Scenario 1 — Quick Meal Upload

User eats lunch, opens app, uploads photo, AI detects "grilled chicken salad with avocado," estimates calories and macros, user confirms, daily dashboard updates.

**Key requirements:**
- Fast upload (single tap on mobile)
- AI detects multiple items in the salad
- Result shown within reasonable analysis time
- One-click confirmation
- Dashboard reflects new totals immediately

---

## Scenario 2 — AI Makes Mistake

User uploads pasta photo. AI thinks it is 300g pasta, but user knows it was a smaller portion. User edits portion to 180g. App recalculates and saves corrected entry.

**Key requirements:**
- Editable portion field on result screen
- Live nutrition recalculation as user adjusts portion
- All macro fields editable
- Original AI estimate preserved (for analytics later)
- Saved meal reflects user-corrected values

---

## Scenario 3 — Daily Tracking

At night, user checks dashboard. They see:
- 1,720 / 2,100 kcal consumed
- Protein 72%
- Carbs 88%
- Fat 64%
- Fiber low

App suggests:
> "You are low on fiber today. A fruit or vegetable snack could help."

**Key requirements:**
- Daily totals computed from confirmed meals only
- Macro percentages relative to user targets
- AI insight card identifies the lowest-tracked macro
- Suggestion is actionable and non-judgmental

---

## Scenario 4 — Weekly Review

User opens weekly view. App says:
- Average calories: 2,050
- Protein target hit 4/7 days
- Fiber low on 5/7 days
- Most repeated food: eggs
- Insight: "Your breakfast is consistent, but dinner calories vary significantly."

**Key requirements:**
- 7-day rolling calculation
- Per-meal-type aggregations
- Frequency analysis of detected food items
- AI-generated narrative insight

---

## Scenario 5 — Weight Loss Goal

User's target is 1,900 kcal/day. App shows remaining calories and weekly adherence. It should not overpromise weight loss. It should simply show trend and consistency.

**Key requirements:**
- "Calories remaining" shown prominently
- Weekly adherence percentage (target hit days / 7)
- Trend visualization (weight + intake) without predictions
- No "you'll lose X kg by Y date" claims
- Consistency framing > outcome framing
