# Sources and How They Were Used

## Government and consensus documents (highest weight)
| Source | Used for |
|---|---|
| USDA FoodData Central (SR Legacy) | Chicken cut macros (FDC ids in [`data/reference/ingredients.json`](../data/reference/ingredients.json), marked `verified`). Other foods are marked `reference` (standard values transcribed, not re-verified) |
| USDA FSIS: Safe Minimum Internal Temperature Chart, Leftovers and Food Safety, Chicken from Farm to Table | 165F poultry, 145F whole cuts, 160F ground, 3-4 days leftovers, 2-hour rule |
| USDA AMS/ARS standard yield tables | Bone/skin yield of thigh and drumstick (about 62-64% edible before cook loss) |
| ISSN nutrient timing position stand (PMC5596471) | Carb-loading 8-12 g/kg, in-exercise carbs 30-60+ g/h |
| ISSN protein and exercise position stand (10.1186/s12970-017-0177-8) | 1.4-2.0 g/kg protein for exercisers |
| ISSN ultra-marathon position stand (PMC6839090) | Endurance fueling and sodium |
| IOC 2018 consensus: dietary supplements and the high-performance athlete (PMC5867441) | Supplement evidence tiers |

## GitHub repositories reviewed
| Repository | License | What it is | Use |
|---|---|---|---|
| [PatrykWajs/Huberman-Lab-Wiki](https://github.com/PatrykWajs/Huberman-Lab-Wiki) | MIT | AI-generated summaries of 390+ Huberman Lab episodes; `docs/Conclusions/*.md` | Protocols (hydration, caffeine timing, supplements) graded against consensus |
| [erinheit451/verified-supplement-evidence](https://github.com/erinheit451/verified-supplement-evidence) | CC BY 4.0 | CSVs of supplements with dose, cost/day, certification, PubMed ids | Cross-reference for product choice |
| [rbrents3000/bulk.recipes](https://github.com/rbrents3000/bulk.recipes) | not declared | 181 Costco-based recipes with cost breakdowns | Cost-per-serving structure only (not copied) |
| [archangel-michael/recipes](https://github.com/archangel-michael/recipes) | not declared | High-protein meal-prep recipes in markdown; 7-facet tag system | Tag vocabulary inspiration |
| [Parth8/cookbook](https://github.com/Parth8/cookbook) | all rights reserved | 216 recipes, 228 ingredients with macros | Data model reference only; **not copied** |
| [MukeshVebhudi/prepfit](https://github.com/MukeshVebhudi/prepfit) | not declared | High-protein batch planner | Reference for planner design |
| [paullydd/bitebudget](https://github.com/paullydd/bitebudget) | not stated here | Budget-aware meal planner | Reference |
| [HoChiPants/open-recipe-archive](https://github.com/HoChiPants/open-recipe-archive) | MIT code, CC0 data | Open recipe JSON schema | Schema reference; its recipe folders (breakfast, desserts, drinks, salads, sandwiches, sides, snacks, soups) contain no chicken mains |
| [micahcochran/json-cookbook](https://github.com/micahcochran/json-cookbook) | per recipe CC/PD | 100 schema.org recipes | Reviewed; mostly cocktails and sides, not relevant |
| [jakevdp/open-recipe-data](https://github.com/jakevdp/open-recipe-data) | CC BY 3.0 | Open Recipe Project dump (recipeitems.json.gz) | Reviewed; scraped web recipes, not adopted |
| [dspray95/open-recipe](https://github.com/dspray95/open-recipe) | Unlicense | Scraper for BBC Good Food | Not used |
| [jzarca01/awesome-food](https://github.com/jzarca01/awesome-food) | - | Curated food project list | Discovery |
| [jrhizor/awesome-nutrition-tracking](https://github.com/jrhizor/awesome-nutrition-tracking) | - | List of nutrition databases and APIs | Discovery |

### Honest note on "copying" from GitHub
Most recipe repos found are personal collections with no license or an all-rights-reserved license, or are scraped copies of other websites' recipes, so their recipe text is not copied here. Recipes in this repo are original write-ups of standard techniques. Only facts (temperatures, ratios, nutrient values) come from public sources, and those are cited.

## Community, video and blog advice (secondary; via search results, not primary data)
- Food Network Kitchen meal-prep thighs: roast at 425F; boneless skinless thighs reheat better than skin-on (skin will not stay crisp); 2.5-3 lb of thighs fits on one rimmed sheet; keeps about 4 days.
- America's Test Kitchen thigh guidance: cook dark meat to 175F because collagen breaks down at higher temperature; start skin-down in a cold or moderate pan for crisp skin; 450F finish.
- Running-nutrition newsletters (Fueled by LOLZ and others): most marathoners benefit from 60-90 g carbs/h; start near 60 g/h and build up over weeks; gut training matters; individual tolerance varies.
- Huberman Lab guest episodes (Galpin, Aragon; via Podcast Notes and Shortform summaries): protein about 1 g/lb (about 2.2 g/kg) is a common athlete recommendation, higher than the ISSN 1.4-2.0 g/kg range; caffeine of 1-3 mg/kg is suggested there for mild effect, versus 3-6 mg/kg in the IOC document. When sources disagree, this repo shows the ISSN/IOC range and notes the range.
- YouTube meal-prep chicken-rice-bowl channels (searched): typical bowls are 450-550 kcal with 45-53 g protein and 5-day fridge claims; USDA says 3-4 days, so this repo uses 3-4.

## Known gaps
- Reddit pages could not be fetched directly (blocked); subreddit-specific advice above is via search summaries only.
- The USDA API demo key hit its rate limit, so non-chicken macros are transcribed reference values.
- No price data is scraped live; costs are illustrative and should be replaced with your local prices.
