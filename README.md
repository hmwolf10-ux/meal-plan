# Recipe Book and Meal Plan

Open `index.html` (serve over http, e.g. GitHub Pages). Three tabs:

- **Start here**: equipment, safety rules, shopping basics, glossary. One button loads a beginner week.
- **Book**: 131 recipes. Search, filter, tick the ones you want, change servings with − / +; every quantity rescales.
- **My plan**: ticked recipes with servings, total macros, and one combined shopping list (same ingredient added up across recipes, grouped by aisle).

## Layout

```
index.html                 the app
data/cookbook/*.json       recipes (one schema, numeric quantities)
data/starter-plan.json     the original weekly plan
data/beginner-plan.json    first-week plan
data/reference/*.json      cuts, methods, seasonings, supplements, fueling numbers
guides/*.md                long-form guides (chicken, beef, pork, fish, seasoning, storage, scaling, sports, ...)
```

## Recipe format

```json
{ "id": "chicken-rice-bowl", "name": "...", "category": "bowls", "method": "assemble", "cuisine": "basic",
  "servings": 1, "time": 7, "macros": { "kcal": 565, "protein": 45, "carbs": 62, "fat": 13 },
  "ing": [["5.5", "oz", "cooked skinless chicken thigh meat"], ["1", "cup", "cooked white rice"]],
  "steps": ["..."], "notes": "..." }
```

`ing` is `[quantity, unit, item]`; units are `tsp tbsp cup oz lb g` or empty for counts. Chicken recipes use `"portion": "A".."G"` (USDA-based 6 oz cooked chicken macros) instead of `macros`.

## Scaling rules (in the app)

Quantities scale by servings ÷ recipe servings. Salt and strong spices scale about 75% past 2×. Cooking times do not scale; use more pans instead of a bigger pan. Details: `guides/portions-and-scaling.md`.

## Accuracy

Chicken cut macros come from USDA FoodData Central (ids in `data/reference/ingredients.json`). Other values are marked `reference`. Sources and licensing notes: `guides/sources.md`. Food-safety numbers follow USDA FSIS (165°F poultry, 3-4 days leftovers).
