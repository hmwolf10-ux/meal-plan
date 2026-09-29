$ErrorActionPreference = "Stop"

function Read-JsonFile($path) {
  Get-Content -Raw -LiteralPath $path | ConvertFrom-Json
}

$recipes = Read-JsonFile "data\recipes.json"
$plan = Read-JsonFile "data\meal-plan.json"
$config = Read-JsonFile "data\config.json"

$recipeIds = @($recipes.recipes | ForEach-Object { $_.id })
$references = @(
  $plan.weeklyPlan.meals | ForEach-Object {
    $_.recipe
    $_.components | ForEach-Object { $_.recipe }
  }
  $plan.batchCookDay.tasks | ForEach-Object { $_.recipe }
)
$missing = @($references | Where-Object { $_ -and $_ -notin $recipeIds })
if ($missing.Count -gt 0) {
  throw "Missing recipe references: $($missing -join ', ')"
}

$meals = @($plan.weeklyPlan.meals)
$dailyProtein = $meals[0].nutrition.protein.value +
  ($meals[1].nutrition.protein.value * 2) + $meals[2].nutrition.protein.value
$dailyCarbs = $meals[0].nutrition.carbs.value +
  ($meals[1].nutrition.carbs.value * 2) + $meals[2].nutrition.carbs.value
$dailyFat = $meals[0].nutrition.fat.value +
  ($meals[1].nutrition.fat.value * 2) + $meals[2].nutrition.fat.value
$dailyCalories = $meals[0].nutrition.calories.value +
  ($meals[1].nutrition.calories.value * 2) + $meals[2].nutrition.calories.value

$checks = @(
  @("protein", $dailyProtein, $config.targets.dailyProtein.value),
  @("carbs", $dailyCarbs, $config.targets.dailyCarbs.value),
  @("fat", $dailyFat, $config.targets.dailyFat.value),
  @("calories", $dailyCalories, $config.targets.dailyCalories.value)
)
foreach ($check in $checks) {
  if ($check[1] -ne $check[2]) {
    throw "Daily $($check[0]) total ($($check[1])) does not match target ($($check[2]))."
  }
}

Write-Output "Meal-plan data is valid."
