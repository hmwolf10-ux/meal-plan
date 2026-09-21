const DATA_FILES = { recipes: "./data/recipes.json", mealPlan: "./data/meal-plan.json", config: "./data/config.json" };
const state = { recipes: [], config: null, slots: [], filter: "all", search: "", selectedRecipe: null };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const recipeFor = (id) => state.recipes.find((recipe) => recipe.id === id);
const number = (value) => Number(value) || 0;
const tidy = (value) => Number.isInteger(value) ? value : Number(value.toFixed(2));
const formatAmount = (value) => value === "to taste" ? value : tidy(value);
const duration = (iso) => { const match = String(iso || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?/); return match ? `${match[1] ? `${match[1]} hr ` : ""}${match[2] || 0} min` : iso; };
const metricLine = (nutrition) => `${nutrition.protein.value}${nutrition.protein.unit} protein · ${nutrition.carbs.value}${nutrition.carbs.unit} carbs · ${nutrition.fat.value}${nutrition.fat.unit} fat · ${nutrition.calories.value}${nutrition.calories.unit}`;
const scheduleFor = (slot) => slot.schedule?.length === 7 ? slot.schedule : DAYS.map((_, index) => index < number(slot.days) ? number(slot.portions) : 0);

async function loadData() {
  const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return [key, await response.json()];
  }));
  const data = Object.fromEntries(entries);
  state.recipes = data.recipes.recipes;
  state.config = data.config;
  const saved = JSON.parse(localStorage.getItem("table-plan") || "null");
  state.slots = saved || [
    { id: crypto.randomUUID(), label: "Breakfast", recipeId: "overnight-oats", portions: 1, days: 7, schedule: [1, 1, 1, 1, 1, 1, 1] },
    { id: crypto.randomUUID(), label: "Lunch", recipeId: "batch-chicken-thighs", portions: 1, days: 7, schedule: [1, 1, 1, 1, 1, 1, 1] },
    { id: crypto.randomUUID(), label: "Dinner", recipeId: "batch-chicken-thighs", portions: 1, days: 7, schedule: [1, 1, 1, 1, 1, 1, 1] },
    { id: crypto.randomUUID(), label: "Snack", recipeId: "pb-banana-shake", portions: 1, days: 7, schedule: [1, 1, 1, 1, 1, 1, 1] }
  ];
}

function save() { localStorage.setItem("table-plan", JSON.stringify(state.slots)); }
function planTotals() {
  return state.slots.reduce((totals, slot) => {
    const recipe = recipeFor(slot.recipeId); if (!recipe) return totals;
    const servings = scheduleFor(slot).reduce((sum, portions) => sum + number(portions), 0);
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
    const schedule = scheduleFor(slot);
    const total = schedule.reduce((sum, portions) => sum + number(portions), 0);
    return `<article class="meal-slot">
      <div class="slot-marker">${escapeHtml(slot.label.slice(0, 1).toUpperCase())}</div>
      <div class="slot-main">
        <div class="slot-top"><input class="slot-label" aria-label="Meal name" data-slot="${slot.id}" data-field="label" value="${escapeHtml(slot.label)}"><button class="icon-btn" data-remove-slot="${slot.id}" aria-label="Remove ${escapeHtml(slot.label)}">Remove</button></div>
        <select class="recipe-select" data-slot="${slot.id}" data-field="recipeId" aria-label="Recipe">${recipeOptions(slot.recipeId)}</select>
        <div class="slot-controls">
          <span class="yield"><strong>${total} portions this week</strong><small>${duration(recipe.totalTime)} · ${recipe.storage ? `fridge ${recipe.storage.refrigerated} days` : "fresh"}</small></span>
        </div>
        <div class="week-schedule"><span class="schedule-label">Portions by day</span>${DAYS.map((day, index) => `<label><span>${day}</span><input type="number" min="0" step="0.5" value="${schedule[index]}" data-slot="${slot.id}" data-day="${index}" data-field="schedule"></label>`).join("")}</div>
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
    const multiplier = scheduleFor(slot).reduce((sum, portions) => sum + number(portions), 0) / recipe.servings;
    recipe.ingredients.forEach((item) => {
      const key = `${item.item}|${item.unit}`;
      if (!groups[key]) groups[key] = { ...item, quantity: typeof item.quantity === "number" ? 0 : item.quantity, recipes: [] };
      if (typeof item.quantity === "number") groups[key].quantity += item.quantity * multiplier;
      if (!groups[key].recipes.includes(slot.label)) groups[key].recipes.push(slot.label);
    });
  });
  return Object.values(groups);
}
function renderShopping() {
  const items = shoppingGroups();
  $("#shopping-content").innerHTML = `<div class="shopping-summary"><strong>${items.length} ingredients</strong><span>Calculated from ${state.slots.length} meal slots · quantities are uncooked unless noted</span></div>
  <div class="shopping-list">${items.map((item) => `<label class="shopping-item"><input type="checkbox"><span><strong>${escapeHtml(formatAmount(item.quantity))} ${escapeHtml(item.unit)}</strong> ${escapeHtml(item.item)}<small>For ${escapeHtml(item.recipes.join(", "))}</small></span></label>`).join("")}</div>`;
}
function renderPrep() {
  const batchItems = state.slots.filter((slot) => { const recipe = recipeFor(slot.recipeId); return recipe && (recipe.category === "batch" || scheduleFor(slot).filter(Boolean).length > (recipe.storage?.refrigerated || 1)); });
  $("#prep-content").innerHTML = `<div class="prep-layout"><div class="section"><h3>Suggested batch day</h3><p class="muted">Start with recipes that take the longest, then assemble while they cook.</p>${batchItems.length ? batchItems.map((slot, index) => { const recipe = recipeFor(slot.recipeId); return `<div class="prep-step"><span>${index + 1}</span><div><strong>${escapeHtml(recipe.name)}</strong><small>${number(slot.portions) * number(slot.days)} portions · ${duration(recipe.totalTime)} · ${escapeHtml(recipe.instructions[0]?.instruction || "")}</small></div></div>`; }).join("") : `<p class="empty">Add a meal to see a prep sequence.</p>`}</div>
  <div class="section"><h3>Storage reminders</h3><div class="reminders"><p><strong>Cool before storing.</strong><span>Divide hot food into shallow containers so it cools quickly.</span></p><p><strong>Label the date.</strong><span>Keep the first few days in the fridge and freeze the rest when a recipe calls for it.</span></p><p><strong>Use your senses.</strong><span>When in doubt, throw it out. Follow local food-safety guidance.</span></p></div></div></div>`;
}

function updateSlot(id, field, value, dayIndex) {
  const slot = state.slots.find((item) => item.id === id); if (!slot) return;
  if (field === "schedule") {
    slot.schedule = scheduleFor(slot);
    slot.schedule[Number(dayIndex)] = Math.max(0, number(value));
    slot.portions = Math.max(...slot.schedule, 0.5);
    slot.days = slot.schedule.filter(Boolean).length;
  } else {
    slot[field] = field === "label" || field === "recipeId" ? value : Math.max(field === "days" ? 1 : 0.5, number(value));
  }
  save(); renderPlanner(); renderShopping(); renderPrep();
}
function wireEvents() {
  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) { document.querySelectorAll(".tab-btn").forEach((button) => button.classList.toggle("active", button === tab)); document.querySelectorAll(".content").forEach((content) => content.classList.toggle("active", content.id === tab.dataset.tab)); }
    const filter = event.target.closest("[data-filter]"); if (filter) { state.filter = filter.dataset.filter; renderRecipes(); }
    const addRecipe = event.target.closest("[data-add-recipe]");
    if (addRecipe) {
      const recipe = recipeFor(addRecipe.dataset.addRecipe);
      state.slots.push({ id: crypto.randomUUID(), label: recipe.name, recipeId: recipe.id, portions: 1, days: 7, schedule: [1, 1, 1, 1, 1, 1, 1] });
      save(); renderPlanner(); renderShopping(); renderPrep();
      return;
    }
    const view = event.target.closest("[data-view-recipe]"); if (view) showRecipe(view.dataset.viewRecipe);
    if (event.target.closest("[data-close-recipe]")) $("#recipe-detail").replaceChildren();
    if (event.target.closest("[data-add-slot]")) { state.slots.push({ id: crypto.randomUUID(), label: "New meal", recipeId: state.recipes[0].id, portions: 1, days: 7, schedule: [1, 1, 1, 1, 1, 1, 1] }); save(); renderPlanner(); }
    const remove = event.target.closest("[data-remove-slot]"); if (remove) { state.slots = state.slots.filter((slot) => slot.id !== remove.dataset.removeSlot); save(); renderPlanner(); renderShopping(); renderPrep(); }
    if (event.target.closest("[data-print]")) window.print();
  });
  document.addEventListener("change", (event) => {
    const input = event.target.closest("[data-slot][data-field]");
    if (input) updateSlot(input.dataset.slot, input.dataset.field, input.value, input.dataset.day);
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
  try { await loadData(); renderPlanner(); renderRecipes(); renderShopping(); renderPrep(); wireEvents(); }
  catch (error) { $("#app-error").textContent = `${error.message}. Refresh the page and try again.`; $("#app-error").hidden = false; }
}
init();
