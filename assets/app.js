'use strict';
/* Meal Diary app: screens, routing, storage. Logic lives in core.js. */
const { esc, cap, catLabel, fmt, ingText, MEALS, ymd, parseYmd, addDays } = Core;
const $ = s => document.querySelector(s);

// ---------- icons ----------
const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICON = {
  back: svg('<path d="M15 18l-6-6 6-6"/>'), next: svg('<path d="M9 18l6-6-6-6"/>'), cal: svg('<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>'),
  heart: svg('<path d="M12 20.5s-7.5-4.7-9.6-9.3C.9 7.900 3 4.500 6.500 4.500c2 0 3.500 1 5.500 3 2-2 3.500-3 5.500-3 3.500 0 5.600 3.400 4.100 6.700-2.100 4.600-9.600 9.300-9.600 9.300z"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'), share: svg('<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'),
  diary: svg('<path d="M4 4.500A1.500 1.500 0 0 1 5.500 3H20v16H5.500A1.500 1.500 0 0 0 4 20.500zM4 20.500A1.500 1.500 0 0 0 5.500 22H20v-3M9 8h7M9 12h5"/>'),
  recipes: svg('<path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M9 3v6M17 3c-2 1.500-3 4-3 7 0 1.500 1 2.500 3 3v8"/>'),
  shop: svg('<circle cx="9" cy="20" r="1.500"/><circle cx="18" cy="20" r="1.500"/><path d="M2.500 3h3l2.500 12.500h11L21 7H6.500"/>'),
  learn: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2V16h5v-.1c0-.8.4-1.500 1-2A6 6 0 0 0 12 3z"/>'),
  me: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'), x: svg('<path d="M6 6l12 12M18 6L6 18"/>')
};
const NAV = [['diary', 'Diary', ICON.diary], ['recipes', 'Recipes', ICON.recipes], ['shop', 'Shop', ICON.shop], ['learn', 'Learn', ICON.learn], ['me', 'Me', ICON.me]];

// ---------- storage ----------
const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem('cb.' + k)); return v ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('cb.' + k, JSON.stringify(v)); } catch (e) {} } };
let diary = store.get('diary', {}), goals = store.get('goals', { kcal: 2000, protein: 150, carbs: 225, fat: 65 });
let checked = store.get('checked', {}), favs = store.get('favs', []), recent = store.get('recent', []);
const saveDiary = () => store.set('diary', diary);
const today = () => ymd(new Date());
let selDate = today();
const uid = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const ALLMEALS = [...MEALS, ['prep', 'Batch Prep']];
const mealName = k => (ALLMEALS.find(m => m[0] === k) || [0, cap(k)])[1];
function dayOf(date) { const d = diary[date] = diary[date] || {}; ALLMEALS.forEach(([k]) => d[k] = d[k] || []); return d; }
function tidy(date) { const d = diary[date]; if (d && ALLMEALS.every(([k]) => !(d[k] || []).length)) delete diary[date]; }
function addEntry(date, meal, e) {
  const en = { id: uid(), s: e.s }; if (e.r) en.r = e.r; if (e.q) en.q = e.q;
  dayOf(date)[meal].push(en); saveDiary();
  if (e.r) { recent = [e.r, ...recent.filter(x => x !== e.r)].slice(0, 20); store.set('recent', recent); }
  return en.id;
}
function removeEntry(date, meal, id) { const d = diary[date]; if (!d) return; d[meal] = d[meal].filter(e => e.id !== id); tidy(date); saveDiary(); }
const R = () => Core.recipes;
const rec = id => Core.byId(id);
const entryName = e => e.q ? e.q.name : (rec(e.r) ? rec(e.r).name : 'Removed recipe');
const svText = s => (s === 1 ? '1 serving' : s + ' servings');
const r0 = n => Math.round(n);

// ---------- ui helpers ----------
function setBar({ title, back, right = '' }) {
  $('#barin').innerHTML = (back ? `<a class="icon-btn back" href="${back}" aria-label="Back">${ICON.back}</a>` : '') + `<h1>${esc(title)}</h1>${right}`;
  document.title = title + ' · Meal Diary';
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
function guessMeal(r) {
  if (!r) return 'lunch'; if (r.category === 'meal prep') return 'prep'; if (r.category === 'breakfast') return 'breakfast'; if (r.category === 'snacks') return 'snacks';
  const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : 'dinner';
}
const mealOptions = sel => ALLMEALS.map(([k, l]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${l}</option>`).join('');

// ---------- DIARY ----------
function dayLabel(date) {
  const t = today(); if (date === t) return 'Today'; if (date === addDays(t, -1)) return 'Yesterday'; if (date === addDays(t, 1)) return 'Tomorrow';
  return parseYmd(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function ring(pct, over) {
  const R0 = 62, C = 2 * Math.PI * R0, d = Math.min(1, Math.max(0, pct)) * C;
  return `<svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true"><circle cx="75" cy="75" r="${R0}" fill="none" stroke="var(--track)" stroke-width="13"/><circle cx="75" cy="75" r="${R0}" fill="none" stroke="${over ? 'var(--orange)' : 'var(--blue)'}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${d} ${C}"/></svg>`;
}
function macroRow(name, have, goal) {
  const pct = goal ? Math.min(100, have / goal * 100) : 0, over = name !== 'Protein' && goal && have > goal * 1.02;
  return `<div class="macro"><div class="top"><span>${name}</span><span>${r0(have)} / ${goal} g</span></div><div class="pbar ${over ? 'over' : ''}" role="img" aria-label="${name} ${r0(have)} of ${goal} grams"><i style="width:${pct}%"></i></div></div>`;
}
function viewDiary(date) {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) selDate = date;
  const day = diary[selDate] || {}, T = Core.dayTotals(day), rem = goals.kcal - T.kcal, over = rem < 0;
  setBar({ title: 'Diary', right: `<button class="icon-btn" data-a="pickdate" aria-label="Choose a date">${ICON.cal}</button>` });
  const dow = parseYmd(selDate).getDay(), start = addDays(selDate, -dow);
  const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(start, i), t = Core.dayTotals(diary[d]), has = t.kcal > 0 || ALLMEALS.some(([k]) => (diary[d] && diary[d][k] || []).length);
    return `<button data-a="goto" data-d="${d}" ${d === selDate ? 'aria-current="date"' : ''} aria-label="${dayLabel(d)}">${['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}<b>${parseYmd(d).getDate()}</b><span class="dot ${has ? (t.kcal > goals.kcal * 1.05 ? 'over' : 'on') : ''}"></span></button>`; }).join('');
  const meals = ALLMEALS.map(([k, label]) => {
    const list = day[k] || [], t = Core.sumMeal(list), isPrep = k === 'prep';
    const y = diary[addDays(selDate, -1)];
    const canCopy = !list.length && y && (y[k] || []).length;
    return `<section class="card flush meal" aria-label="${label}"><div class="meal-h"><h3>${label}</h3><span>${isPrep ? '<span class="muted small">not counted</span>' : r0(t.kcal)}</span></div>
      ${list.length ? list.map(e => { const m = Core.entryMac(e); return `<button class="entry" data-a="edit" data-m="${k}" data-id="${e.id}"><span class="nm">${esc(entryName(e))}<span class="sub">${svText(e.s)}${isPrep ? '' : ' · ' + r0(m.protein) + ' g protein'}</span></span>${isPrep ? '' : `<span class="kc">${r0(m.kcal)}</span>`}</button>`; }).join('') : `<div class="empty">${isPrep ? 'Plan cooking day here (chicken, rice, and so on). It goes on your shopping list.' : 'Nothing logged yet'}</div>`}
      <div class="meal-f"><a class="btn link" href="#/add/${k}/${selDate}">+ Add ${isPrep ? 'Batch Recipe' : 'Food'}</a>${canCopy ? `<button class="btn link" data-a="copyprev" data-m="${k}">Copy Yesterday</button>` : ''}</div></section>`;
  }).join('');
  $('#view').innerHTML = `
    <div class="datebar"><button class="icon-btn" data-a="goto" data-d="${addDays(selDate, -1)}" aria-label="Previous day">${ICON.back}</button><button class="label" data-a="pickdate">${dayLabel(selDate)}</button><button class="icon-btn" data-a="goto" data-d="${addDays(selDate, 1)}" aria-label="Next day">${ICON.next}</button></div>
    <div class="week" role="group" aria-label="This week">${week}</div>
    <div class="card"><h2 class="tiny muted" style="text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Calories Remaining</h2>
      <div class="summary"><div class="ring">${ring(goals.kcal ? T.kcal / goals.kcal : 0, over)}<div class="mid"><b>${over ? '+' + r0(-rem) : r0(rem)}</b><span>${over ? 'Over' : 'Remaining'}</span></div></div>
      <div>${macroRow('Carbs', T.carbs, goals.carbs)}${macroRow('Protein', T.protein, goals.protein)}${macroRow('Fat', T.fat, goals.fat)}</div></div>
      <div class="eq"><div><b>${goals.kcal}</b><span>Goal</span></div><div>−</div><div><b>${r0(T.kcal)}</b><span>Food</span></div><div>=</div><div><b>${r0(rem)}</b><span>Remaining</span></div></div></div>
    ${meals}
    <p class="tiny muted" style="margin:6px 8px">Calories and macros are estimated from recipe ingredients. Set your goals on the <a href="#/me">Me</a> tab.</p>`;
}

function editSheet(date, meal, id) {
  const e = (diary[date] && diary[date][meal] || []).find(x => x.id === id); if (!e) return;
  const isPrep = meal === 'prep', step = isPrep ? 1 : 0.5;
  const m1 = e.q ? { kcal: e.q.kcal || 0, protein: e.q.protein || 0, carbs: e.q.carbs || 0, fat: e.q.fat || 0 } : (rec(e.r) && rec(e.r).mac) || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const per = e.r && rec(e.r) ? rec(e.r).servings : 1;
  openSheet(`<h2 id="sheet-title">${esc(entryName(e))}</h2><p class="muted small">${isPrep ? 'How many servings to cook (drives the shopping list)' : 'Servings you ate'}</p>
    <div class="row" style="margin:14px 0">${stepper('sv', e.s, step, step)}<div class="grow small muted" id="pv"></div></div>
    <label class="f" for="mv">Meal</label><select id="mv">${mealOptions(meal)}</select>
    <div class="row" style="margin-top:16px"><button class="btn primary grow" data-a="saveedit" data-date="${date}" data-m="${meal}" data-id="${id}">Save</button><button class="btn danger" data-a="deledit" data-date="${date}" data-m="${meal}" data-id="${id}">Delete</button></div>`);
  const upd = () => { const s = parseFloat($('#sv').value) || 0; $('#pv').innerHTML = isPrep ? `Makes ${r0(s)} servings` : `<b>${r0(m1.kcal * s)}</b> kcal · ${r0(m1.protein * s)} g protein · ${r0(m1.carbs * s)} g carbs · ${r0(m1.fat * s)} g fat`; };
  $('#sv').oninput = upd; upd(); void per;
}

// ---------- ADD FOOD ----------
let addTab = 'all', addQuery = '';
function foodRow(r, meal) {
  const m = r.mac, prep = r.category === 'meal prep';
  return `<div class="list-row"><button class="nm" style="border:0;background:none;text-align:left;padding:0" data-a="pick" data-id="${r.id}" data-m="${meal}">${esc(r.name)}<span class="sub">${prep ? 'Batch recipe · ' + r.servings + ' servings' : '1 serving'}${m ? ' · ' + m.kcal + ' kcal · ' + m.protein + ' g protein' : ''}</span></button><button class="add-btn" data-a="quick1" data-id="${r.id}" data-m="${meal}" aria-label="Add one serving of ${esc(r.name)}">+</button></div>`;
}
function addList(meal) {
  const q = addQuery.trim().toLowerCase(), prepOnly = meal === 'prep';
  let L = R().filter(r => prepOnly ? r.category === 'meal prep' : true);
  if (addTab === 'recent') L = recent.map(rec).filter(Boolean).filter(r => !prepOnly || r.category === 'meal prep');
  if (addTab === 'fav') L = L.filter(r => favs.includes(r.id));
  if (q) L = L.filter(r => (r.name + ' ' + r.category + ' ' + r.cuisine + ' ' + r.method).toLowerCase().includes(q));
  const empty = addTab === 'recent' ? 'Foods you log show up here.' : addTab === 'fav' ? 'Tap the heart on a recipe to save it here.' : 'No matches.';
  return L.length ? L.slice(0, 80).map(r => foodRow(r, meal)).join('') + (L.length > 80 ? '<div class="empty">Keep typing to narrow it down.</div>' : '') : `<div class="empty" style="padding:16px">${empty}</div>`;
}
function viewAdd(meal, date) {
  meal = ALLMEALS.some(m => m[0] === meal) ? meal : 'lunch'; if (date) selDate = date;
  setBar({ title: 'Add to ' + mealName(meal), back: `#/diary/${selDate}` });
  const tabs = [['all', 'All'], ['recent', 'Recent'], ['fav', 'Favorites'], ['quick', 'Quick Add']];
  $('#view').innerHTML = `<div class="card" style="margin-top:0"><label class="f" for="aq" style="margin-top:0">Search recipes</label><input type="search" id="aq" placeholder="chicken, rice, salmon…" value="${esc(addQuery)}" autocomplete="off"></div>
    <div class="chips" role="group" aria-label="Show">${tabs.map(([k, l]) => `<button class="chip" data-a="addtab" data-t="${k}" aria-pressed="${addTab === k}">${l}</button>`).join('')}</div>
    <div id="alist"></div>`;
  const draw = () => {
    if (addTab === 'quick') {
      $('#alist').innerHTML = `<form class="card" id="qf"><h2 style="font-size:17px">Quick Add</h2><p class="muted small">Log calories and macros for anything not in the recipe list.</p>
        <label class="f" for="qn">Name</label><input type="text" id="qn" placeholder="Restaurant lunch" required>
        <div class="row wrap"><div class="grow"><label class="f" for="qk">Calories</label><input type="number" id="qk" min="0" inputmode="numeric" required></div><div class="grow"><label class="f" for="qp">Protein g</label><input type="number" id="qp" min="0" inputmode="numeric"></div></div>
        <div class="row wrap"><div class="grow"><label class="f" for="qc">Carbs g</label><input type="number" id="qc" min="0" inputmode="numeric"></div><div class="grow"><label class="f" for="qf2">Fat g</label><input type="number" id="qf2" min="0" inputmode="numeric"></div></div>
        <button class="btn primary block" style="margin-top:14px" type="submit">Add to ${mealName(meal)}</button></form>`;
      $('#qf').onsubmit = ev => { ev.preventDefault(); addEntry(selDate, meal, { s: 1, q: { name: $('#qn').value.trim() || 'Quick add', kcal: +$('#qk').value || 0, protein: +$('#qp').value || 0, carbs: +$('#qc').value || 0, fat: +$('#qf2').value || 0 } }); location.hash = `#/diary/${selDate}`; };
    } else $('#alist').innerHTML = `<div class="card flush">${addList(meal)}</div>`;
  };
  draw();
  $('#aq').oninput = e => { addQuery = e.target.value; if (addTab === 'quick') { addTab = 'all'; viewAdd(meal, selDate); $('#aq').focus(); return; } draw(); };
  $('#view').dataset.meal = meal;
}
function logSheet(id, meal, date) {
  const r = rec(id); if (!r) return; const prep = r.category === 'meal prep'; meal = meal || guessMeal(r); if (prep) meal = 'prep';
  const step = prep ? 1 : 0.5, val = prep ? r.servings : 1, m = r.mac;
  openSheet(`<h2 id="sheet-title">${esc(r.name)}</h2><p class="muted small">${prep ? 'Batch recipe: set how many servings to cook.' : 'Per serving: ' + (m ? m.kcal + ' kcal · ' + m.protein + ' g protein · ' + m.carbs + ' g carbs · ' + m.fat + ' g fat' : 'no nutrition data')}</p>
    <div class="row" style="margin:14px 0">${stepper('sv', val, step, step)}<div class="grow small muted" id="pv"></div></div>
    <label class="f" for="mv">Meal</label><select id="mv">${mealOptions(meal)}</select>
    <label class="f" for="dv">Date</label><input type="date" id="dv" value="${date || selDate}">
    <button class="btn primary block" style="margin-top:16px" data-a="dolog" data-id="${id}">Add to Diary</button>`);
  const upd = () => { const s = parseFloat($('#sv').value) || 0; $('#pv').innerHTML = prep ? `Makes ${r0(s)} servings` : m ? `<b>${r0(m.kcal * s)}</b> kcal` : ''; };
  $('#sv').oninput = upd; upd();
}

// ---------- RECIPES ----------
let rq = '', rcat = 'all', rsort = 'name', reasy = false, rfav = false;
function recipeCard(r) {
  const m = r.mac, fav = favs.includes(r.id);
  return `<article class="rcard"><h3><a href="#/recipe/${r.id}">${esc(r.name)}</a></h3><p class="meta">${esc(catLabel(r.category))} · ${r.time} min · ${r.easy ? 'Easy' : 'Medium'}</p>
    <div class="mac">${m ? `<span><b>${m.kcal}</b> kcal</span><span><b>${m.protein}</b> g protein</span>` : '<span class="muted">No nutrition data</span>'}</div>
    <div class="act"><button class="btn primary sm grow" data-a="log" data-id="${r.id}">+ Add to Diary</button><button class="btn sm fav" data-a="fav" data-id="${r.id}" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${ICON.heart}</button></div></article>`;
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
function viewRecipe(id) {
  const r = rec(id); if (!r) { $('#view').innerHTML = '<div class="card">Recipe not found. <a href="#/recipes">Back to recipes</a></div>'; setBar({ title: 'Recipe', back: '#/recipes' }); return; }
  if (rvId !== id) { rvId = id; rvServ = r.servings; }
  const f = rvServ / r.servings, m = r.mac, fav = favs.includes(id);
  setBar({ title: r.name, back: '#/recipes', right: `<button class="icon-btn fav" data-a="fav" data-id="${id}" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${ICON.heart}</button>` });
  $('#view').innerHTML = `<div class="card hero"><h2>${esc(r.name)}</h2><p class="muted small">${esc(catLabel(r.category))}${r.method ? ' · ' + esc(cap(r.method)) : ''}${r.cuisine && r.cuisine !== 'basic' ? ' · ' + esc(cap(r.cuisine)) : ''} · ${r.time} min · ${r.easy ? 'Easy' : 'Medium'}</p>
      ${m ? `<div class="nutri" role="group" aria-label="Per serving"><div><b>${m.kcal}</b><span>kcal</span></div><div><b>${m.protein} g</b><span>Protein</span></div><div><b>${m.carbs} g</b><span>Carbs</span></div><div><b>${m.fat} g</b><span>Fat</span></div></div><p class="tiny muted" style="margin-top:6px">Per serving, estimated from the ingredients.</p>` : ''}
      <button class="btn primary block" style="margin-top:14px" data-a="log" data-id="${id}">+ Add to Diary</button></div>
    <div class="card"><div class="row wrap" style="justify-content:space-between"><div><h3 style="font-size:18px">Ingredients</h3><p class="small muted">Makes ${rvServ} ${rvServ === 1 ? 'serving' : 'servings'}${f !== 1 ? ' (recipe as written: ' + r.servings + ')' : ''}</p></div>${stepper('rs', rvServ)}</div>
      <ul class="ings" style="margin-top:8px">${r.ing.map(i => `<li>${esc(ingText(i, f))}</li>`).join('')}</ul>${f > 3 || f < 0.5 ? '<p class="small muted">Big change in size: cooking times stay about the same. Use more pans instead of a bigger pan, and taste the seasoning at the end.</p>' : ''}</div>
    <div class="card"><h3 style="font-size:18px">Steps</h3><ol class="steps">${r.steps.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>${r.notes ? `<p class="small muted">${esc(r.notes)}</p>` : ''}</div>`;
}

// ---------- SHOP ----------
let shopRange = store.get('shopRange', '7');
function rangeDates() {
  const t = today();
  if (shopRange === 'today') return [t];
  if (shopRange === 'week') { const s = addDays(t, -parseYmd(t).getDay()); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); }
  if (shopRange === 'custom') { const c = store.get('shopCustom', { from: t, to: addDays(t, 6) }); const out = []; for (let d = c.from, n = 0; d <= c.to && n < 60; d = addDays(d, 1), n++) out.push(d); return out; }
  return Array.from({ length: 7 }, (_, i) => addDays(t, i));
}
function entriesInRange() { const out = []; rangeDates().forEach(d => ALLMEALS.forEach(([k]) => ((diary[d] || {})[k] || []).forEach(e => { if (e.r && rec(e.r)) out.push({ r: e.r, s: e.s }); }))); return out; }
function shopText(S) {
  const by = {}; S.list.forEach(x => (by[x.aisle] = by[x.aisle] || []).push(x));
  return Core.AISLE_ORDER.filter(a => by[a]).map(a => a.toUpperCase() + '\n' + by[a].sort((x, y) => x.name.localeCompare(y.name)).map(x => `- ${Core.title(x.name)}: ${x.pkg ? x.pkg + ' (need ' + x.txt + ')' : x.txt}`).join('\n')).join('\n\n') + (S.free.length ? '\n\nPANTRY CHECK\n' + S.free.map(Core.title).join(', ') : '');
}
function viewShop() {
  setBar({ title: 'Shopping List' });
  const entries = entriesInRange(), S = Core.shopping(entries), by = {};
  S.list.forEach(x => (by[x.aisle] = by[x.aisle] || []).push(x));
  const total = S.list.length, done = S.list.filter(x => checked[x.name]).length;
  const opts = [['7', 'Next 7 days'], ['today', 'Today'], ['week', 'This week'], ['custom', 'Custom']];
  const c = store.get('shopCustom', { from: today(), to: addDays(today(), 6) });
  const recipesUsed = [...new Set(entries.map(e => e.r))].map(rec).filter(Boolean);
  $('#view').innerHTML = `<div class="card"><label class="f" for="sr" style="margin-top:0">Shop for meals planned in the Diary</label><select id="sr">${opts.map(([k, l]) => `<option value="${k}" ${k === shopRange ? 'selected' : ''}>${l}</option>`).join('')}</select>
      ${shopRange === 'custom' ? `<div class="row wrap"><div class="grow"><label class="f" for="sf">From</label><input type="date" id="sf" value="${c.from}"></div><div class="grow"><label class="f" for="st">To</label><input type="date" id="st" value="${c.to}"></div></div>` : ''}
      <p class="small muted" style="margin-top:8px">${entries.length ? `${recipesUsed.length} recipes · ${rangeDates().length} ${rangeDates().length === 1 ? 'day' : 'days'}` : 'Nothing planned in this range.'}</p></div>
    ${total ? `<div class="card flush"><div style="padding:14px 16px"><div class="row" style="justify-content:space-between"><b>${done} of ${total} items</b><span class="row"><button class="btn sm" data-a="copyshop">${ICON.copy} Copy</button>${navigator.share ? `<button class="btn sm" data-a="shareshop">${ICON.share} Share</button>` : ''}</span></div><div class="progress" role="img" aria-label="${done} of ${total} checked"><i style="width:${total ? done / total * 100 : 0}%"></i></div></div></div>
      ${Core.AISLE_ORDER.filter(a => by[a]).map(a => `<h2 class="sec">${a}</h2><div class="card flush">${by[a].sort((x, y) => x.name.localeCompare(y.name)).map(x => { const id = 'i' + x.name.replace(/\W/g, '_'); return `<label class="shop-item ${checked[x.name] ? 'done' : ''}" for="${id}"><input type="checkbox" id="${id}" data-a="tick" data-n="${esc(x.name)}" ${checked[x.name] ? 'checked' : ''}><span class="nm"><b>${esc(Core.title(x.name))}</b><span class="need">${x.pkg ? esc(x.pkg) + ' <span class="muted">· recipes use ' + esc(x.txt) + '</span>' : esc(x.txt)}</span></span></label>`; }).join('')}</div>`).join('')}
      ${S.free.length ? `<h2 class="sec">Pantry Check</h2><div class="card small muted">${esc(S.free.map(Core.title).join(', '))}</div>` : ''}
      ${S.made.length ? `<h2 class="sec">Made by Your Batch Recipes</h2><div class="card small muted">${esc(S.made.map(x => Core.title(x.name) + ' (' + x.txt + ')').join(' · '))}<br>These are not shopping items.</div>` : ''}
      <button class="btn block" data-a="clearchecks" style="margin-top:8px">Clear Checkmarks</button>`
    : `<div class="card"><h2 style="font-size:18px">Plan a week, then shop</h2><p class="muted" style="margin:6px 0 14px">Add recipes to meals in your Diary (today or upcoming days) and the shopping list builds itself. Or start from a ready-made week.</p><div class="row wrap"><button class="btn primary" data-a="templates">Start with a Ready-Made Week</button><a class="btn" href="#/recipes">Browse Recipes</a></div></div>`}`;
}

// ---------- TEMPLATES ----------
let TPL = null;
async function loadTpl() { if (!TPL) TPL = (await (await fetch('data/plans/templates.json')).json()).templates; return TPL; }
async function templateSheet() {
  const T = await loadTpl();
  openSheet(`<h2 id="sheet-title">Ready-Made Weeks</h2><p class="muted small">Adds the meals to your Diary for 7 days, including the batch-cooking day. You can change anything after.</p>
    ${T.map((t, i) => `<div class="card" style="margin:10px 0"><b>${esc(t.name)}</b><p class="small muted">${esc(t.desc)}</p></div>`).join('')}
    <label class="f" for="tp">Plan</label><select id="tp">${T.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join('')}</select>
    <label class="f" for="td">First day (batch-cooking day)</label><input type="date" id="td" value="${today()}">
    <button class="btn primary block" style="margin-top:16px" data-a="applytpl">Add to My Diary</button>`);
}
function applyTemplate(idx, start) {
  const t = TPL[idx]; let n = 0;
  t.days.forEach((day, i) => { const d = addDays(start, i); ALLMEALS.forEach(([k]) => (day[k] || []).forEach(e => { if (rec(e.r)) { addEntry(d, k, { r: e.r, s: e.s }); n++; } })); });
  return n;
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

// ---------- ME ----------
function viewMe() {
  setBar({ title: 'Me' });
  const p = store.get('profile', { sex: 'female', age: 30, ft: 5, inch: 6, lb: 150, activity: 1.375, goal: 'keep' });
  $('#view').innerHTML = `<div class="card" style="margin-top:0"><h2 style="font-size:18px">Daily Goals</h2>
      <div class="row wrap"><div class="grow"><label class="f" for="gk">Calories</label><input type="number" id="gk" value="${goals.kcal}" inputmode="numeric"></div><div class="grow"><label class="f" for="gp">Protein (g)</label><input type="number" id="gp" value="${goals.protein}" inputmode="numeric"></div></div>
      <div class="row wrap"><div class="grow"><label class="f" for="gc">Carbs (g)</label><input type="number" id="gc" value="${goals.carbs}" inputmode="numeric"></div><div class="grow"><label class="f" for="gf">Fat (g)</label><input type="number" id="gf" value="${goals.fat}" inputmode="numeric"></div></div>
      <button class="btn primary block" style="margin-top:14px" data-a="savegoals">Save Goals</button></div>
    <div class="card"><h2 style="font-size:18px">Calculate My Goals</h2><p class="small muted">Uses the Mifflin-St Jeor estimate. It is a starting point, not medical advice.</p>
      <div class="row wrap"><div class="grow"><label class="f" for="ps">Sex</label><select id="ps"><option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option><option value="male" ${p.sex === 'male' ? 'selected' : ''}>Male</option></select></div><div class="grow"><label class="f" for="pa">Age</label><input type="number" id="pa" value="${p.age}" inputmode="numeric"></div></div>
      <div class="row wrap"><div class="grow"><label class="f" for="pf">Height (ft)</label><input type="number" id="pf" value="${p.ft}" inputmode="numeric"></div><div class="grow"><label class="f" for="pi">(in)</label><input type="number" id="pi" value="${p.inch}" inputmode="numeric"></div><div class="grow"><label class="f" for="pw">Weight (lb)</label><input type="number" id="pw" value="${p.lb}" inputmode="numeric"></div></div>
      <label class="f" for="pact">Activity</label><select id="pact">${[[1.2, 'Mostly sitting'], [1.375, 'Light (1–3 workouts a week)'], [1.55, 'Moderate (3–5 workouts)'], [1.725, 'Very active (6–7 workouts)']].map(([v, l]) => `<option value="${v}" ${p.activity == v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <label class="f" for="pg">Goal</label><select id="pg">${[['lose1', 'Lose about 1 lb a week'], ['lose05', 'Lose about ½ lb a week'], ['keep', 'Maintain weight'], ['gain05', 'Gain about ½ lb a week']].map(([v, l]) => `<option value="${v}" ${p.goal === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button class="btn block" style="margin-top:14px" data-a="calcgoals">Calculate</button><div id="calcout"></div></div>
    <div class="card"><h2 style="font-size:18px">Appearance</h2><div class="chips" style="padding-bottom:0;margin-top:8px">${[['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button class="chip" data-a="theme" data-v="${v}" aria-pressed="${store.get('theme', 'light') === v}">${l}</button>`).join('')}</div></div>
    <div class="card"><h2 style="font-size:18px">Your Data</h2><p class="small muted">Everything is saved on this device only. Back it up before clearing your browser or changing phones.</p>
      <div class="row wrap" style="margin-top:10px"><button class="btn" data-a="export">Download Backup</button><label class="btn" for="imp" style="cursor:pointer">Restore Backup</label><input type="file" id="imp" accept="application/json" style="display:none"></div>
      <button class="btn danger block" style="margin-top:10px" data-a="reset">Erase All My Data</button></div>
    <div class="card"><h2 style="font-size:18px">About</h2><p class="small muted">Recipe calories and macros are calculated from the ingredients using USDA values. See <a href="#/learn/sources">Sources</a>. Install this page from your browser menu (Add to Home Screen) to use it like an app, even offline.</p></div>`;
  $('#imp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); if (d.diary) diary = d.diary; if (d.goals) goals = d.goals; if (d.favs) favs = d.favs; store.set('diary', diary); store.set('goals', goals); store.set('favs', favs); toast('Backup restored'); viewMe(); } catch (er) { toast('That file is not a valid backup'); } };
}

// ---------- events ----------
const A = {
  goto: t => { location.hash = '#/diary/' + t.dataset.d; },
  pickdate: () => openSheet(`<h2 id="sheet-title">Go to Date</h2><label class="f" for="pd">Date</label><input type="date" id="pd" value="${selDate}"><div class="row" style="margin-top:14px"><button class="btn primary grow" data-a="godate">Go</button><button class="btn" data-a="gotoday">Today</button></div>`),
  godate: () => { const v = $('#pd').value; closeSheet(); if (v) location.hash = '#/diary/' + v; },
  gotoday: () => { closeSheet(); location.hash = '#/diary/' + today(); },
  edit: t => editSheet(selDate, t.dataset.m, t.dataset.id),
  saveedit: t => {
    const { date, m, id } = t.dataset, e = diary[date][m].find(x => x.id === id), s = parseFloat($('#sv').value); if (!(s > 0)) return toast('Enter a servings amount above 0');
    e.s = s; const nm = $('#mv').value; if (nm !== m) { diary[date][m] = diary[date][m].filter(x => x.id !== id); dayOf(date)[nm].push(e); } saveDiary(); closeSheet(); render();
  },
  deledit: t => { const { date, m, id } = t.dataset, e = diary[date][m].find(x => x.id === id); removeEntry(date, m, id); closeSheet(); render(); toast('Removed ' + entryName(e), () => { dayOf(date)[m].push(e); saveDiary(); render(); }); },
  copyprev: t => { const m = t.dataset.m, y = diary[addDays(selDate, -1)]; (y[m] || []).forEach(e => addEntry(selDate, m, { r: e.r, q: e.q, s: e.s })); render(); toast('Copied from yesterday'); },
  addtab: t => { addTab = t.dataset.t; viewAdd($('#view').dataset.meal, selDate); },
  pick: t => logSheet(t.dataset.id, t.dataset.m, selDate),
  quick1: t => { const r = rec(t.dataset.id), prep = r.category === 'meal prep', m = prep ? 'prep' : t.dataset.m; const id = addEntry(selDate, m, { r: r.id, s: prep ? r.servings : 1 }); toast('Added to ' + mealName(m), () => { removeEntry(selDate, m, id); render(); }); },
  log: t => logSheet(t.dataset.id, null, selDate),
  dolog: t => {
    const r = rec(t.dataset.id), s = parseFloat($('#sv').value), m = $('#mv').value, d = $('#dv').value || selDate; if (!(s > 0)) return toast('Enter a servings amount above 0');
    const id = addEntry(d, m, { r: r.id, s }); closeSheet(); selDate = d;
    toast('Added to ' + mealName(m) + ' · ' + dayLabel(d), () => { removeEntry(d, m, id); render(); }); if (location.hash.startsWith('#/add')) location.hash = '#/diary/' + d;
  },
  fav: t => { const id = t.dataset.id; favs = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id]; store.set('favs', favs); render(); },
  rcat: t => { rcat = t.dataset.c; viewRecipes(); }, reasy: () => { reasy = !reasy; viewRecipes(); }, rfav: () => { rfav = !rfav; viewRecipes(); },
  tick: t => { checked[t.dataset.n] = t.checked; if (!t.checked) delete checked[t.dataset.n]; store.set('checked', checked); const y = scrollY; viewShop(); scrollTo(0, y); },
  clearchecks: () => { checked = {}; store.set('checked', checked); viewShop(); },
  copyshop: () => { const txt = shopText(Core.shopping(entriesInRange())); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Shopping list copied'), () => toast('Could not copy')); },
  shareshop: () => navigator.share({ title: 'Shopping list', text: shopText(Core.shopping(entriesInRange())) }).catch(() => {}),
  templates: () => templateSheet(),
  applytpl: () => { const n = applyTemplate(+$('#tp').value, $('#td').value || today()); const d = $('#td').value || today(); closeSheet(); toast('Added ' + n + ' items to your Diary'); selDate = d; location.hash = '#/diary/' + d; },
  equip: t => { const e = store.get('equip', {}); e[t.dataset.i] = t.checked; store.set('equip', e); },
  savegoals: () => { goals = { kcal: +$('#gk').value || 2000, protein: +$('#gp').value || 0, carbs: +$('#gc').value || 0, fat: +$('#gf').value || 0 }; store.set('goals', goals); toast('Goals saved'); },
  calcgoals: () => {
    const p = { sex: $('#ps').value, age: +$('#pa').value || 30, ft: +$('#pf').value || 5, inch: +$('#pi').value || 0, lb: +$('#pw').value || 150, activity: +$('#pact').value, goal: $('#pg').value }; store.set('profile', p);
    const g = Core.calcGoals(p); $('#calcout').innerHTML = `<div class="card" style="background:var(--blue-l);border-color:var(--blue-line)"><b>${g.kcal} calories a day</b><p class="small">Protein ${g.protein} g · Carbs ${g.carbs} g · Fat ${g.fat} g<br><span class="muted">Maintenance is about ${g.tdee} calories.</span></p><button class="btn primary sm" data-a="usegoals" data-k="${g.kcal}" data-p="${g.protein}" data-c="${g.carbs}" data-f="${g.fat}">Use These Goals</button></div>`;
  },
  usegoals: t => { goals = { kcal: +t.dataset.k, protein: +t.dataset.p, carbs: +t.dataset.c, fat: +t.dataset.f }; store.set('goals', goals); viewMe(); toast('Goals updated'); },
  theme: t => { const v = t.dataset.v; store.set('theme', v); document.documentElement.dataset.theme = v; document.querySelector('meta[name=theme-color]').content = v === 'dark' ? '#0e131b' : '#f3f5f9'; viewMe(); },
  export: () => download('meal-diary-backup-' + today() + '.json', JSON.stringify({ app: 'meal-diary', diary, goals, favs, exported: new Date().toISOString() }, null, 1)),
  reset: () => { if (confirm('Erase your diary, goals and favorites on this device? This cannot be undone.')) { ['diary', 'goals', 'checked', 'favs', 'recent', 'equip', 'profile'].forEach(k => { try { localStorage.removeItem('cb.' + k); } catch (e) {} }); diary = {}; goals = { kcal: 2000, protein: 150, carbs: 225, fat: 65 }; checked = {}; favs = []; recent = []; render(); toast('All data erased'); } }
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
  if (t.id === 'rs') { rvServ = Math.max(1, Math.round(parseFloat(t.value)) || 1); const y = scrollY; viewRecipe(rvId); scrollTo(0, y); }
  if (t.id === 'sr') { shopRange = t.value; store.set('shopRange', shopRange); viewShop(); }
  if (t.id === 'sf' || t.id === 'st') { const c = { from: $('#sf').value, to: $('#st').value }; if (c.from && c.to && c.from <= c.to) { store.set('shopCustom', c); viewShop(); } }
});

// ---------- router ----------
function render() {
  const p = (location.hash || '#/diary').replace(/^#\/?/, '').split('/').map(decodeURIComponent), root = p[0] || 'diary';
  const map = { diary: () => viewDiary(p[1]), recipes: viewRecipes, recipe: () => viewRecipe(p[1]), add: () => viewAdd(p[1], p[2]), shop: viewShop, learn: () => viewLearn(p[1], p[2]), me: viewMe };
  const navRoot = { recipe: 'recipes', add: 'diary' }[root] || root;
  if (!map[root]) { location.hash = '#/diary'; return; }
  setNav(navRoot); map[root]();
  if (!(root === 'learn' && p[2])) { /* guides scroll themselves */ }
}
let lastHash = null;
window.addEventListener('hashchange', () => {
  const same = lastHash && lastHash.split('/')[1] === location.hash.split('/')[1] && location.hash.split('/')[1] === 'learn';
  lastHash = location.hash; closeSheet(); render(); if (!same) window.scrollTo(0, 0); $('#view').focus({ preventScroll: true });
});

(async function start() {
  setNav('diary'); $('#view').innerHTML = '<div class="card muted">Loading…</div>';
  try { await Core.init(); } catch (e) { $('#view').innerHTML = `<div class="card err">Could not load data (${esc(e.message)}). Open this page from the website or a local web server; browsers block loading data files straight from disk.</div>`; return; }
  lastHash = location.hash; render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
