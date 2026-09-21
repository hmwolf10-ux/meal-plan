const DATA_FILES = {
  recipes: "../data/recipes.json",
  mealPlan: "../data/meal-plan.json",
  config: "../data/config.json"
};

const state = { recipes: [], mealPlan: null, config: null, filter: "all" };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const formatMetric = (metric) => `${metric.value}${metric.unit === "kcal" ? " kcal" : metric.unit}`;
const metricLine = (nutrition) => [
  `${nutrition.protein.value}${nutrition.protein.unit} protein`,
  `${nutrition.carbs.value}${nutrition.carbs.unit} carbs`,
  `${nutrition.fat.value}${nutrition.fat.unit} fat`,
  `${nutrition.calories.value}${nutrition.calories.unit}`
].join(" | ");

async function loadData() {
  const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key, path]) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
    return [key, await response.json()];
  }));
  Object.assign(state, Object.fromEntries(entries));
}

function renderOverview() {
  const targets = state.config.targets;
  const batchTasks = state.mealPlan.batchCookDay.tasks;
  $("#overview-content").innerHTML = `
    <div class="section"><h3>Daily Targets</h3><div class="stat-row">
      ${[
        ["Protein", targets.dailyProtein], ["Carbs", targets.dailyCarbs],
        ["Fat", targets.dailyFat], ["Calories", targets.dailyCalories]
      ].map(([label, value]) => `<div><div class="stat-label">${label}</div><div class="stat-value">${formatMetric(value)}</div></div>`).join("")}
    </div></div>
    <div class="section"><h3>Weekly Cost &amp; Time</h3><div class="stat-row">
      <div><div class="stat-label">Groceries</div><div class="stat-value">$${state.mealPlan.weeklyPlan.totalCost.amount}</div></div>
      <div><div class="stat-label">Batch Cook</div><div class="stat-value">${state.mealPlan.batchCookDay.totalTime.total.replace("PT", "").replace("M", " min")}</div></div>
      <div><div class="stat-label">Daily Prep</div><div class="stat-value">${targets.dailyMealPrepTime.value} min</div></div>
    </div></div>
    <div class="section"><h3>Batch Cook Schedule</h3><table><thead><tr><th>Task</th><th>Time</th><th>Quantity</th><th>Yield</th></tr></thead><tbody>
      ${batchTasks.map((task) => `<tr><td>${escapeHtml(task.name)}</td><td>${escapeHtml(task.prepTime)} prep + ${escapeHtml(task.cookTime)} cook</td><td>${task.quantity} ${escapeHtml(task.unit)}</td><td>${escapeHtml(task.yield)}</td></tr>`).join("")}
    </tbody></table></div>`;
}

function renderFilters() {
  const categories = [...new Set(state.recipes.map((recipe) => recipe.category))];
  $("#recipe-filters").innerHTML = ["all", ...categories].map((category) =>
    `<button class="filter-btn${state.filter === category ? " active" : ""}" data-filter="${escapeHtml(category)}">${category === "all" ? "All" : escapeHtml(category)}</button>`
  ).join("");
}

function renderRecipes() {
  const recipes = state.filter === "all" ? state.recipes : state.recipes.filter((recipe) => recipe.category === state.filter);
  $("#recipes-table").innerHTML = `<table><thead><tr><th>Recipe</th><th>Category</th><th>Macros</th><th>Time</th></tr></thead><tbody>
    ${recipes.map((recipe) => `<tr class="recipe-row" data-recipe-id="${escapeHtml(recipe.id)}">
      <td><strong>${escapeHtml(recipe.name)}</strong></td><td>${escapeHtml(recipe.category)}</td>
      <td>${metricLine(recipe.nutrition)}</td><td>${escapeHtml(recipe.prepTime)} prep | ${escapeHtml(recipe.cookTime)} cook</td>
    </tr>`).join("")}</tbody></table>`;
}

function showRecipe(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;
  $("#recipe-detail").innerHTML = `<div class="recipe-detail">
    <h3>${escapeHtml(recipe.name)}</h3><div class="macros">${metricLine(recipe.nutrition)}</div>
    <p>Prep: ${escapeHtml(recipe.prepTime)} | Cook: ${escapeHtml(recipe.cookTime)}</p>
    <h4>Ingredients</h4><ul>${recipe.ingredients.map((item) => `<li>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)} ${escapeHtml(item.item)}</li>`).join("")}</ul>
    <h4>Instructions</h4><ol>${recipe.instructions.map((step) => `<li>${escapeHtml(step.instruction)}</li>`).join("")}</ol>
    <button class="btn btn-secondary" data-close-recipe>Close</button>
  </div>`;
  $("#recipe-detail").scrollIntoView({ behavior: "smooth" });
}

function renderPlan() {
  $("#plan-content").innerHTML = state.mealPlan.weeklyPlan.meals.map((meal) => `
    <div class="section"><h3>${escapeHtml(meal.name)}</h3><div class="macros">${metricLine(meal.nutrition)}</div>
    <p>${escapeHtml(meal.notes || "")}</p><ul>${meal.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join("")}</ul></div>
  `).join("");
}

function renderShopping() {
  const categories = state.mealPlan.shoppingList.categories;
  $("#shopping-content").innerHTML = `<div class="section"><h3>Shopping List - $${state.mealPlan.shoppingList.totalCost.amount}/week</h3>
    ${categories.map((category) => `<h4>${escapeHtml(category.name)}</h4><table><thead><tr><th>Item</th><th>Quantity</th><th>Cost</th></tr></thead><tbody>
      ${category.items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td><td>${item.cost == null ? "varies" : `$${item.cost}`}</td></tr>`).join("")}
    </tbody></table>`).join("")}</div>`;
}

function wireEvents() {
  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      document.querySelectorAll(".tab-btn").forEach((button) => button.classList.toggle("active", button === tab));
      document.querySelectorAll(".content").forEach((content) => content.classList.toggle("active", content.id === tab.dataset.tab));
    }
    const filter = event.target.closest("[data-filter]");
    if (filter) { state.filter = filter.dataset.filter; renderFilters(); renderRecipes(); }
    const recipe = event.target.closest("[data-recipe-id]");
    if (recipe) showRecipe(recipe.dataset.recipeId);
    if (event.target.closest("[data-close-recipe]")) $("#recipe-detail").replaceChildren();
  });
}

async function init() {
  try {
    await loadData();
    renderOverview(); renderFilters(); renderRecipes(); renderPlan(); renderShopping(); wireEvents();
  } catch (error) {
    const message = $("#app-error");
    message.textContent = `${error.message}. Run this site through a local web server instead of opening index.html directly.`;
    message.hidden = false;
  }
}

init();
