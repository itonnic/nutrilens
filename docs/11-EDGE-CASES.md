# 11 — Error and Edge Cases

Handle these cases. Every one of them must have explicit UX behavior in the MVP.

---

## Poor Image Quality

If image is blurry/dark:
- Return low confidence
- Ask user to retake or add note
- Still allow manual entry

---

## Multiple Plates

AI should detect multiple meal items.

Ask:
- "Is this all yours?"
- Option: "Split portion"

---

## Hidden Ingredients

Sauces, oils, dressings are hard.

Show warning:
- "Sauce/oil amount is estimated."

---

## Packaged Food

If package label is visible:
- Try extracting text
- Let user manually enter barcode in future

---

## Drinks

Support:
- Coffee
- Tea
- Juice
- Smoothie
- Alcohol (optional later)
- Water

---

## Homemade Mixed Meals

Examples:
- Soup
- Stew
- Pasta
- Rice bowl
- Casserole

> AI must return assumptions and ask for confirmation.

---

## Duplicate Upload

Prevent accidental duplicate meal save.

If same image uploaded within **10 minutes**:
- Ask user if they want to save again.
