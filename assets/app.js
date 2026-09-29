const FILES = ['chicken', 'beef-pork-turkey', 'fish-eggs-plant', 'meal-prep', 'snacks', 'more-meals', 'reference'];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let R = [], NUT = [], SHOP = [], plan = {};                       // plan: { recipeId: servings }
try { plan = JSON.parse(localStorage.getItem('plan') || '{}'); } catch (e) {}
// ---------- display text ----------
const SMALLW = new Set(['and', 'or', 'with', 'in', 'of', 'the', 'a', 'an', 'to', 'for', 'on', 'over', 'from', 'no', 'vs']);
const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
const title = s => String(s || '').split(' ').map((w, i) => { const m = w.match(/^(\W*)([a-z][\w'-]*)(\W*)$/); if (!m || (i > 0 && SMALLW.has(m[2]))) return w; return m[1] + m[2].charAt(0).toUpperCase() + m[2].slice(1) + m[3]; }).join(' ');
const CATS = { 'meal prep': 'Meal Prep', 'plant': 'Beans and Plant Protein', 'fish': 'Fish and Seafood', 'soups and stews': 'Soups and Stews' };
const catLabel = c => CATS[c] || cap(c);
const save = () => { try { localStorage.setItem('plan', JSON.stringify(plan)); } catch (e) {} };

// ---------- units and quantities ----------
const UNITS = { cans: 'can', jars: 'jar', scoops: 'scoop', cups: 'cup', cup: 'cup', c: 'cup', tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp', ounce: 'oz', ounces: 'oz', oz: 'oz', pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb', gram: 'g', grams: 'g', g: 'g' };
const normUnit = u => { u = String(u || '').trim().toLowerCase(); return u in UNITS ? UNITS[u] : u; };
const VOL = { tsp: 1, tbsp: 3, cup: 48 }, WT = { oz: 1, lb: 16, g: 1 / 28.3495 };
const unitType = u => u in VOL ? 'vol' : u in WT ? 'wt' : u === '' || u === 'pinch' ? 'count' : 'other';
const STRONG = /\b(salt|cayenne|cinnamon|allspice|clove|red pepper|chili flakes|pepper flakes)\b/i;
function num(s) {
  s = String(s).trim(); if (!s) return null;
  const m = s.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/); if (m) return (m[1] ? +m[1] : 0) + m[2] / m[3];
  const v = parseFloat(s); return isNaN(v) ? null : v;
}
const scaleFactor = (f, item) => f > 2 && STRONG.test(item) ? 2 + (f - 2) * 0.75 : f;
const FR = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'], [1, '']];
function frac(x) {
  let w = Math.floor(x), r = x - w, best = FR[0];
  for (const c of FR) if (Math.abs(c[0] - r) < Math.abs(best[0] - r)) best = c;
  if (best[0] === 1) { w++; best = FR[0]; }
  return (w ? w : '') + (w && best[1] ? ' ' : '') + best[1] || '0';
}
const SMALL = new Set(['1', '½', '¼', '¾', '⅜', '⅝', '⅓', '⅔', '⅛', '⅞']);
function fmt(q, u) {
  if (q == null) return '';
  const t = unitType(u);
  if (t === 'vol') {
    const tsp = q * VOL[u], cups = tsp / 48;
    if (tsp >= 12) {                                   // use cups only when it is accurate; otherwise cups + tbsp or plain tbsp
      const near = Math.round(cups * 8) / 8, third = Math.round(cups * 3) / 3;
      const pick = Math.abs(near - cups) <= Math.abs(third - cups) ? near : third;
      if (Math.abs(pick - cups) / cups <= 0.05) { const n = frac(pick); return n + (SMALL.has(n) ? ' cup' : ' cups'); }
      if (tsp < 48) return frac(Math.round(tsp / 3 * 2) / 2) + ' tbsp';
      const w = Math.floor(cups + 1e-9), rest = Math.round((tsp - w * 48) / 3 * 2) / 2;
      return w + (w === 1 ? ' cup' : ' cups') + (rest ? ' + ' + frac(rest) + ' tbsp' : '');
    }
    if (tsp >= 3) {                                    // whole tablespoons + a quarter-teaspoon remainder: accurate and easy to measure
      let tb = Math.floor(tsp / 3 + 1e-9), rest = Math.round((tsp - tb * 3) * 4) / 4;
      if (rest >= 3) { tb++; rest = 0; }
      return tb + ' tbsp' + (rest ? ' + ' + frac(rest) + ' tsp' : '');
    }
    return frac(Math.round(tsp * 8) / 8 || 0.125) + ' tsp';
  }
  if (t === 'wt') {
    let oz = q * WT[u];
    if (oz >= 16) {
      if (oz >= 48) oz = Math.round(oz / 4) * 4;       // 3 lb and up: nearest 4 oz is plenty for shopping
      let lb = Math.floor(oz / 16 + 1e-9), rest = Math.round(oz - lb * 16); if (rest >= 16) { lb++; rest = 0; }
      return lb + ' lb' + (rest ? ' ' + rest + ' oz' : '');
    }
    return oz < 4 ? frac(Math.round(oz * 4) / 4 || 0.25) + ' oz' : (Math.round(oz * 2) / 2) + ' oz';
  }
  if (u === 'pinch') return frac(q) + ' pinch';
  if (t === 'other') { const n = Math.round(q * 4) / 4 || 0.25; return frac(n) + ' ' + (n > 1 && !u.endsWith('s') ? u + 's' : u); }
  return frac(q < 4 ? Math.round(q * 2) / 2 || 0.5 : Math.round(q));
}
const ingText = (i, f) => { const q = num(i[0]); return q == null ? i[2] : fmt(q * scaleFactor(f, i[2]), normUnit(i[1])) + ' ' + i[2]; };

// ---------- nutrition calculator ----------
function nutFor(item) { const s = item.toLowerCase(); return NUT.find(n => n.re.test(s)) || null; }
function sizeOf(item, e) {                             // '(4-5 lb)' = each; '(about 3.5 lb)' = total for the whole line
  let m = item.match(/\(about (\d+(?:\.\d+)?)\s*lb\)/i); if (m) return { total: m[1] * 453.6 * (e.edible || 1) };
  m = item.match(/\((\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?\s*(lb|oz)(?: each)?\)/i);
  if (m) return { each: ((+m[1] + (m[2] ? +m[2] : +m[1])) / 2) * (m[3] === 'lb' ? 453.6 : 28.3495) * (e.edible || 1) };
  return null;
}
function grams(q, u, e, item) {
  if (u === 'g') return q; if (u === 'oz') return q * 28.3495 * (e.edible || 1); if (u === 'lb') return q * 453.6 * (e.edible || 1);
  if (u === 'cup') return e.cup ? q * e.cup : null;
  if (u === 'tbsp') return q * (e.tbsp || (e.cup ? e.cup / 16 : 0)) || null;
  if (u === 'tsp') return q / 3 * (e.tbsp || (e.cup ? e.cup / 16 : 0)) || null;
  if (u === '' || u === 'can' || u === 'cans' || u === 'scoop' || u === 'scoops' || u === 'jar') { const z = sizeOf(item || '', e); if (z && z.total) return z.total; if (z && z.each) return q * z.each; return e.each ? q * e.each : null; }
  return null;
}
function macrosOf(r) {                                 // per serving, computed from ingredients
  const T = { kcal: 0, protein: 0, carbs: 0, fat: 0 }, miss = [];
  let any = false;
  for (const i of r.ing) {
    const q = num(i[0]); if (q == null) continue;
    const e = nutFor(i[2]); if (e && e.k === 0) continue; const g = e ? grams(q, normUnit(i[1]), e, i[2]) : null;
    if (g == null) { miss.push(i[2]); continue; }
    any = true; T.kcal += e.k * g / 100; T.protein += e.p * g / 100; T.carbs += e.c * g / 100; T.fat += e.f * g / 100;
  }
  if (!any) return null;
  const s = r.servings || 1;
  return { kcal: Math.round(T.kcal / s), protein: Math.round(T.protein / s), carbs: Math.round(T.carbs / s), fat: Math.round(T.fat / s), miss };
}

// ---------- load ----------
async function load() {
  try {
    NUT = (await (await fetch('data/nutrition.json')).json()).items.map(n => ({ ...n, re: new RegExp(n.m, 'i') }));
    SHOP = (await (await fetch('data/shopping.json')).json()).rules.map(r => ({ ...r, re: new RegExp(r.match, 'i') }));
    for (const f of FILES) { const r = await fetch(`data/recipes/${f}.json`); if (!r.ok) throw new Error(f + ' ' + r.status); (await r.json()).recipes.forEach(x => R.push({ ...x, reference: f === 'reference' })); }
  } catch (e) { $('err').innerHTML = `<span class="err">Could not load data (${esc(e.message)}). Open this page from the website or a local web server; browsers block loading data files straight from disk.</span>`; return; }
  R.forEach(r => { r.mac = macrosOf(r); r.name = title(r.name); });
  const cats = ['all', ...[...new Set(R.filter(r => !r.reference).map(r => r.category))].sort((a, b) => catLabel(a).localeCompare(catLabel(b)))];
  $('cat').innerHTML = cats.map(c => `<option value="${esc(c)}">${c === 'all' ? 'All Categories' : esc(catLabel(c))}</option>`).join('');
  drawBook(); drawPlan();
}
const byId = id => R.find(r => r.id === id);

// ---------- recipes ----------
const HARD = /^(fry|braise|smoke|pan-sear|griddle|stir-fry|spatchcock|grill|oven-fry)$/;
const isEasy = r => !HARD.test(r.method) && (r.time || 0) <= 120;
function drawBook() {
  const q = $('q').value.toLowerCase(), c = $('cat').value, e = $('easy').checked, nr = $('noref').checked;
  const L = R.filter(r => (c === 'all' || r.category === c) && (!e || isEasy(r)) && !(nr && r.reference) && (!q || (r.name + ' ' + r.method + ' ' + r.cuisine + ' ' + r.category).toLowerCase().includes(q)));
  $('n').textContent = L.length + ' recipes';
  $('list').innerHTML = '<tr><th></th><th>Recipe</th><th>Category</th><th>Level</th><th>Min</th><th>kcal</th><th>Protein</th></tr>' + L.map(r =>
    `<tr class="r ${plan[r.id] ? 'sel' : ''}" data-id="${esc(r.id)}"><td class="cb"><input type="checkbox" ${plan[r.id] ? 'checked' : ''} data-cb="${esc(r.id)}"></td><td><b>${esc(r.name)}</b></td><td>${esc(catLabel(r.category))}</td><td>${r.reference ? 'No amounts' : isEasy(r) ? 'Easy' : 'Medium'}</td><td>${r.time || ''}</td><td>${r.mac ? r.mac.kcal : ''}</td><td>${r.mac ? r.mac.protein + ' g' : ''}</td></tr>`).join('');
}
['q', 'cat', 'easy', 'noref'].forEach(id => { $(id).oninput = drawBook; $(id).onchange = drawBook; });
$('list').onclick = e => {
  const cb = e.target.dataset.cb;
  if (cb) { if (e.target.checked) plan[cb] = plan[cb] || byId(cb).servings; else delete plan[cb]; save(); drawBook(); drawPlan(); return; }
  const tr = e.target.closest('tr[data-id]'); if (tr) openRecipe(tr.dataset.id);
};

function openRecipe(id, servings) {
  const r = byId(id), s = servings || plan[id] || r.servings, f = s / r.servings, m = r.mac;
  const macro = m ? `<div class="mut">Per serving: <b>${m.kcal} kcal</b> · ${m.protein} g protein · ${m.carbs} g carbs · ${m.fat} g fat <span title="Calculated from the ingredient amounts using standard USDA values. Assumes you eat the skin.">(estimated from ingredients)</span>${m.miss.length ? '<br>Not counted (no nutrition data): ' + esc(m.miss.join(', ')) : ''}</div>` : '<div class="mut">Calories are not shown because this recipe has no ingredient amounts.</div>';
  $('detail').innerHTML = `<div class="card"><div class="row" style="justify-content:space-between;align-items:center"><h2>${esc(r.name)}</h2>
    <div><span class="step"><button data-d="-1">−</button><input type="number" min="1" step="1" value="${s}" id="sv"><button data-d="1">+</button></span> servings <label><input type="checkbox" id="inplan" ${plan[id] ? 'checked' : ''}> in plan</label></div></div>
    <div class="mut">${esc(catLabel(r.category))}${r.method ? ' · ' + esc(cap(r.method)) : ''}${r.cuisine ? ' · ' + esc(cap(r.cuisine)) : ''}${r.time ? ' · ' + r.time + ' min' : ''} · recipe makes ${r.servings} servings${f !== 1 ? ' · scaled ×' + (Math.round(f * 100) / 100) : ''}</div>${macro}
    <h3>Ingredients</h3><ul>${r.ing.map(i => `<li>${esc(ingText(i, f))}</li>`).join('')}</ul>
    <h3>Steps</h3><ol>${r.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${r.notes ? `<p class="mut">${esc(r.notes)}</p>` : ''}
    ${r.reference ? '<p class="mut">This recipe has no ingredient amounts, so it can not be scaled.</p>' : ''}${f > 3 || f < 0.5 ? '<p class="mut">Big change in size: cooking times stay about the same; use more pans instead of a bigger pan; taste the seasoning at the end.</p>' : ''}</div>`;
  const upd = v => { v = Math.max(1, Math.round(v)); if (plan[id]) { plan[id] = v; save(); drawPlan(); } openRecipe(id, v); };
  $('detail').querySelectorAll('[data-d]').forEach(b => b.onclick = () => upd(+$('sv').value + +b.dataset.d));
  $('sv').onchange = () => upd(+$('sv').value || 1);
  $('inplan').onchange = e => { if (e.target.checked) plan[id] = +$('sv').value; else delete plan[id]; save(); drawBook(); drawPlan(); };
  $('detail').scrollIntoView({ behavior: 'smooth' });
}

// ---------- plan and shopping list ----------
const AISLE = [
  ['Spices', /(garlic|onion|chili|ginger|curry|mustard) powder|paprika|cumin|cayenne|cinnamon|turmeric|garam|coriander|allspice|seasoning|\brub\b|bay leaf|bay leaves|peppercorn|vanilla|masala|oregano|^kosher salt|^salt|black pepper|^pepper|dried thyme|baking powder|za'atar/i],
  ['Pantry and canned', /peanut butter|almond butter|coconut milk|whey|protein powder|broth|stock/i],
  ['Meat and fish', /chicken|beef|pork|turkey|sausage|bacon|steak|salmon|cod|shrimp|tuna|fillet|thigh|drumstick|wing|tenderloin|lamb|chuck|flank|breast/i],
  ['Dairy and eggs', /egg|milk|yogurt|cheese|butter|cream|feta|parmesan|mozzarella|cottage/i],
  ['Produce', /onion|garlic|carrot|celery|bell pepper|potato|broccoli|spinach|kale|lemon|lime|banana|cucumber|zucchini|mushroom|asparagus|cabbage|ginger|cilantro|parsley|thyme|scallion|jalapeno|berries|herb|vegetable|green bean/i],
  ['Pantry and canned', /rice|oat|lentil|bean|chickpea|pasta|noodle|flour|panko|tortilla|bun|bread|couscous|tomato|salsa|marinara|sauce|oil|vinegar|soy|honey|sugar|syrup|mustard|peanut|hummus|tofu|wine|beer|granola|cornstarch|baking/i]
];
const aisleOf = n => (AISLE.find(a => a[1].test(n)) || ['Other'])[0];
const isMade = n => /^(cooked|poached|roasted|leftover|shredded|sliced|cold cooked)\b/i.test(n);
const norm = n => n.toLowerCase().replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(/\b(optional|to taste|of choice|fresh|large|small|diced|sliced|chopped|minced|peeled)\b/g, '').replace(/\s+/g, ' ').trim().replace(/^cans?\s+/, '');

// ---------- store packages ----------
function needIn(x, unit) {                             // recipe need converted to the package unit, or null if it doesn't fit
  if (unit === 'cup') return x.t === 'vol' ? x.base / 48 : null;
  if (unit === 'tbsp') return x.t === 'vol' ? x.base / 3 : null;
  if (unit === 'oz') return x.t === 'wt' ? x.base : null;
  if (unit === 'scoop') return x.t === 'other' && x.unit === 'scoop' ? x.base : null;
  if (unit === 'count') return x.t === 'count' || (x.t === 'other' && (x.unit === 'can' || x.unit === 'jar')) ? x.base : null;
  return null;
}
function bestPack(need, pk) {                          // fewest wasted units; small penalty for many packages
  let best = null; const counts = [], maxN = pk.map(p => Math.ceil(need / p[2]) + 1);
  (function rec(i, total) {
    if (i === pk.length) {
      if (total < need - 1e-6) return;
      const n = counts.reduce((a, b) => a + b, 0), score = (total - need) + 0.25 * need * Math.max(0, n - 1);
      if (!best || score < best.score - 1e-9) best = { counts: [...counts], score };
      return;
    }
    for (let c = 0; c <= maxN[i]; c++) { counts[i] = c; rec(i + 1, total + c * pk[i][2]); }
  })(0, 0);
  return best;
}
function packagesFor(x) {
  const rule = SHOP.find(r => r.re.test(x.name)); if (!rule) return null;
  const need = needIn(x, rule.unit); if (need == null || need <= 0) return null;
  const pk = [...rule.packages].sort((a, b) => b[2] - a[2]), b = bestPack(need, pk); if (!b) return null;
  return b.counts.map((c, i) => c ? c + ' ' + (c === 1 ? pk[i][0] : pk[i][1]) : '').filter(Boolean).join(' + ');
}
function shopping() {
  const M = new Map(), made = new Map(), free = new Set();
  for (const [id, s] of Object.entries(plan)) {
    const r = byId(id); if (!r) continue; const f = s / r.servings;
    for (const i of r.ing) {
      const q = num(i[0]), name = norm(i[2]), u = normUnit(i[1]); if (!name || /^(cold |hot )?water$|^water |^ice/.test(name)) continue;
      if (q == null) { free.add(name); continue; }
      const t = unitType(u), qq = q * scaleFactor(f, i[2]);
      const base = t === 'vol' ? qq * VOL[u] : t === 'wt' ? qq * WT[u] : qq;
      const target = isMade(i[2]) ? made : M, key = name + '|' + t + (t === 'other' ? u : '');
      const cur = target.get(key) || { name, t, base: 0, unit: u }; cur.base += base; target.set(key, cur);
    }
  }
  const out = (m, buy) => [...m.values()].map(x => {
    let txt;
    if (x.t === 'vol') { const u = x.base >= 12 ? 'cup' : x.base >= 3 ? 'tbsp' : 'tsp'; txt = fmt(x.base / VOL[u], u); }
    else if (x.t === 'wt') txt = fmt(x.base, 'oz'); else if (x.t === 'other') txt = fmt(x.base, x.unit); else txt = fmt(x.base, '');
    return { name: x.name, txt, pkg: buy ? packagesFor(x) : null };
  });
  const list = out(M, true);
  return { list, made: out(made), free: [...free].filter(n => !list.some(x => x.name === n)) };
}

function drawPlan() {
  const ids = Object.keys(plan).filter(id => byId(id)); $('cnt').textContent = ids.length ? '(' + ids.length + ')' : '';
  $('sel').innerHTML = ids.length ? '<tr><th>Recipe</th><th>Servings</th><th></th></tr>' + ids.map(id => { const r = byId(id); return `<tr><td><a href="#" data-open="${esc(id)}"><b>${esc(r.name)}</b></a><div class="mut">${esc(catLabel(r.category))} · recipe makes ${r.servings}</div></td><td><span class="step"><button data-p="${esc(id)}" data-d="-1">−</button><input type="number" min="1" value="${plan[id]}" data-pv="${esc(id)}"><button data-p="${esc(id)}" data-d="1">+</button></span></td><td><button data-rm="${esc(id)}">Remove</button></td></tr>`; }).join('') : '<tr><td class="mut">Nothing yet. Tick recipes on the Recipes tab.</td></tr>';
  const T = { kcal: 0, protein: 0, carbs: 0, fat: 0 }; let miss = 0;
  ids.forEach(id => { const r = byId(id); if (r.category === 'meal prep') return; if (r.mac) { T.kcal += r.mac.kcal * plan[id]; T.protein += r.mac.protein * plan[id]; T.carbs += r.mac.carbs * plan[id]; T.fat += r.mac.fat * plan[id]; } else miss++; });
  $('totals').innerHTML = `<div class="row"><div class="stat"><b>${Math.round(T.kcal)}</b>kcal</div><div class="stat"><b>${Math.round(T.protein)} g</b>protein</div><div class="stat"><b>${Math.round(T.carbs)} g</b>carbs</div><div class="stat"><b>${Math.round(T.fat)} g</b>fat</div></div><div class="mut">Total for every serving in the plan. Divide by the number of days to get a daily amount. "Meal prep" batch recipes are not counted because the meals that use them already are${miss ? '; ' + miss + ' recipe(s) without amounts are not counted' : ''}.</div>`;
  const S = shopping(), g = {};
  S.list.forEach(x => (g[aisleOf(x.name)] = g[aisleOf(x.name)] || []).push(x));
  $('shop').innerHTML = ids.length ? ['Meat and fish', 'Produce', 'Dairy and eggs', 'Pantry and canned', 'Spices', 'Other'].filter(a => g[a]).map(a => `<div class="aisle">${a}</div><ul>${g[a].sort((x, y) => x.name.localeCompare(y.name)).map(x => `<li>${esc(title(x.name))} — ${x.pkg ? `<b>${esc(x.pkg)}</b> <span class="mut">(recipes use ${esc(x.txt)})</span>` : `<span class="mut">${esc(x.txt)}${a === 'Spices' ? ' · pantry item' : ''}</span>`}</li>`).join('')}</ul>`).join('') + (S.free.length ? `<div class="aisle">To taste / pantry</div><div class="mut">${esc(S.free.map(cap).join(', '))}</div>` : '') : '<div class="mut">Empty</div>';
  $('prep').style.display = S.made.length ? 'block' : 'none';
  $('prepl').innerHTML = S.made.map(x => `${esc(title(x.name))} — ${esc(x.txt)}`).join(' · ') + '<br>These come from the batch recipes in your plan (or cook them fresh). They are not shopping items.';
}
$('sel').onclick = e => {
  const d = e.target.dataset;
  if (d.open) { e.preventDefault(); show('book'); openRecipe(d.open); }
  if (d.rm) { delete plan[d.rm]; save(); drawBook(); drawPlan(); }
  if (d.p) { plan[d.p] = Math.max(1, plan[d.p] + +d.d); save(); drawPlan(); }
};
$('sel').onchange = e => { const id = e.target.dataset.pv; if (id) { plan[id] = Math.max(1, Math.round(+e.target.value) || 1); save(); drawPlan(); } };
$('clear').onclick = () => { plan = {}; save(); drawBook(); drawPlan(); };
$('copy').onclick = () => { navigator.clipboard?.writeText($('shop').innerText); $('copy').textContent = 'Copied'; setTimeout(() => $('copy').textContent = 'Copy Shopping List', 1200); };
async function loadPlan(name, then) {
  try { const s = await (await fetch(`data/plans/${name}.json`)).json(); plan = {}; s.items.forEach(i => { if (byId(i.id)) plan[i.id] = i.servings; }); save(); drawBook(); drawPlan(); if (then) show(then); }
  catch (e) { $('err').textContent = 'Could not load that plan.'; }
}
$('starter').onclick = () => loadPlan('original'); $('beginner').onclick = () => loadPlan('beginner', 'plan');

// ---------- guides ----------
const GUIDES = [['Cook', [['chicken', 'Chicken: every cut and method'], ['beef', 'Beef'], ['pork', 'Pork'], ['turkey-and-other-poultry', 'Turkey and other poultry'], ['fish-and-seafood', 'Fish and seafood'], ['eggs-dairy-and-plant-protein', 'Eggs, dairy, beans, tofu'], ['grains-and-vegetables', 'Rice, grains, vegetables'], ['seasoning-and-sauces', 'Seasoning, rubs, sauces']]],
  ['Plan and shop', [['shopping-and-budget', 'Shopping and budget'], ['portions-and-scaling', 'Portions and scaling'], ['meal-prep-system', 'Meal-prep workflow'], ['food-safety-and-storage', 'Food safety and storage']]],
  ['Health', [['sports-nutrition', 'Sports nutrition and marathon fueling'], ['supplements', 'Supplements'], ['sources', 'Sources']]]];
function drawGuides() {
  $('gnav').innerHTML = GUIDES.map(([h, l]) => `<h3>${h}</h3>` + l.map(([f, t]) => `<button data-g="${f}">${t}</button>`).join('')).join('');
  openGuide('chicken');
}
async function openGuide(f) {
  document.querySelectorAll('#gnav button').forEach(b => b.classList.toggle('on', b.dataset.g === f));
  try {
    const txt = await (await fetch(`guides/${f}.md`)).text();
    $('gbody').innerHTML = window.marked ? marked.parse(txt) : '<pre>' + esc(txt) + '</pre>';
    $('gbody').querySelectorAll('a').forEach(a => { const m = (a.getAttribute('href') || '').match(/^(?:\.\/)?([\w-]+)\.md$/); if (m) a.dataset.g = m[1]; });
    window.scrollTo(0, 0);
  } catch (e) { $('gbody').textContent = 'Could not load this guide.'; }
}
$('gnav').onclick = e => { if (e.target.dataset.g) openGuide(e.target.dataset.g); };
$('gbody').onclick = e => { const a = e.target.closest('a[data-g]'); if (a) { e.preventDefault(); openGuide(a.dataset.g); } };

// ---------- tabs ----------
function show(id) {
  ['start', 'book', 'plan', 'guides'].forEach(s => { $(s).classList.toggle('on', s === id); $('t-' + s).classList.toggle('on', s === id); });
  if (id === 'guides' && !$('gnav').innerHTML) drawGuides();
}
$('t-start').onclick = () => show('start'); $('t-book').onclick = () => show('book'); $('t-plan').onclick = () => { drawPlan(); show('plan'); }; $('t-guides').onclick = () => show('guides');
try { if (!localStorage.getItem('seen')) { show('start'); localStorage.setItem('seen', '1'); } } catch (e) {}
load();
