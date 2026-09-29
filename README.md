# Recipes, Meal Plan and Shopping List

**Open the site:** https://hmwolf10-ux.github.io/meal-plan/

One web page. You pick recipes, choose how many servings, and it gives you the calories, the protein, and one shopping list. There is nothing to install and nothing to edit.

## How to use it

The page has four tabs.

| Tab | What it does |
|---|---|
| **Start Here** | First-time help: equipment to buy, six food-safety rules, how to shop, a glossary. The button **Load a beginner week** fills your plan with one easy week. |
| **Recipes** | 173 recipes with amounts (plus 50 more without amounts, hidden by default). Search, pick a category, or tick **Easy Only**. **Tick the box** on a recipe to add it to your plan. **Click a recipe** to open it and change the servings with − / +. |
| **My Plan** | Your ticked recipes with their servings, total calories and macros, and one shopping list. **Copy Shopping List** puts it on your clipboard. |
| **Guides** | Reading: how to cook every cut of chicken, beef, pork, fish and eggs; rice, grains and vegetables; seasoning and sauces; shopping and budget; portions and scaling; meal-prep workflow; food safety and storage; sports nutrition; supplements; sources. |

Your plan is saved in your browser, so it is still there next time.

## How the math works

- **Scaling.** Every recipe has a base number of servings. Each amount is multiplied by (servings you want) ÷ (base servings). A recipe for 4 that needs 2 lb chicken needs 4 lb at 8 servings.
- **Readable amounts.** Results are turned into something you can measure: 3 tsp becomes 1 tbsp, 4 tbsp becomes ¼ cup, 16 oz becomes 1 lb.
- **Salt and strong spices** scale a bit less than everything else once you go past double, because they get too strong. Taste at the end.
- **Cooking time does not scale.** Doubling a recipe does not double the oven time. Use a second pan instead of piling food on one.
- **Shopping list.** All recipes in your plan are combined. The same ingredient is added up across recipes (2 cups milk + 1 cup milk = 3 cups milk) and sorted by store section. Things like "salt to taste" go in a separate pantry line. Items made by another recipe in your plan (like "cooked rice") are not shopping items.
- **Calories and macros.** The page calculates them from the ingredient amounts using standard USDA values (`data/nutrition.json`), divided by servings. It assumes you eat the skin on skin-on chicken. Bone-in cuts use the edible part only (bone is removed). "Meal Prep" batch recipes are not counted in the plan totals, because the meals that use them already are.
- **Raw vs cooked.** Meat loses weight when cooked. About 12 lb of bone-in thighs makes 14 portions of 5.5 oz cooked meat. See the Portions and Scaling guide.

## Where the numbers come from

- Chicken cuts and macros: USDA FoodData Central (ids in `data/reference/ingredients.json`). Other ingredients: standard USDA values.
- Safe temperatures and leftovers (3-4 days in the fridge): USDA FSIS.
- Sports nutrition and supplement doses: ISSN and IOC consensus papers.
- Prices are examples; your store will differ.
- Full list, licenses and what was and wasn't copied: the Sources guide (`guides/sources.md`).

## Folder layout

```
index.html                 the page
assets/style.css           look
assets/app.js              all the logic (scaling, calories, shopping list, guides viewer)
data/recipes/*.json        recipes, one file per group
data/nutrition.json        ingredient nutrition used for calories and macros
data/plans/*.json          the two ready-made plans (original, beginner)
data/reference/*.json      cuts, cooking methods, seasonings, supplements, fueling numbers
guides/*.md                the guides shown in the Guides tab
```

A recipe looks like this:

```json
{ "id": "chicken-rice-bowl", "name": "Chicken Rice Bowl", "category": "bowls", "method": "assemble",
  "cuisine": "basic", "servings": 1, "time": 7,
  "ing": [["5.5", "oz", "cooked skinless chicken thigh meat"], ["1", "cup", "cooked white rice"]],
  "steps": ["..."], "notes": "..." }
```

Each ingredient is `[amount, unit, item]`. Units are `tsp`, `tbsp`, `cup`, `oz`, `lb`, `g`, or empty for a count.

## Running it on your own computer

The page loads its data files, so it must be served, not opened by double-click. From this folder:

```
python -m http.server 8000
```

then open http://localhost:8000.
