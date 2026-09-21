const DATA_FILES = { recipes: "./data/recipes.json", mealPlan: "./data/meal-plan.json", config: "./data/config.json", shoppingRules: "./data/shopping-rules.json" };
const state = { recipes: [], config: null, shoppingRules: [], slots: [], filter: "all", search: "", selectedRecipe: null };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const recipeFor = (id) => state.recipes.find((recipe) => recipe.id === id);
const number = (value) => Number(value) || 0;
const tidy = (value) => Number.isInteger(value) ? value : Number(value.toFixed(2));
const formatAmount = (value) => value === "to taste" ? value : tidy(value);
const duration = (iso) => { const match = String(iso || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?/); return match ? `${match[1] ? `${match[1]} hr ` : ""}${match[2] || 0} min` : iso; };
const metricLine = (nutrition) => `${nutrition.protein.value}${nutrition.protein.unit} protein · ${nutrition.carbs.value}${nutrition.carbs.unit} carbs · ${nutrition.fat.value}${nutrition.fat.unit} fat · ${nutrition.calories.value}${nutrition.calories.unit}`;
const servingsFor = (slot) => number(slot.servings ?? slot.portions * slot.days) || 0;
const batchSizeFor = (slot, recipe) => Math.max(1, number(slot.batchSize) || Math.min(servingsFor(slot), number(recipe.storage?.refrigerated) || servingsFor(slot)));

async function loadData() {
  const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return [key, await response.json()];
  }));
  const data = Object.fromEntries(entries);
  state.recipes = data.recipes.recipes;
  state.config = data.config;
  state.shoppingRules = data.shoppingRules.rules;
  const saved = JSON.parse(localStorage.getItem("table-plan") || "null");
  state.slots = saved || [
    { id: crypto.randomUUID(), label: "Breakfast", recipeId: "overnight-oats", servings: 7, batchSize: 5 },
    { id: crypto.randomUUID(), label: "Lunch", recipeId: "batch-chicken-thighs", servings: 14, batchSize: 4 },
    { id: crypto.randomUUID(), label: "Dinner", recipeId: "batch-chicken-thighs", servings: 14, batchSize: 4 },
    { id: crypto.randomUUID(), label: "Snack", recipeId: "pb-banana-shake", servings: 7, batchSize: 2 }
  ];
  state.slots = state.slots.map((slot) => slot.schedule ? { ...slot, servings: slot.schedule.reduce((sum, amount) => sum + number(amount), 0), batchSize: Math.min(slot.schedule.filter(Boolean).length || 1, number(recipeFor(slot.recipeId)?.storage?.refrigerated) || 7) } : slot);
}

function save() { localStorage.setItem("table-plan", JSON.stringify(state.slots)); }
function planTotals() {
  return state.slots.reduce((totals, slot) => {
    const recipe = recipeFor(slot.recipeId); if (!recipe) return totals;
    const servings = servingsFor(slot);
    totals.servings += servings; totals.cost += number(recipe.cost?.perServing || recipe.cost?.total / recipe.servings) * servings;
    totals.calories += number(recipe.nutrition.calories) * servings / 7;
    totals.protein += number(recipe.nutrition.protein.value) * servings / 7;
    return totals;
  }, { servings: 0, cost: 0, calories: 0, protein: 0 });
}
function recipeOptions(selected) { return state.recipes.map((recipe) => `<option value="${escapeHtml(recipe.id)}"${recipe.id === selected ? " selected" : ""}>${escapeHtml(recipe.name)}</option>`).join(""); }

function renderPlanner() {
  const totals = planTotals();
  $("#plan-count").textContent = state.slots.length;
  $("#plan-stats").innerHTML = [
    ["Meals planned", totals.servings, "portions this week"],
    ["Est. groceries", `$${totals.cost.toFixed(2)}`, "based on recipe costs"],
    ["Daily calories", Math.round(totals.calories), `target ${state.config.targets.dailyCalories.value}`],
    ["Daily protein", `${Math.round(totals.protein)}g`, `target ${state.config.targets.dailyProtein.value}g`]
  ].map(([label, value, note]) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
  $("#meal-slots").innerHTML = state.slots.map((slot) => {
    const recipe = recipeFor(slot.recipeId); if (!recipe) return "";
    const total = servingsFor(slot);
    return `<article class="meal-slot">
      <div class="slot-marker">${escapeHtml(slot.label.slice(0, 1).toUpperCase())}</div>
      <div class="slot-main">
        <div class="slot-top"><input class="slot-label" aria-label="Meal name" data-slot="${slot.id}" data-field="label" value="${escapeHtml(slot.label)}"><button class="icon-btn" data-remove-slot="${slot.id}" aria-label="Remove ${escapeHtml(slot.label)}">Remove</button></div>
        <select class="recipe-select" data-slot="${slot.id}" data-field="recipeId" aria-label="Recipe">${recipeOptions(slot.recipeId)}</select>
        <div class="slot-controls">
          <label>Portions this week <input type="number" min="1" step="1" value="${total}" data-slot="${slot.id}" data-field="servings"></label>
          <label>Portions per batch <input type="number" min="1" step="1" value="${batchSizeFor(slot, recipe)}" data-slot="${slot.id}" data-field="batchSize"></label>
          <span class="yield"><strong>${Math.ceil(total / batchSizeFor(slot, recipe))} batch${Math.ceil(total / batchSizeFor(slot, recipe)) === 1 ? "" : "es"}</strong><small>${duration(recipe.totalTime)} · fridge ${recipe.storage ? `${recipe.storage.refrigerated} days` : "check storage"}</small></span>
        </div>
        <div class="slot-meta"><span>${escapeHtml(recipe.description || "")}</span><button class="text-btn" data-view-recipe="${recipe.id}">View recipe & ingredients →</button></div>
      </div>
    </article>`;
  }).join("");
}

function renderRecipes() {
  const categories = ["all", ...new Set(state.recipes.map((recipe) => recipe.category))];
  $("#recipe-filters").innerHTML = categories.map((category) => `<button class="filter-btn${state.filter === category ? " active" : ""}" data-filter="${escapeHtml(category)}">${category === "all" ? "All" : escapeHtml(category)}</button>`).join("");
  const recipes = state.recipes.filter((recipe) => {
    const matchesFilter = state.filter === "all" || recipe.category === state.filter;
    const query = state.search.toLowerCase();
    return matchesFilter && (!query || `${recipe.name} ${recipe.description || ""} ${recipe.category} ${(recipe.tags || []).join(" ")}`.toLowerCase().includes(query));
  });
  $("#recipe-count").textContent = `${recipes.length} recipe${recipes.length === 1 ? "" : "s"} shown`;
  $("#recipes-grid").innerHTML = recipes.length ? recipes.map((recipe) => `<article class="recipe-card" data-view-recipe="${recipe.id}">
    <div class="recipe-card-top"><span class="tag">${escapeHtml(recipe.category)}</span><span>${duration(recipe.totalTime)}</span></div>
    <h3>${escapeHtml(recipe.name)}</h3><p>${escapeHtml(recipe.description || "")}</p>
    <div class="macros">${metricLine(recipe.nutrition)}</div><div class="recipe-card-footer"><span>${recipe.servings} ${escapeHtml(recipe.yield?.unit || "servings")}</span><button class="text-btn" data-add-recipe="${recipe.id}">Add to plan +</button></div>
  </article>`).join("") : `<div class="empty recipe-empty">No recipes match that search. Try another ingredient or category.</div>`;
}

function showRecipe(id) {
  const recipe = recipeFor(id); if (!recipe) return;
  state.selectedRecipe = id;
  $("#recipe-detail").innerHTML = `<div class="recipe-detail">
    <div class="detail-heading"><div><span class="tag">${escapeHtml(recipe.category)}</span><h2>${escapeHtml(recipe.name)}</h2><p>${escapeHtml(recipe.description || "")}</p></div><button class="icon-btn" data-close-recipe>Close</button></div>
    <div class="detail-grid"><div><h4>Scale this recipe</h4><label class="scale-label">How many servings? <input id="recipe-scale" type="number" min="0.5" step="0.5" value="${recipe.servings}"></label><ul id="scaled-ingredients">${scaledIngredients(recipe, recipe.servings)}</ul></div>
    <div><h4>Method</h4><ol>${recipe.instructions.map((step) => `<li>${escapeHtml(step.instruction)}</li>`).join("")}</ol><div class="storage-note"><strong>Storage</strong><span>${recipe.storage ? `${recipe.storage.refrigerated} days refrigerated${recipe.storage.frozen ? ` · ${recipe.storage.frozen} days frozen` : ""}` : "Follow package guidance"}.</span></div></div></div>
  </div>`;
  $("#recipe-detail").scrollIntoView({ behavior: "smooth", block: "start" });
}
function scaledIngredients(recipe, servings) {
  return recipe.ingredients.map((item) => {
    const amount = typeof item.quantity === "number" ? formatAmount(item.quantity * servings / recipe.servings) : item.quantity;
    return `<li><strong>${escapeHtml(amount)}</strong> ${escapeHtml(item.unit)} ${escapeHtml(item.item)}${item.optional ? " <em>optional</em>" : ""}</li>`;
  }).join("");
}

function shoppingGroups() {
  const groups = {};
  state.slots.forEach((slot) => {
    const recipe = recipeFor(slot.recipeId); if (!recipe) return;
    const multiplier = servingsFor(slot) / recipe.servings;
    recipe.ingredients.forEach((item) => {
      const name = item.item.toLowerCase().replace(/\s*\([^)]*\)/g, "").replace(/,\s*(sliced|diced|minced|chopped|frozen is best)/g, "").trim();
      const unit = String(item.unit || "").toLowerCase().trim();
      const key = `${name}|${unit}`;
      if (!groups[key]) groups[key] = { ...item, item: name, unit, quantity: typeof item.quantity === "number" ? 0 : item.quantity, recipes: [] };
      if (typeof item.quantity === "number") groups[key].quantity += item.quantity * multiplier;
      if (!groups[key].recipes.includes(slot.label)) groups[key].recipes.push(slot.label);
    });
  });
  return Object.values(groups).map(toPurchaseLine).filter(Boolean);
}
function toPurchaseLine(item) {
  const needed = typeof item.quantity === "number" ? `${formatAmount(item.quantity)}${item.unit ? ` ${item.unit}` : ""}` : "amount from source recipe";
  const name = item.item;
  const rule = state.shoppingRules.find((candidate) => candidate.matches.some((match) => name.includes(match)) && (candidate.recipeUnit === "*" || candidate.recipeUnit === item.unit));
  if (rule?.omit) return null;
  if (typeof item.quantity !== "number") return { ...item, buy: "Use the amount in the recipe", needed };
  if (rule) {
    if (rule.id === "pantry-seasoning") return { ...item, buy: "Check pantry; buy 1 container if needed", needed };
    if (!rule.packageQuantity) return { ...item, buy: `1 ${rule.packageLabel}`, needed };
    const packages = Math.max(1, Math.ceil(item.quantity / rule.packageQuantity));
    return { ...item, buy: `${packages} ${rule.packageLabel}${packages === 1 ? "" : "s"} (${rule.packageNote})`, needed };
  }
  return { ...item, buy: `${formatAmount(item.quantity)}${item.unit ? ` ${item.unit}` : ""} ${name}`, needed };
}
function renderShopping() {
  const items = shoppingGroups();
  $("#shopping-content").innerHTML = `<div class="shopping-summary"><strong>${items.length} items to shop</strong><span>Buy quantities are practical package estimates. “Needed” is the recipe math.</span></div>
  <div class="shopping-list">${items.map((item) => `<label class="shopping-item"><input type="checkbox"><span><strong>${escapeHtml(item.buy)}</strong><small>Needed: ${escapeHtml(item.needed)} · For ${escapeHtml(item.recipes.join(", "))}</small></span></label>`).join("")}</div>`;
}
function updateSlot(id, field, value, dayIndex) {
  const slot = state.slots.find((item) => item.id === id); if (!slot) return;
  slot[field] = field === "label" || field === "recipeId" ? value : Math.max(1, number(value));
  if (field === "recipeId") {
    const recipe = recipeFor(value);
    slot.batchSize = Math.min(number(slot.batchSize) || servingsFor(slot), number(recipe?.storage?.refrigerated) || servingsFor(slot));
  }
  save(); renderPlanner(); renderShopping();
}
function wireEvents() {
  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) { document.querySelectorAll(".tab-btn").forEach((button) => button.classList.toggle("active", button === tab)); document.querySelectorAll(".content").forEach((content) => content.classList.toggle("active", content.id === tab.dataset.tab)); }
    const filter = event.target.closest("[data-filter]"); if (filter) { state.filter = filter.dataset.filter; renderRecipes(); }
    const addRecipe = event.target.closest("[data-add-recipe]");
    if (addRecipe) {
      const recipe = recipeFor(addRecipe.dataset.addRecipe);
      state.slots.push({ id: crypto.randomUUID(), label: recipe.name, recipeId: recipe.id, servings: 7, batchSize: Math.min(7, number(recipe.storage?.refrigerated) || 7) });
      save(); renderPlanner(); renderShopping(); renderPrep();
      return;
    }
    const view = event.target.closest("[data-view-recipe]"); if (view) showRecipe(view.dataset.viewRecipe);
    if (event.target.closest("[data-close-recipe]")) $("#recipe-detail").replaceChildren();
    if (event.target.closest("[data-add-slot]")) { state.slots.push({ id: crypto.randomUUID(), label: "New meal", recipeId: state.recipes[0].id, servings: 7, batchSize: Math.min(7, number(state.recipes[0].storage?.refrigerated) || 7) }); save(); renderPlanner(); }
    const remove = event.target.closest("[data-remove-slot]"); if (remove) { state.slots = state.slots.filter((slot) => slot.id !== remove.dataset.removeSlot); save(); renderPlanner(); renderShopping(); }
    if (event.target.closest("[data-print]")) window.print();
  });
  document.addEventListener("change", (event) => {
    const input = event.target.closest("[data-slot][data-field]");
    if (input) updateSlot(input.dataset.slot, input.dataset.field, input.value);
    if (event.target.id === "recipe-search") { state.search = event.target.value; renderRecipes(); }
  });
  document.addEventListener("input", (event) => {
    if (event.target.id === "recipe-search") {
      state.search = event.target.value;
      renderRecipes();
      const search = $("#recipe-search");
      search.focus();
      search.setSelectionRange(state.search.length, state.search.length);
    }
  });
  document.addEventListener("input", (event) => { if (event.target.id === "recipe-scale") { const recipe = recipeFor(state.selectedRecipe); if (recipe) $("#scaled-ingredients").innerHTML = scaledIngredients(recipe, number(event.target.value)); } });
}
async function init() {
  try { await loadData(); renderPlanner(); renderRecipes(); renderShopping(); wireEvents(); }
  catch (error) { $("#app-error").textContent = `${error.message}. Refresh the page and try again.`; $("#app-error").hidden = false; }
}
init();
