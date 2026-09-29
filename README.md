# Meal Diary: Recipes, Calories and Shopping List

**Open it:** https://hmwolf10-ux.github.io/meal-plan/

It works like a calorie-tracking app (diary, goals, food search), built around recipes you cook. Log what you eat, watch calories and macros against your goals, scale any recipe to the servings you need, and get a shopping list for the meals you planned. Nothing to install; your data stays on your device.

**On your phone:** open the link in Safari or Chrome and choose Add to Home Screen. It then opens like an app and works offline.

## The five tabs

| Tab | What it does |
|---|---|
| **Diary** | Today at a glance: calories remaining (goal − food), carbs, protein and fat against your goals, and Breakfast, Lunch, Dinner and Snacks. Swipe days with the arrows or the week strip. Tap **Add Food** to search recipes (or **Quick Add** for anything else). Tap an entry to change servings or delete it. **Copy Yesterday** repeats a meal. Plan ahead by adding meals to future days. **Batch Prep** is for cooking-day recipes; it goes on the shopping list but is not counted as eaten. |
| **Recipes** | 159 recipes. Search, filter by category, sort by protein, protein per calorie, calories or time, mark favorites. Open a recipe for nutrition per serving, a servings stepper that rescales every ingredient, steps, and **Add to Diary**. |
| **Shop** | The shopping list for the meals in your Diary: next 7 days, today, this week or a custom range. Ingredients from all recipes are added together, shown as store packages ("1 half-gallon + 1 quart") with what the recipes use, sorted by store section, with checkboxes. Copy or share the list. No plan yet? Start with a ready-made week. |
| **Learn** | Search box for cooking questions across all guides, quick answers (safe temperatures, storage times, measuring, rice), a kitchen setup checklist, and the guides: chicken, beef, pork, fish, eggs, rice and vegetables, seasoning, shopping, portions and scaling, meal prep, food safety, sports nutrition, supplements, sources. Each guide has an "On this page" list. |
| **Me** | Your daily goals (with a calculator based on height, weight, age, activity and goal), backup and restore, erase data. |

## How the numbers work

- **Calories and macros** are calculated from each recipe's ingredients using USDA values (`data/nutrition.json`), divided by servings. Every entry that maps to a single USDA food was checked against the USDA FoodData Central SR Legacy download. The calculation assumes you eat the skin on skin-on chicken. Bone-in cuts use the edible part only (working estimates).
- **Calories remaining** = your goal − food eaten. Batch Prep entries are not counted.
- **Scaling.** Amounts are multiplied by (servings you want) ÷ (servings the recipe makes) and turned into things you can measure (3 tsp becomes 1 tbsp). Salt and strong spices scale about 75% of the increase past double. Cooking time does not scale; use more pans.
- **Shopping list.** Every recipe entry in the range is scaled to the servings you logged, ingredients are added together, and quantities are matched to store packages (`data/shopping.json`). Items made by another recipe in your plan ("cooked rice") are listed separately, not as shopping items.
- **Goals calculator** uses the Mifflin-St Jeor estimate. It is a starting point, not medical advice.

## Your data

Saved in your browser on this device (diary, goals, favorites, checkmarks). Use **Me → Download Backup** before clearing browser data or switching phones, and **Restore Backup** to load it.

## Folder layout

```
index.html                 the app shell
assets/app.js              screens, navigation, storage
assets/core.js             units and scaling, calories, shopping list, packages (no screen code)
assets/style.css           look
sw.js, manifest.webmanifest, icons/    install and offline support
data/recipes/*.json        recipes, one file per group
data/nutrition.json        ingredient nutrition
data/shopping.json         store package sizes
data/plans/templates.json  ready-made weeks
data/reference/*.json      cuts, methods, seasonings, supplements, fueling numbers
guides/*.md                the guides shown in Learn
```

A recipe:

```json
{ "id": "chicken-rice-bowl", "name": "Chicken Rice Bowl", "category": "bowls", "method": "assemble",
  "cuisine": "basic", "servings": 1, "time": 7,
  "ing": [["5.5", "oz", "cooked skinless chicken thigh meat"], ["1", "cup", "cooked white rice"]],
  "steps": ["..."], "notes": "..." }
```

Each ingredient is `[amount, unit, item]` (units: tsp, tbsp, cup, oz, lb, g, or empty for a count).

## Run it locally

```
python -m http.server 8000
```

then open http://localhost:8000 (the app loads data files, so it must be served, not opened by double-click).

## Sources

USDA FoodData Central and FSIS (nutrition, safe temperatures, storage), ISSN and IOC consensus papers (sports nutrition), and the open-source calorie trackers used as a design reference. Full list: `guides/sources.md`.