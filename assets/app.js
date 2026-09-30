'use strict';
/* Meal Plan app: screens, routing, storage. Logic lives in core.js. */
const { esc, cap, catLabel, fmt, ingText, MEALS, ymd, parseYmd, addDays } = Core;
const $ = s => document.querySelector(s);

// ---------- icons ----------
const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICON = {
  back: svg('<path d="M15 18l-6-6 6-6"/>'), next: svg('<path d="M9 18l6-6-6-6"/>'), cal: svg('<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>'),
  heart: svg('<path d="M12 20.5s-7.5-4.7-9.6-9.3C.9 7.900 3 4.500 6.500 4.500c2 0 3.500 1 5.500 3 2-2 3.500-3 5.500-3 3.500 0 5.600 3.400 4.100 6.700-2.100 4.600-9.600 9.300-9.600 9.300z"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'), share: svg('<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'),
  edit: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  plan: svg('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8.5l1.5 1.500L12.500 7M8 15.500l1.500 1.500 3-3M15 9h2M15 16h2"/>'),
  recipes: svg('<path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M9 3v6M17 3c-2 1.500-3 4-3 7 0 1.500 1 2.500 3 3v8"/>'),
  shop: svg('<circle cx="9" cy="20" r="1.500"/><circle cx="18" cy="20" r="1.500"/><path d="M2.500 3h3l2.500 12.500h11L21 7H6.500"/>'),
  learn: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2V16h5v-.1c0-.8.4-1.500 1-2A6 6 0 0 0 12 3z"/>'),
  me: svg('<circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.1a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3h0a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500h0a1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800v0a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/>'), x: svg('<path d="M6 6l12 12M18 6L6 18"/>')
};
const NAV = [['plan', 'Meal Plan', ICON.plan], ['recipes', 'Recipes', ICON.recipes], ['shop', 'Shop', ICON.shop], ['learn', 'Learn', ICON.learn], ['me', 'Settings', ICON.me]];

// ---------- storage ----------
const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem('cb.' + k)); return v ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('cb.' + k, JSON.stringify(v)); } catch (e) {} } };
let goals = store.get('goals', { kcal: 2000, protein: 150, carbs: 225, fat: 65 }), plan = store.get('plan', []);
let have = store.get('have', {}), checked = store.get('checked', {}), favs = store.get('favs', []);
const savePlan = () => store.set('plan', plan);
const R = () => Core.recipes;
const rec = id => Core.byId(id);
const entryName = id => rec(id) ? rec(id).name : 'Removed recipe';
const shortName = n => n.replace(/^Batch Cooked /, '').replace(/^Batch Roasted /, 'Roasted ');
const comboName = p => { const n = p.map(entryName); return n[0] + (n.length > 1 ? ' with ' + n.slice(1).map(shortName).join(' & ') : ''); };
const svText = s => (s === 1 ? '1 serving' : s + ' servings');
const r0 = n => Math.round(n);
const DAYS = 7;
const planEntries = () => plan.filter(e => rec(e.r)).map(e => ({ r: e.r, s: e.s }));

// ---------- ui helpers ----------
function setBar({ title, back, right = '' }) {
  $('#bar').hidden = !back;
  $('#barin').innerHTML = (back ? `<a class="icon-btn back" href="${back}" aria-label="Back">${ICON.back}</a>` : '') + `<h1>${esc(title)}</h1>${right}`;
  document.title = title === 'Meal Plan' ? title : title + ' · Meal Plan';
}
function setNav(root) {
  $('#navin').innerHTML = NAV.map(([k, l, ic]) => `<a href="#/${k}" ${k === root ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></a>`).join('');
}
let sheetReturn = null;
function openSheet(html) {
  sheetReturn = document.activeElement; $('#sheet').innerHTML = html; $('#sheet-bg').classList.add('open');
  const f = $('#sheet').querySelector('input:not([type=checkbox]),select,button'); if (f) f.focus();
}
function closeSheet() { $('#sheet-bg').classList.remove('open'); $('#sheet').innerHTML = ''; if (sheetReturn && sheetReturn.focus) sheetReturn.focus(); }
$('#sheet-bg').addEventListener('click', e => { if (e.target.id === 'sheet-bg') closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet-bg').classList.contains('open')) closeSheet(); });
let toastTimer = null;
function toast(msg, undo) {
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>` + (undo ? '<button type="button" id="undo">Undo</button>' : ''); t.classList.add('open');
  if (undo) $('#undo').onclick = () => { undo(); t.classList.remove('open'); };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('open'), 5000);
}
function download(name, text, type = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
const stepper = (id, val, step = 1, min = 1) => `<div class="stepper"><button type="button" data-step="-${step}" data-for="${id}" aria-label="Decrease">−</button><input type="number" id="${id}" value="${val}" min="${min}" step="${step}" inputmode="decimal" aria-label="Servings"><button type="button" data-step="${step}" data-for="${id}" aria-label="Increase">+</button></div>`;
// ---------- MEAL PLAN ----------
// The plan is the recipes you picked and how many servings of each to cook for the week.
function planTotals() {
  const T = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  plan.forEach(e => { const m = Core.entryMac({ r: e.r, s: e.c ?? e.s }); Object.keys(T).forEach(k => T[k] += m[k] / DAYS); });
  return T;
}
function viewPlan() {
  setBar({ title: 'Meal Plan' });
  const T = planTotals(), diff = goals.kcal - T.kcal, near = Math.abs(diff) <= goals.kcal * 0.05;
  const rows = plan.map(e => { const r = rec(e.r); if (!r) return ''; const m = r.mac || { kcal: 0, protein: 0 }, nm = esc(r.name);
    return `<div class="entry"><span class="nm"><a href="#/recipe/${r.id}/plan/${e.s}">${nm}</a><span class="sub">${r.category === 'basics' ? svText(e.s) : 'Make ' + svText(e.s)} · ${r0(m.kcal)} cal each · ${r0(m.protein)} g protein</span><span class="sub"><a href="#/recipe/${r.id}/plan/${e.s}">How to make it</a></span></span><button class="icon-btn" data-a="edit" data-id="${r.id}" aria-label="Edit ${nm}">${ICON.edit}</button></div>`; }).join('');
  $('#view').innerHTML = `<div class="row wrap" style="margin:0 0 12px"><button class="btn primary sm" data-a="templates">Build a Week</button><a class="btn sm" href="#/recipes">+ Add Recipe</a><a class="btn sm" href="#/shop">Shopping List</a>${plan.length ? '<button class="btn sm danger" data-a="clearplan">Clear</button>' : ''}</div>
    ${plan.length ? `<div class="card" style="padding:12px 16px"><div class="row" style="justify-content:space-between"><b>${r0(T.kcal).toLocaleString()} <span class="muted" style="font-weight:400">of ${goals.kcal.toLocaleString()} cal a day</span></b><span class="small" style="color:${near ? 'var(--green)' : 'var(--orange)'}">${near ? 'On goal' : r0(Math.abs(diff)).toLocaleString() + (diff > 0 ? ' under' : ' over')}</span></div>
      <div class="pbar ${diff < 0 && !near ? 'over' : ''}" style="margin:8px 0" role="img" aria-label="${r0(T.kcal)} of ${goals.kcal} calories"><i style="width:${goals.kcal ? Math.min(100, T.kcal / goals.kcal * 100) : 0}%"></i></div>
      <span class="tiny muted">Protein ${r0(T.protein)}/${goals.protein} g · Carbs ${r0(T.carbs)}/${goals.carbs} g · Fat ${r0(T.fat)}/${goals.fat} g</span>
      <p class="tiny muted" style="margin-top:6px">What everything below adds up to, spread over ${DAYS} days.</p></div>
    <section class="card flush meal" aria-label="Your recipes"><div class="meal-h"><h3>Cook This Week</h3><span class="muted small">${plan.length} ${plan.length === 1 ? 'recipe' : 'recipes'}</span></div>${rows}</section>
    <p class="tiny muted" style="margin:6px 8px">Tap a recipe for the steps, scaled to the servings you are making. Food keeps about 4 days in the fridge. Set your goals in <a href="#/me">Settings</a>.</p>`
    : `<div class="card"><h2 style="font-size:18px">Nothing in your plan yet</h2><p class="muted" style="margin:6px 0 14px">Pick recipes from the Recipes tab and they show up here with how to make them and what to shop for. Or build a whole week that fits your budget.</p><div class="row wrap"><button class="btn primary" data-a="templates">Build a Week</button><a class="btn" href="#/recipes">Browse Recipes</a></div></div>`}`;
}

function editSheet(id) {
  const e = plan.find(x => x.r === id), r = rec(id); if (!e || !r) return; const m = r.mac || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  openSheet(`<h2 id="sheet-title">${esc(r.name)}</h2><p class="muted small">Servings to make this week</p>
    <div class="row" style="margin:14px 0">${stepper('sv', e.s)}<div class="grow small muted" id="pv"></div></div>
    <div class="row" style="margin-top:16px"><button class="btn primary grow" data-a="saveedit" data-id="${id}">Save</button><button class="btn danger" data-a="deledit" data-id="${id}">Remove</button></div>`);
  const upd = () => { const s = parseFloat($('#sv').value) || 0; $('#pv').innerHTML = `<b>${r0(m.kcal * s / DAYS)}</b> cal a day`; };
  $('#sv').oninput = upd; upd();
}
function logSheet(id) {
  const r = rec(id); if (!r) return; const cur = plan.find(x => x.r === id), m = r.mac;
  openSheet(`<h2 id="sheet-title">${esc(r.name)}</h2><p class="muted small">${m ? 'Per serving: ' + m.kcal + ' kcal · ' + m.protein + ' g protein · ' + m.carbs + ' g carbs · ' + m.fat + ' g fat' : 'No nutrition data'}</p>
    <label class="f" for="sv">Servings to make this week</label>
    <div class="row" style="margin:6px 0 14px">${stepper('sv', cur ? cur.s : DAYS)}<div class="grow small muted" id="pv"></div></div>
    <button class="btn primary block" data-a="dolog" data-id="${id}">${cur ? 'Update Meal Plan' : 'Add to Meal Plan'}</button>`);
  const upd = () => { const s = parseFloat($('#sv').value) || 0; $('#pv').innerHTML = m ? `<b>${r0(m.kcal * s / DAYS)}</b> cal a day` : ''; };
  $('#sv').oninput = upd; upd();
}

// ---------- RECIPES ----------
let rq = '', rcat = 'all', rsort = 'name', reasy = false, rfav = false;
function recipeCard(r) {
  const m = r.mac, fav = favs.includes(r.id);
  return `<article class="rcard"><h3><a href="#/recipe/${r.id}">${esc(r.name)}</a></h3><p class="meta">${esc(catLabel(r.category))} · ${r.time} min · ${r.easy ? 'Easy' : 'Medium'}</p>
    <div class="mac">${m ? `<span><b>${m.kcal}</b> kcal</span><span><b>${m.protein}</b> g protein</span>` : '<span class="muted">No nutrition data</span>'}</div>
    <div class="act"><button class="btn primary sm grow" data-a="log" data-id="${r.id}">+ Add to Meal Plan</button><button class="btn sm fav" data-a="fav" data-id="${r.id}" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${ICON.heart}</button></div></article>`;
}
function recipeList() {
  const q = rq.trim().toLowerCase();
  let L = R().filter(r => (rcat === 'all' || r.category === rcat) && (!reasy || r.easy) && (!rfav || favs.includes(r.id)) && (!q || (r.name + ' ' + r.category + ' ' + r.cuisine + ' ' + r.method).toLowerCase().includes(q)));
  const by = { name: (a, b) => a.name.localeCompare(b.name), protein: (a, b) => (b.mac?.protein || 0) - (a.mac?.protein || 0), lean: (a, b) => ((b.mac?.protein || 0) / (b.mac?.kcal || 1)) - ((a.mac?.protein || 0) / (a.mac?.kcal || 1)), kcal: (a, b) => (a.mac?.kcal || 0) - (b.mac?.kcal || 0), time: (a, b) => a.time - b.time }[rsort];
  L = [...L].sort(by);
  return `<p class="small muted" style="margin:4px 4px 8px" aria-live="polite">${L.length} recipes</p><div class="grid">${L.map(recipeCard).join('')}</div>${L.length ? '' : '<div class="card muted">No recipes match. Try clearing a filter.</div>'}`;
}
function viewRecipes() {
  setBar({ title: 'Recipes' });
  const cats = [...new Set(R().map(r => r.category))].sort((a, b) => catLabel(a).localeCompare(catLabel(b)));
  $('#view').innerHTML = `<input type="search" id="rq" placeholder="Search recipes" aria-label="Search recipes" value="${esc(rq)}" autocomplete="off">
    <div class="chips" style="margin-top:8px" role="group" aria-label="Category"><button class="chip" data-a="rcat" data-c="all" aria-pressed="${rcat === 'all'}">All</button>${cats.map(c => `<button class="chip" data-a="rcat" data-c="${c}" aria-pressed="${rcat === c}">${esc(catLabel(c))}</button>`).join('')}</div>
    <div class="row wrap" style="margin:0 0 6px"><label class="row small" style="gap:6px"><span>Sort</span><select id="rsort" style="width:auto"><option value="name">A to Z</option><option value="protein">Most protein</option><option value="lean">Protein per calorie</option><option value="kcal">Fewest calories</option><option value="time">Quickest</option></select></label>
      <button class="chip" data-a="reasy" aria-pressed="${reasy}">Easy Only</button><button class="chip" data-a="rfav" aria-pressed="${rfav}">Favorites</button></div>
    <div id="rlist">${recipeList()}</div>`;
  $('#rsort').value = rsort;
  $('#rq').oninput = e => { rq = e.target.value; $('#rlist').innerHTML = recipeList(); };
  $('#rsort').onchange = e => { rsort = e.target.value; $('#rlist').innerHTML = recipeList(); };
}

let rvServ = null, rvId = null;
let rvN = null;
function viewRecipe(id, from, n) {
  const back = from === 'plan' ? '#/plan' : '#/recipes';
  const r = rec(id); if (!r) { $('#view').innerHTML = '<div class="card">Recipe not found. <a href="#/recipes">Back to recipes</a></div>'; setBar({ title: 'Recipe', back }); return; }
  if (rvId !== id) { rvId = id; rvServ = r.servings; rvN = null; }
  n = Math.round(+n) || 0; if (n && rvN !== n) { rvN = n; rvServ = n; }
  const box = store.get('container', 22);
  const f = rvServ / r.servings, m = r.mac, fav = favs.includes(id);
  setBar({ title: r.name, back, right: `<button class="icon-btn fav" data-a="fav" data-id="${id}" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${ICON.heart}</button>` });
  $('#view').innerHTML = `<div class="card hero"><h2>${esc(r.name)}</h2><p class="muted small">${esc(catLabel(r.category))}${r.method ? ' · ' + esc(cap(r.method)) : ''}${r.cuisine && r.cuisine !== 'basic' ? ' · ' + esc(cap(r.cuisine)) : ''} · ${r.time} min · ${r.easy ? 'Easy' : 'Medium'}</p>
      ${m ? `<div class="nutri" role="group" aria-label="Per serving"><div><b>${m.kcal}</b><span>kcal</span></div><div><b>${m.protein} g</b><span>Protein</span></div><div><b>${m.carbs} g</b><span>Carbs</span></div><div><b>${m.fat} g</b><span>Fat</span></div></div><p class="tiny muted" style="margin-top:6px">Per serving, estimated from the ingredients.</p>${m.g ? `<p class="tiny muted">One serving is about ${r0(m.g / 28.35)} oz of food${m.g <= (Core.CAP[store.get('container', 22)] || 560) ? ', which fits a ' + store.get('container', 22) + ' oz container.' : ', too much for one ' + store.get('container', 22) + ' oz container. Split it or pick a bigger one.'}</p>` : ''}` : ''}
      <button class="btn primary block" style="margin-top:14px" data-a="log" data-id="${id}">+ Add to Meal Plan</button></div>
    ${rvN ? `<div class="card"><h3 style="font-size:18px">Batch cook ${rvN} ${rvN === 1 ? "serving" : "servings"}</h3><p class="small muted" style="margin-top:4px">The ingredients below are already scaled for ${rvN}. Pack each serving into a ${box} oz container. Use more pans instead of a bigger pan. ${rvN > 4 ? "Food keeps about 4 days in the fridge, so cook about 4 now and the rest midweek, or freeze some." : "Keeps about 4 days in the fridge."}</p></div>` : ''}
    <div class="card"><div class="row wrap" style="justify-content:space-between"><div><h3 style="font-size:18px">Ingredients</h3><p class="small muted">Makes ${rvServ} ${rvServ === 1 ? 'serving' : 'servings'}${f !== 1 ? ' (recipe as written: ' + r.servings + ')' : ''}</p></div>${stepper('rs', rvServ)}</div>
      <ul class="ings" style="margin-top:8px">${r.ing.map(i => `<li>${esc(ingText(i, f))}</li>`).join('')}</ul>${f > 3 || f < 0.5 ? '<p class="small muted">Big change in size: cooking times stay about the same. Use more pans instead of a bigger pan, and taste the seasoning at the end.</p>' : ''}</div>
    <div class="card"><h3 style="font-size:18px">Steps</h3><ol class="steps">${r.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>${r.notes ? `<p class="small muted">${esc(r.notes)}</p>` : ''}</div>`;
}

// ---------- SHOP ----------
const money = x => '$' + Math.round(x), money5 = x => '$' + Math.max(5, Math.round(x / 5) * 5);
const byName = (x, y) => x.name.localeCompare(y.name);
function shopGroups(S) { return { buy: S.list.filter(x => !x.stock), stock: S.list.filter(x => x.stock) }; }
function shopTotal(S) { const sum = L => L.reduce((a, x) => a + (x.cost || 0), 0); return { groceries: sum(S.list.filter(x => !x.stock)), pantry: sum(S.list.filter(x => x.stock)), weekly: S.list.reduce((a, x) => a + (x.cost || 0) * (x.stock ? x.share : 1), 0) }; }
function shopText(S) {
  const { buy, stock } = shopGroups(S), line = x => `- ${Core.title(x.name)}: ${x.pkg || x.txt}`, need = stock.filter(x => !have[x.name]);
  return buy.sort(byName).map(line).join('\n') + (need.length ? '\n\nPANTRY (only if you are out)\n' + need.sort(byName).map(line).join('\n') : '') + (S.free.length ? '\n\nCHECK YOU HAVE\n' + S.free.map(Core.title).join(', ') : '');
}
function shopRow(x, isStock) {
  const id = 'i' + x.name.replace(/\W/g, '_'), on = isStock ? have[x.name] : checked[x.name];
  return `<label class="shop-item ${on ? 'done' : ''}" for="${id}"><input type="checkbox" id="${id}" data-a="${isStock ? 'have' : 'tick'}" data-n="${esc(x.name)}" ${on ? 'checked' : ''} aria-label="${isStock ? 'I have' : 'Got'} ${esc(Core.title(x.name))}"><span class="nm"><b>${esc(Core.title(x.name))}</b><span class="need">${esc(x.pkg || x.txt)}${x.covers ? ' <span class="muted">· covers ' + esc(x.covers.map(Core.title).join(', ')) + '. Fresh works too.</span>' : ''}${isStock && x.weeks ? ' <span class="muted">· lasts about ' + x.weeks + ' weeks</span>' : ''}</span></span>${x.cost != null ? `<span class="price">~${money(x.cost)}</span>` : ''}</label>`;
}
function viewShop() {
  setBar({ title: 'Shopping List' });
  const S = Core.shopping(planEntries(), DAYS), { buy, stock } = shopGroups(S), total = buy.length, done = buy.filter(x => checked[x.name]).length, T = shopTotal(S), budget = store.get('budget', 50);
  const over = T.weekly > budget + 2, hasCost = S.list.length > 0;
  $('#view').innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><b>Weekly budget</b><span class="row" style="gap:4px"><span class="muted">$</span><input type="number" id="bg" value="${budget}" min="1" inputmode="numeric" style="width:88px;text-align:right" aria-label="Weekly budget in dollars"></span></div>
      ${hasCost ? `<div class="row" style="justify-content:space-between;margin-top:10px"><span>Estimated cost</span><b style="font-size:20px;color:${over ? 'var(--orange)' : 'var(--fg)'}">About ${money5(T.weekly)}</b></div>
      <p class="small muted" style="margin-top:4px">${over ? 'That is roughly ' + money5(T.weekly - budget) + ' over your budget.' : 'Within your budget.'}${T.pantry ? ' First trip adds pantry stock (rice, oil, spices) worth roughly ' + money5(T.pantry) + ' that lasts weeks.' : ''}</p>` : ''}
      <button class="btn primary block" style="margin-top:12px" data-a="buildweek">Build a Week for ${money(budget)}</button></div>
    ${hasCost ? `<div class="card flush"><div class="row" style="padding:10px 16px;justify-content:space-between"><span class="small muted">${done} of ${total} in the cart</span><span class="row"><button class="btn sm" data-a="copyshop">${ICON.copy} Copy</button>${navigator.share ? `<button class="btn sm" data-a="shareshop">${ICON.share} Share</button>` : ''}</span></div>${buy.sort(byName).map(x => shopRow(x, false)).join('')}</div>
      ${stock.length ? `<details class="card flush"><summary style="padding:14px 16px;cursor:pointer;font-weight:600">Pantry items (${stock.length}) <span class="small muted" style="font-weight:400">· skip what you have</span></summary>${stock.sort(byName).map(x => shopRow(x, true)).join('')}</details>` : ''}
      ${S.free.length ? `<p class="small muted" style="margin:8px 6px">Also check you have: ${esc(S.free.map(Core.title).join(', '))}</p>` : ''}
      <div class="row wrap" style="margin-top:8px"><button class="btn sm" data-a="clearchecks">Clear Checkmarks</button></div>`
    : `<div class="card"><h2 style="font-size:18px">Nothing to shop for yet</h2><p class="muted" style="margin:6px 0 14px">Add recipes to your Meal Plan and the shopping list builds itself.</p><a class="btn" href="#/recipes">Browse Recipes</a></div>`}`;
}

// ---------- BUILD A WEEK ----------
let builtWeek = null;
const budgetBlock = (budget, id) => `<div class="card" style="margin:10px 0"><p class="small muted" style="margin:0 0 8px">Type what you want to spend on groceries in a week. I pick one breakfast, lunch, dinner and snack that fit it and your calorie and protein goals, all batch cooked.</p><div class="row" style="align-items:flex-end"><div style="width:120px"><label class="f" for="${id}" style="margin-top:0">Weekly budget ($)</label><input type="number" id="${id}" value="${budget}" min="1" inputmode="numeric"></div><button class="btn primary grow" data-a="buildweek">Build My Week</button></div></div>`;
function templateSheet() { openSheet(`<h2 id="sheet-title">Build a Week</h2>${budgetBlock(store.get('budget', 50), 'bud')}`); }
function builtSheet() {
  const b = builtWeek, bud = store.get('budget', 50), box = store.get('container', 22);
  openSheet(`<h2 id="sheet-title">A week for about ${money5(b.cost.weekly)}</h2>
    <p class="small" style="margin-top:4px;${b.fits ? '' : 'color:var(--orange)'}">${b.fits ? 'Fits your ' + money(bud) + ' weekly budget.' : 'Closest I could get to ' + money(bud) + ' with your calorie and protein goals. Raise the budget a little or lower your calories.'}</p>
    <p class="small muted" style="margin-top:4px">About ${r0(b.kcal).toLocaleString()} calories and ${r0(b.protein)} g protein a day. ${b.containers} ${box} oz containers, cooked once.</p>
    ${[['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks']].map(([k, l]) => `<div class="card" style="margin:8px 0"><span class="tiny muted" style="text-transform:uppercase;letter-spacing:.04em">${l}</span><p class="small">${esc(comboName(b.meals[k]))}</p></div>`).join('')}
    <div class="row" style="margin-top:16px"><button class="btn primary grow" data-a="applybuilt">Use This Week</button><button class="btn" data-a="buildweek">Try Another</button></div>`);
}

// ---------- LEARN ----------
const GUIDES = [['Cook', [['chicken', 'Chicken', 'Every cut, every cooking method, doneness'], ['beef', 'Beef', 'Ground beef ratios, cuts, steak doneness'], ['pork', 'Pork', 'Pulled pork, chops, ribs'], ['turkey-and-other-poultry', 'Turkey and Poultry', 'Ground turkey, roasts, duck'], ['fish-and-seafood', 'Fish and Seafood', 'Salmon, cod, shrimp, canned'], ['eggs-dairy-and-plant-protein', 'Eggs, Dairy, Beans and Tofu', 'Boiling, scrambling, lentils, tofu'], ['grains-and-vegetables', 'Rice, Grains and Vegetables', 'Water ratios and roasting times'], ['seasoning-and-sauces', 'Seasoning, Rubs and Sauces', 'Rub recipes, marinades, sauces']]],
  ['Plan and Shop', [['shopping-and-budget', 'Shopping and Budget', 'Cheapest protein, weekly quantities'], ['portions-and-scaling', 'Portions and Scaling', 'Conversions, raw vs cooked, scaling rules'], ['meal-prep-system', 'Meal-Prep Workflow', 'Batch day timeline, storage, reheating'], ['food-safety-and-storage', 'Food Safety and Storage', 'Temperatures, fridge and freezer times']]],
  ['Extras', [['sports-nutrition', 'Sports Nutrition', 'Marathon fueling, hydration, training'], ['supplements', 'Supplements', 'What has evidence and what does not'], ['sources', 'Sources', 'Where the numbers come from']]]];
const GUIDE_TITLE = Object.fromEntries(GUIDES.flatMap(g => g[1]).map(x => [x[0], x[1]]));
let GIDX = null;
const slug = s => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
async function guideIndex() {
  if (GIDX) return GIDX; GIDX = [];
  await Promise.all(GUIDES.flatMap(g => g[1]).map(async ([f]) => {
    try {
      const txt = await (await fetch(`guides/${f}.md`)).text(); let cur = { g: f, h: GUIDE_TITLE[f], s: '', t: '' };
      for (const line of txt.split('\n')) { const m = line.match(/^(#{1,3})\s+(.*)$/); if (m) { if (cur.t.trim() || cur.s) GIDX.push(cur); cur = { g: f, h: m[2].replace(/[*`]/g, ''), s: slug(m[2].replace(/[*`]/g, '')), t: '' }; } else cur.t += line.replace(/[|*`#>-]/g, ' ') + ' '; }
      GIDX.push(cur);
    } catch (e) {}
  }));
  return GIDX;
}
function searchGuides(q) {
  const toks = q.toLowerCase().split(/\s+/).filter(t => t.length > 1); if (!toks.length) return [];
  return GIDX.map(x => { const h = x.h.toLowerCase(), t = x.t.toLowerCase(); let sc = 0; for (const k of toks) { if (h.includes(k)) sc += 5; else if (t.includes(k)) sc += 1; else return null; } return { x, sc }; }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 12);
}
function snippet(x, toks) {
  const t = x.t.replace(/\s+/g, ' ').trim(); const low = t.toLowerCase(); let i = -1; for (const k of toks) { i = low.indexOf(k); if (i >= 0) break; }
  const s = t.slice(Math.max(0, i - 50), Math.max(0, i - 50) + 150); let out = esc(s);
  toks.forEach(k => { out = out.replace(new RegExp('(' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); }); return out;
}
const EQUIP = ['2 metal sheet pans (half-size) and foil or parchment', 'Instant-read thermometer (about $15)', 'Chef\'s knife (8 in) and a large cutting board', 'Pot with a lid (rice, soup) and a large skillet', '8 to 10 food containers with lids', 'Measuring cups and spoons (a kitchen scale is a bonus)'];
function viewLearn(guide, sec) {
  if (guide && GUIDE_TITLE[guide]) return viewGuide(guide, sec);
  setBar({ title: 'Learn' });
  const eq = store.get('equip', {});
  $('#view').innerHTML = `<div class="card" style="margin-top:0"><label class="f" for="lq" style="margin-top:0">Search cooking help</label><input type="search" id="lq" placeholder="chicken thigh temperature, rice ratio, freezer…" autocomplete="off"><div id="lres"></div></div>
    <div id="lmain">
    <h2 class="sec">Quick Answers</h2>
    <div class="qa">
      <div class="card"><h3>Safe Temperatures (°F)</h3><table><tr><td>Chicken and turkey</td><td>165</td></tr><tr><td>Ground beef, pork</td><td>160</td></tr><tr><td>Steaks, chops, roasts</td><td>145 + 3 min rest</td></tr><tr><td>Fish</td><td>145</td></tr><tr><td>Egg dishes</td><td>160</td></tr><tr><td>Leftovers</td><td>165</td></tr></table><p class="tiny muted" style="margin-top:6px">Dark meat (thigh, leg) tastes best at 175. <a href="#/learn/chicken">Chicken guide</a></p></div>
      <div class="card"><h3>How Long It Keeps</h3><table><tr><td>Cooked food, fridge</td><td>3–4 days</td></tr><tr><td>Raw chicken, fridge</td><td>1–2 days</td></tr><tr><td>Raw ground meat, fridge</td><td>1–2 days</td></tr><tr><td>Raw steaks, roasts</td><td>3–5 days</td></tr><tr><td>Cooked food, freezer</td><td>2–4 months</td></tr><tr><td>Hard-boiled eggs</td><td>7 days</td></tr></table><p class="tiny muted" style="margin-top:6px">Chill within 2 hours. <a href="#/learn/food-safety-and-storage">Storage guide</a></p></div>
      <div class="card"><h3>Measuring</h3><table><tr><td>3 tsp</td><td>1 tbsp</td></tr><tr><td>16 tbsp</td><td>1 cup</td></tr><tr><td>1 cup</td><td>8 fl oz · 240 mL</td></tr><tr><td>1 lb</td><td>16 oz · 454 g</td></tr><tr><td>Oven 350 / 400 / 425 / 450 °F</td><td>175 / 200 / 220 / 230 °C</td></tr></table><p class="tiny muted" style="margin-top:6px"><a href="#/learn/portions-and-scaling">Portions and scaling</a></p></div>
      <div class="card"><h3>Basics</h3><table><tr><td>Rice: water to rice</td><td>1.5 : 1</td></tr><tr><td>1 cup dry rice makes</td><td>3 cups</td></tr><tr><td>Salt per lb of raw meat</td><td>¾ tsp</td></tr><tr><td>Thaw in fridge</td><td>24 h per 4–5 lb</td></tr><tr><td>Rest cooked meat</td><td>5–10 min</td></tr></table><p class="tiny muted" style="margin-top:6px"><a href="#/learn/grains-and-vegetables">Rice and vegetables</a></p></div>
    </div>
    <h2 class="sec">Set Up Your Kitchen</h2>
    <div class="card">${EQUIP.map((t, i) => `<div class="check"><input type="checkbox" id="eq${i}" data-a="equip" data-i="${i}" ${eq[i] ? 'checked' : ''}><label for="eq${i}">${esc(t)}</label></div>`).join('')}
      <p class="small muted" style="margin-top:8px">Three safety rules: use the thermometer, do not wash raw chicken, and refrigerate cooked food within 2 hours.</p>
      <button class="btn primary block" style="margin-top:12px" data-a="templates">Start With a Ready-Made Week</button></div>
    <h2 class="sec">Guides</h2>
    ${GUIDES.map(([g, items]) => `<h3 class="tiny muted" style="margin:14px 6px 4px;text-transform:uppercase;letter-spacing:.04em">${g}</h3><div class="card flush">${items.map(([f, t, d]) => `<a class="gcard" href="#/learn/${f}"><div><b>${t}</b><span>${d}</span></div><span class="chev">${ICON.next}</span></a>`).join('')}</div>`).join('')}
    </div>`;
  $('#lq').oninput = async e => {
    const q = e.target.value.trim(); const main = $('#lmain'), res = $('#lres');
    if (q.length < 2) { res.innerHTML = ''; main.style.display = ''; return; }
    main.style.display = 'none'; res.innerHTML = '<p class="muted small" style="margin-top:10px">Searching…</p>'; await guideIndex();
    const toks = q.toLowerCase().split(/\s+/).filter(t => t.length > 1), R2 = searchGuides(q);
    res.innerHTML = R2.length ? `<div class="card flush" style="margin:12px -16px -16px;border-radius:0 0 14px 14px;border-width:1px 0 0">${R2.map(({ x }) => `<a class="result" href="#/learn/${x.g}${x.s ? '/' + x.s : ''}"><span class="where">${esc(GUIDE_TITLE[x.g])}</span><b style="display:block">${esc(x.h)}</b><span class="small muted">${snippet(x, toks)}</span></a>`).join('')}</div>` : '<p class="muted small" style="margin-top:10px">No results. Try a simpler word like "chicken" or "rice".</p>';
  };
}
async function viewGuide(g, sec) {
  setBar({ title: GUIDE_TITLE[g], back: '#/learn' });
  $('#view').innerHTML = '<div class="card muted">Loading…</div>';
  try {
    const txt = await (await fetch(`guides/${g}.md`)).text(); const html = window.marked ? marked.parse(txt) : '<pre>' + esc(txt) + '</pre>';
    $('#view').innerHTML = '<div class="toc" id="toc"></div><div class="card md" id="gbody"></div>'; const body = $('#gbody'); body.innerHTML = html;
    const heads = [...body.querySelectorAll('h2,h3')]; heads.forEach(h => { h.id = slug(h.textContent); });
    const h2s = heads.filter(h => h.tagName === 'H2');
    $('#toc').innerHTML = h2s.length ? `<details><summary>On this page (${h2s.length})</summary><ol>${h2s.map(h => `<li><a href="#/learn/${g}/${h.id}" data-jump="${h.id}">${esc(h.textContent)}</a></li>`).join('')}</ol></details>` : '';
    body.querySelectorAll('a').forEach(a => { const m = (a.getAttribute('href') || '').match(/^(?:\.\/)?([\w-]+)\.md$/); if (m && GUIDE_TITLE[m[1]]) a.setAttribute('href', '#/learn/' + m[1]); });
    if (sec) { const t = document.getElementById(sec); if (t) setTimeout(() => t.scrollIntoView(), 30); } else window.scrollTo(0, 0);
  } catch (e) { $('#view').innerHTML = '<div class="card err">Could not load this guide.</div>'; }
}

// ---------- SETTINGS ----------
const PROFILE0 = { sex: 'female', age: 30, ft: 5, inch: 6, lb: 150, activity: 1.375, goal: 'keep' };
function suggestHtml() {
  const g = Core.calcGoals(store.get('profile', PROFILE0));
  return `<div class="suggest"><div><b>${g.kcal.toLocaleString()} calories a day</b><span class="small muted">Protein ${g.protein} g · Carbs ${g.carbs} g · Fat ${g.fat} g<br>Maintenance is about ${g.tdee.toLocaleString()} calories.</span></div><button class="btn primary sm" data-a="usegoals" data-k="${g.kcal}" data-p="${g.protein}" data-c="${g.carbs}" data-f="${g.fat}">Use These</button></div>`;
}
const setRow = (label, hint, control) => `<div class="set-row"><div class="lbl"><b>${label}</b>${hint ? `<span class="small muted">${hint}</span>` : ''}</div>${control}</div>`;
function viewMe() {
  setBar({ title: 'Settings' });
  const p = store.get('profile', PROFILE0), sel = (id, opts, cur) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${cur == v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const num = (id, v, w = 96) => `<input type="number" id="${id}" value="${v}" inputmode="numeric" style="width:${w}px;text-align:right">`;
  $('#view').innerHTML = `<h2 style="font-size:24px;margin:4px 4px 0">Settings</h2>
    <h2 class="sec">Daily Goals</h2>
    <div class="card flush">
      ${setRow('Calories', '', num('gk', goals.kcal))}${setRow('Protein (g)', '', num('gp', goals.protein))}${setRow('Carbs (g)', '', num('gc', goals.carbs))}${setRow('Fat (g)', '', num('gf', goals.fat))}
    </div>
    <p class="tiny muted" style="margin:6px 8px">Changes save as you type. The meal plan compares your planned meals against these.</p>
    <h2 class="sec">Work Out My Goals</h2>
    <div class="card flush">
      ${setRow('Sex', '', sel('ps', [['female', 'Female'], ['male', 'Male']], p.sex))}${setRow('Age', '', num('pa', p.age))}
      ${setRow('Height', 'feet and inches', `<span class="row" style="gap:6px">${num('pf', p.ft, 64)}<span class="muted">ft</span>${num('pi', p.inch, 64)}<span class="muted">in</span></span>`)}
      ${setRow('Weight (lb)', '', num('pw', p.lb))}
      ${setRow('Activity', '', sel('pact', [[1.2, 'Mostly sitting'], [1.375, 'Light (1–3 workouts)'], [1.55, 'Moderate (3–5)'], [1.725, 'Very active (6–7)']], p.activity))}
      ${setRow('Goal', '', sel('pg', [['lose1', 'Lose about 1 lb a week'], ['lose05', 'Lose about ½ lb a week'], ['keep', 'Maintain weight'], ['gain05', 'Gain about ½ lb a week']], p.goal))}
      <div id="calcout" style="padding:14px 16px;border-top:1px solid var(--line)">${suggestHtml()}</div>
    </div>
    <p class="tiny muted" style="margin:6px 8px">Mifflin-St Jeor estimate. A starting point, not medical advice.</p>
    <h2 class="sec">Meal Prep</h2>
    <div class="card flush">${setRow('Weekly grocery budget ($)', 'Used to build a week of meals that fits', num('bgs', store.get('budget', 50)))}${setRow('Container size', 'Deli containers you pack meals in', sel('cts', [[16, '16 oz (half quart)'], [22, '22 oz']], store.get('container', 22)))}</div>
    <h2 class="sec">Appearance</h2>
    <div class="card flush">${setRow('Theme', '', `<span class="chips" style="padding:0">${[['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button class="chip" data-a="theme" data-v="${v}" aria-pressed="${store.get('theme', 'light') === v}">${l}</button>`).join('')}</span>`)}</div>
    <h2 class="sec">Your Data</h2>
    <div class="card flush">
      <div class="set-row"><div class="lbl"><b>Everything is saved on this device only</b><span class="small muted">Back it up before clearing your browser or changing phones.</span></div></div>
      <div class="row wrap" style="padding:0 16px 14px"><button class="btn" data-a="export">Download Backup</button><label class="btn" for="imp" style="cursor:pointer">Restore Backup</label><input type="file" id="imp" accept="application/json" style="display:none"></div>
      <div style="padding:0 16px 14px"><button class="btn danger block" data-a="reset">Erase All My Data</button></div>
    </div>
    <h2 class="sec">About</h2>
    <div class="card"><p class="small muted">Recipe calories and macros are calculated from the ingredients using USDA values. See <a href="#/learn/sources">Sources</a>. Prices are rough US grocery averages. Add this page to your Home Screen to use it like an app, even offline.</p></div>`;
  $('#imp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); if (d.plan) plan = d.plan; if (d.goals) goals = d.goals; if (d.favs) favs = d.favs; if (d.checked) checked = d.checked; if (d.profile) store.set('profile', d.profile); store.set('plan', plan); store.set('goals', goals); store.set('favs', favs); store.set('checked', checked); toast('Backup restored'); viewMe(); } catch (er) { toast('That file is not a valid backup'); } };
}

// ---------- events ----------
const readProfile = () => ({ sex: $('#ps').value, age: +$('#pa').value || 30, ft: +$('#pf').value || 5, inch: +$('#pi').value || 0, lb: +$('#pw').value || 150, activity: +$('#pact').value, goal: $('#pg').value });
const A = {
  edit: t => editSheet(t.dataset.id),
  saveedit: t => { const e = plan.find(x => x.r === t.dataset.id), s = parseFloat($('#sv').value); if (!e) return; if (!(s > 0)) return toast('Enter a servings amount above 0'); e.s = Math.round(s); delete e.c; savePlan(); closeSheet(); render(); },
  deledit: t => { const snap = JSON.stringify(plan), id = t.dataset.id; plan = plan.filter(x => x.r !== id); savePlan(); closeSheet(); render(); toast('Removed ' + entryName(id), () => { plan = JSON.parse(snap); savePlan(); render(); }); },
  clearplan: () => { const snap = JSON.stringify(plan); plan = []; savePlan(); render(); toast('Meal plan cleared', () => { plan = JSON.parse(snap); savePlan(); render(); }); },
  log: t => logSheet(t.dataset.id),
  dolog: t => {
    const id = t.dataset.id, s = parseFloat($('#sv').value); if (!(s > 0)) return toast('Enter a servings amount above 0');
    const e = plan.find(x => x.r === id); if (e) { e.s = Math.round(s); delete e.c; } else plan.push({ r: id, s: Math.round(s) });
    savePlan(); closeSheet(); render(); toast('In your Meal Plan', () => { plan = plan.filter(x => x.r !== id); savePlan(); render(); });
  },
  fav: t => { const id = t.dataset.id; favs = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id]; store.set('favs', favs); render(); },
  rcat: t => { rcat = t.dataset.c; viewRecipes(); }, reasy: () => { reasy = !reasy; viewRecipes(); }, rfav: () => { rfav = !rfav; viewRecipes(); },
  have: t => { have[t.dataset.n] = t.checked; if (!t.checked) delete have[t.dataset.n]; store.set('have', have); const y = scrollY; viewShop(); scrollTo(0, y); },
  tick: t => { checked[t.dataset.n] = t.checked; if (!t.checked) delete checked[t.dataset.n]; store.set('checked', checked); const y = scrollY; viewShop(); scrollTo(0, y); },
  clearchecks: () => { checked = {}; store.set('checked', checked); viewShop(); },
  copyshop: () => { const txt = shopText(Core.shopping(planEntries(), DAYS)); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Shopping list copied'), () => toast('Could not copy')); },
  shareshop: () => navigator.share({ title: 'Shopping list', text: shopText(Core.shopping(planEntries(), DAYS)) }).catch(() => {}),
  templates: () => templateSheet(),
  buildweek: t => { const c = t.closest('.card'), el = (c && c.querySelector('input[type=number]')) || $('#bg'); if (el) store.set('budget', Math.max(1, +el.value || 50)); openSheet('<h2 id="sheet-title">Building your week…</h2><p class="muted small">Picking meals that fit your budget and goals.</p>'); setTimeout(() => { builtWeek = Core.buildPlan(store.get('budget', 50), goals, Date.now(), store.get('container', 22)); builtSheet(); }, 30); },
  applybuilt: () => { const snap = JSON.stringify(plan); plan = builtWeek.items.map(e => ({ ...e })); savePlan(); closeSheet(); location.hash = '#/plan'; render(); toast('Your Meal Plan is set', () => { plan = JSON.parse(snap); savePlan(); render(); }); },
  equip: t => { const e = store.get('equip', {}); e[t.dataset.i] = t.checked; store.set('equip', e); },
  usegoals: t => { goals = { kcal: +t.dataset.k, protein: +t.dataset.p, carbs: +t.dataset.c, fat: +t.dataset.f }; store.set('goals', goals); viewMe(); toast('Goals updated'); },
  theme: t => { const v = t.dataset.v; store.set('theme', v); document.documentElement.dataset.theme = v; document.querySelector('meta[name=theme-color]').content = v === 'dark' ? '#0e131b' : '#f3f5f9'; viewMe(); },
  export: () => download('meal-plan-backup.json', JSON.stringify({ app: 'meal-plan', plan, goals, favs, checked, profile: store.get('profile', null), exported: new Date().toISOString() }, null, 1)),
  reset: () => { if (confirm('Erase your meal plan, goals and favorites on this device? This cannot be undone.')) { ['plan', 'diary', 'goals', 'checked', 'favs', 'recent', 'equip', 'profile'].forEach(k => { try { localStorage.removeItem('cb.' + k); } catch (e) {} }); plan = []; goals = { kcal: 2000, protein: 150, carbs: 225, fat: 65 }; checked = {}; favs = []; render(); toast('All data erased'); } }
};
document.addEventListener('click', e => {
  const st = e.target.closest('[data-step]');
  if (st) { const inp = document.getElementById(st.dataset.for), min = parseFloat(inp.min) || 0; inp.value = Math.max(min, Math.round((parseFloat(inp.value || 0) + parseFloat(st.dataset.step)) * 100) / 100); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); return; }
  const t = e.target.closest('[data-a]'); if (!t || t.tagName === 'INPUT') return;
  if (A[t.dataset.a]) A[t.dataset.a](t);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.a === 'tick') return A.tick(t);
  if (t.dataset && t.dataset.a === 'equip') return A.equip(t);
  if (t.dataset && t.dataset.a === 'have') return A.have(t);
  if (t.id === 'rs') { rvServ = Math.max(1, Math.round(parseFloat(t.value)) || 1); const y = scrollY; viewRecipe(rvId); scrollTo(0, y); }
  if (t.id === 'cts') store.set('container', +t.value);
  if (t.id === 'bg' || t.id === 'bgs' || t.id === 'bud' || t.id === 'bud2') { store.set('budget', Math.max(1, +t.value || 50)); if (t.id === 'bg') viewShop(); }
  if (['gk', 'gp', 'gc', 'gf'].includes(t.id)) { goals = { kcal: +$('#gk').value || 2000, protein: +$('#gp').value || 0, carbs: +$('#gc').value || 0, fat: +$('#gf').value || 0 }; store.set('goals', goals); }
  if (['ps', 'pa', 'pf', 'pi', 'pw', 'pact', 'pg'].includes(t.id)) { store.set('profile', readProfile()); $('#calcout').innerHTML = suggestHtml(); }
});

// ---------- router ----------
function render() {
  const p = (location.hash || '#/plan').replace(/^#\/?/, '').split('/').map(decodeURIComponent), root = p[0] || 'plan';
  if (root === 'diary') { location.replace('#/plan'); return; } if (root === 'add') { location.replace('#/recipes'); return; }
  if (root !== 'recipe' || !p[3]) rvN = null; if (root !== 'recipe') rvId = null;
  const map = { plan: viewPlan, recipes: viewRecipes, recipe: () => viewRecipe(p[1], p[2], p[3]), shop: viewShop, learn: () => viewLearn(p[1], p[2]), me: viewMe };
  const navRoot = { recipe: p[2] === 'plan' ? 'plan' : 'recipes' }[root] || root;
  if (!map[root]) { location.hash = '#/plan'; return; }
  setNav(navRoot); map[root]();
  if (!(root === 'learn' && p[2])) { /* guides scroll themselves */ }
}
let lastHash = null;
window.addEventListener('hashchange', () => {
  const same = lastHash && lastHash.split('/')[1] === location.hash.split('/')[1] && location.hash.split('/')[1] === 'learn';
  lastHash = location.hash; closeSheet(); render(); if (!same) window.scrollTo(0, 0); $('#view').focus({ preventScroll: true });
});

(async function start() {
  setNav('plan'); $('#view').innerHTML = '<div class="card muted">Loading…</div>';
  try { await Core.init(); } catch (e) { $('#view').innerHTML = `<div class="card err">Could not load data (${esc(e.message)}). Open this page from the website or a local web server; browsers block loading data files straight from disk.</div>`; return; }
  lastHash = location.hash; render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
