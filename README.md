# Meal Plan and Recipe Book

Live site: https://hmwolf10-ux.github.io/meal-plan/

You open a web page, pick recipes, say how many servings you want, and it tells you what to buy and what to cook. Nothing to install and nothing to edit.

## The two pages

| Page | Use it for |
|---|---|
| **Recipe Book** (`book.html`) | Picking recipes and getting a shopping list. Start here. |
| **Weekly Planner** (`index.html`) | Laying out meals day by day for a week (meal slots, batch sizes, package-based shopping list). |

Both pages read the files in `data/`. They must be opened through the website (or a local server), not by double-clicking the file, because browsers block a page from reading files off your disk.

## Recipe Book: how to use it

1. **Start here tab** (first visit): the equipment to buy, six food-safety rules, how to shop, a glossary. The button **Load a beginner week** fills your plan with one week of easy meals.
2. **Book tab**: every recipe in a list.
   - Type in the search box, or pick a category, or tick **Beginner-friendly only**.
   - **Tick the box** next to a recipe to add it to your plan.
   - **Click a recipe name** to open it. Use **− / +** or type a number in the servings box: every ingredient amount changes to match.
3. **My plan tab**: what you ticked.
   - Change servings per recipe with − / +.
   - **Totals**: calories, protein, carbs and fat for all the meals in the plan.
   - **Shopping list**: every ingredient from every recipe, added together and sorted by store section. **Copy shopping list** puts it on your clipboard.
   - **Already made in your plan**: things like "cooked rice" or "cooked chicken" are made by the batch recipes you ticked, so they are not on the shopping list.
   - **Load original plan / Clear** to swap the whole plan.

Your plan is saved in your browser on that device. It stays after you close the page.

## How the math works

**Scaling.** Each recipe lists a base number of servings. Everything is multiplied by (servings you want) ÷ (base servings). Example: a recipe for 4 that calls for 2 lb chicken becomes 4 lb at 8 servings.

**Tidy amounts.** After multiplying, amounts are converted to something you can measure: 3 tsp becomes 1 tbsp, 4 tbsp becomes ¼ cup, 16 oz becomes 1 lb. Counts round to halves.

**Salt and strong spices.** Salt, cayenne, cinnamon and similar scale more slowly once you go past double (about 75% of the increase), because they get too strong if scaled fully. Taste and adjust at the end.

**Cooking time does not scale.** Doubling a recipe does not double the oven time; what matters is how thick the food is. Use a second pan instead of piling food onto one.

**Shopping list.** All recipes in the plan are combined. Identical ingredients with the same kind of unit are added together (2 cups milk + 1 cup milk = 3 cups milk). Ingredients with no amount (like "salt to taste") are listed once under "To taste / pantry".

**Macros.** Calories, protein, carbs and fat are per serving, times the servings in your plan.
- Chicken recipes use USDA data for 6 oz of cooked chicken (thigh, breast, drumstick and so on) and do not include sauce, oil or sides.
- Recipes from the imported set show no macros (the source gave none).
- Batch recipes (category "meal prep", such as batch chicken or batch rice) are not counted in the totals, because the bowls and breakfasts that use them already are.

**Raw weight vs cooked weight.** Meat loses weight when cooked, and bone-in meat has bone. That is why the plan buys about 12 lb of bone-in thighs to get 14 portions of 5.5 oz of cooked meat. All the conversions are in `guides/portions-and-scaling.md`.

## What is in the recipe list

- **131 recipes written for scaling** (`data/cookbook/`): chicken (56 ways), beef, pork, turkey, fish, eggs, beans and lentils, meal-prep batches, bowls, breakfasts, snacks, soups.
- **The planner's 100 recipes** (`data/recipes.json`): about 44 not already in the list above are original and scale; 50 are imported from a public recipe dataset with no ingredient amounts, so they show as **Reference** and cannot be scaled.

The Book therefore lists 225 recipes: 175 scale, 50 are reference only.

## Guides (plain reading, in `guides/`)

Chicken (every cut and cooking method), seasoning and sauces, beef, pork, turkey, fish, eggs and plant protein, grains and vegetables, shopping and budget, portions and scaling, meal-prep workflow, food safety and storage, sports nutrition, supplements, and sources.

## Where the numbers come from

- Chicken macros: USDA FoodData Central (ids listed in `data/reference/ingredients.json`).
- Safe temperatures and how long leftovers keep: USDA FSIS. Poultry 165°F, ground meat 160°F, steaks and chops 145°F, leftovers 3-4 days in the fridge.
- Sports nutrition and supplement doses: ISSN and IOC consensus papers.
- Prices are examples. Your store will differ.
- Full list and licensing notes: `guides/sources.md`.

## Known problems (not fixed yet)

The weekly planner's own data still has some wrong numbers:
- Its chicken rice bowl (10 oz chicken, 50 g protein, 513 kcal) does not add up. 10 oz of cooked thigh alone is about 70 g protein. The recipe book uses a corrected bowl (5.5 oz chicken, 565 kcal, 45 g protein).
- 10 lb of bone-in thighs cannot make 14 portions of 10 oz; it makes about 4 lb of cooked meat.
- Its storage times say 4-5 days; USDA says 3-4.

## Files (only if you are curious)

```
book.html                       recipe book page
index.html, src/, styles/       weekly planner page
data/cookbook/*.json            scalable recipes
data/recipes.json               planner recipes
data/reference/*.json           cuts, methods, seasonings, supplements, fueling numbers
data/starter-plan.json          the original week, for the plan button
data/beginner-plan.json         the beginner week
data/config.json, meal-plan.json, shopping-rules.json   planner data
scripts/validate-data.ps1       checks the planner data
guides/*.md                     the guides
```
