# Meal Plan & Recipe Book

A complete meal planning system designed around three core principles: **batch-friendly**, **budget-first**, and **high-protein**.

## Quick Start

- **[Open the Dashboard](index.html)** – Visual overview, recipes, meal plan, and shopping list
- **[Browse the Recipe Data](data/recipes.json)** – Canonical recipe collection
- **[Browse the Meal Plan Data](data/meal-plan.json)** – Canonical weekly plan and shopping list

## The System

This repository contains everything needed to:
- Cook high-protein meals in bulk 1-2x per week
- Assemble ready-to-eat meals in 5 minutes
- Stay within a ~$47.50/week grocery budget
- Hit ~170g protein daily

### How It Works

**Batch Day (~50 minutes):**
1. Bake 10 lb chicken thighs (35-40 min oven time)
2. Cook 5 cups rice (18 min)
3. Make 7 overnight oat jars (5 min)

**Weekdays (5 min per meal):**
1. Grab overnight oats (no prep)
2. Assemble chicken rice bowls: protein + grain + veggies + sauce
3. Blend banana PB shakes (90 sec)

## Daily Nutrition

| Meal | Protein | Carbs | Fat | Calories |
|------|---------|-------|-----|----------|
| Breakfast (Overnight Oats) | 38g | 60g | 18g | 458 |
| Lunch (Chicken Rice Bowl) | 50g | 65g | 16g | 513 |
| Dinner (Chicken Rice Bowl) | 50g | 65g | 16g | 513 |
| Snack (PB Shake) | 32g | 55g | 16g | 420 |
| **Daily Total** | **~170g** | **~245g** | **~66g** | **1904** |

## Core Recipes

### The 5 Batch Foundations

Everything in this system is built from these 5 recipes:

1. **Batch Baked Chicken Thighs** – 10 lbs, 35-40 min, stores 4 days
2. **Batch Browned Ground Beef** – 2-2.5 lbs, 10 min, stores 4 days
3. **Batch Cooked Rice** – 5 cups dry → 15 cups cooked, 18 min
4. **Batch Sheet Pan Roasted Vegetables** – 3 lbs, 30 min
5. **Batch Cooked Orzo/Pasta** – 1 lb, 9 min

The dashboard contains the canonical batch foundations and meal ideas in `data/recipes.json`; additional variations can be composed from those foundations.

### Meal Categories

- **Rice & Grain Bowls** – Tuna rice, turkey lemon orzo, beef orzo
- **One-Pots** – Turkey pasta, lentil chili
- **Breakfast** – Cottage cheese scrambled eggs, shakshuka
- **Shakes** – PB banana, berry yogurt
- **Budget Tier** – Overnight oats, rice cakes, egg fried rice, tuna fried rice
- **Reference** – Tips, shopping strategies, batch cooking philosophy

The dashboard reads the JSON files in `data/` at runtime, so those files are the canonical source for recipes, targets, meal planning, and shopping data.

## Weekly Shopping List

**Cost: ~$45-50**

### Proteins
- 2 packages bone-in chicken thighs (Family Pack, ~5 lb each) — $12-14

### Grains & Bases
- 5 lb white rice — $3-4
- Rolled oats (5 lb bag) — $4-5

### Dairy
- 2 half-gallons whole milk — $6-8
- 32 oz plain Greek yogurt — $4-5
- Whey protein powder (use existing large tub) — $0
- Peanut butter (natural, smooth) — $3-4

### Vegetables
- 2-3 bags frozen mixed vegetables — $3-4

### Pantry (as needed)
- Soy sauce, honey, olive oil, salt, pepper, garlic powder

## Philosophy

### Budget-First
- Protein per dollar is the metric
- Build your week around what's on sale
- Frozen vegetables = most cost-effective
- Lentil chili is the cheapest meal ($1.10/serving)

### Batch-Friendly
- Cook once, eat all week
- Everything stores 4-5 days refrigerated
- Most recipes freeze for 3+ months
- Same meal twice daily removes decision fatigue

### High-Protein Focus
- Every meal 28-50g protein minimum
- Macros designed for strength training recovery
- Can easily adjust portions up/down

## Common Questions

### Can I swap proteins?
**Yes.** Chicken → ground turkey, ground beef, eggs, beans, tuna. Same methods apply.

### Can I swap grains?
**Yes.** Rice → pasta/orzo, oats, bread. Macros shift slightly but system stays the same.

### Can I swap vegetables?
**Yes.** Buy what's on sale. Frozen is cheapest, fresh seasonal second, roast or steam accordingly.

### How long does food keep?
- Chicken: 4 days fridge | 3 months freezer
- Rice/Pasta: 4-5 days fridge | 3 months freezer
- Oats: 4-5 days fridge (don't freeze)
- Vegetables: depends, but typically 4-5 days

### Can I double the batch?
**Yes.** Everything scales linearly. Cook 20 lbs chicken instead of 10 lbs, takes same time.

### What if I get bored?
- Swap sauces: soy sauce → sriracha, tahini, teriyaki
- Swap proteins: chicken → beef, turkey, tuna
- Try different breakfast: shakshuka, cottage cheese eggs
- Make one-pot meals for variety

### How much time does this actually take?
- **Batch day:** 50 min total (mostly oven/stovetop time, not active)
- **Weekdays:** 5 min per meal (assemble + microwave)
- **Weekly total:** ~4 hours of actual cooking, 150+ meals

## Files in This Repository

- **index.html** – Dashboard shell
- **src/app.js** – Dashboard rendering and interaction logic
- **styles/main.css** – Dashboard styles
- **data/config.json** – Targets and customization settings
- **data/recipes.json** – Recipe collection
- **data/meal-plan.json** – Weekly plan and shopping list
- **README.md** – This file

## Getting Started

1. **Open** [index.html](index.html) through a local web server
2. **Browse** [data/recipes.json](data/recipes.json) for recipe details
3. **Pick a batch day** (Saturday is ideal)
4. **Make your first batch:** Start with chicken, rice, and oats
5. **Assemble meals** throughout the week from prepped components

## Tips

- **First time:** Weigh your portions (especially chicken). By meal 3-4, you'll eyeball it.
- **Storage:** Use flat containers for rice (cools faster). Airtight containers for everything.
- **Reheating:** Microwave chicken bowls 90 sec + 30 sec as needed. Oats cold or microwave.
- **Fallback:** Always keep canned tuna in pantry for no-cook meals.
- **Shopping:** Check your grocery store's weekly ads. Build your batch around protein on sale.

## Future Variations

Future recipes to explore:
- Thai-inspired bowls (peanut sauce, basil)
- Mediterranean bowls (hummus, feta, olives)
- Mexican-inspired (cilantro lime, black beans)
- Indian-inspired (curry, yogurt sauce)
- More budget options (eggs, lentils, beans)
- Freezer-friendly options (soups, stews)

## Version

September 2026 – Same meal twice a day, every day.

---

The dashboard requires a local web server because it loads the JSON data files with `fetch`. For example, run `python -m http.server` from the repository root and open `http://localhost:8000`. Validate the data with `powershell -ExecutionPolicy Bypass -File scripts\validate-data.ps1`.
