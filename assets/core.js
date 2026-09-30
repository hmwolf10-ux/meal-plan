/* Core logic: units and scaling, nutrition, shopping list, store packages. No DOM here. */
const Core = (() => {
  const FILES = ['chicken', 'beef-pork-turkey', 'fish-eggs-plant', 'meal-prep', 'meals', 'snacks'];
  let R = [], NUT = [], SHOP = [];

  // ---------- text ----------
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SMALLW = new Set(['and', 'or', 'with', 'in', 'of', 'the', 'a', 'an', 'to', 'for', 'on', 'over', 'from', 'no', 'vs']);
  const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const title = s => String(s || '').split(' ').map((w, i) => { const m = w.match(/^(\W*)([a-z][\w'-]*)(\W*)$/); if (!m || (i > 0 && SMALLW.has(m[2]))) return w; return m[1] + m[2].charAt(0).toUpperCase() + m[2].slice(1) + m[3]; }).join(' ');
  const CATS = { 'meal prep': 'Batch Prep', plant: 'Beans and Plant Protein', fish: 'Fish and Seafood', 'soups and stews': 'Soups and Stews', dinner: 'Dinners', bowls: 'Bowls' };
  const catLabel = c => CATS[c] || cap(c);

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
      if (tsp >= 12) {
        const near = Math.round(cups * 8) / 8, third = Math.round(cups * 3) / 3;
        const pick = Math.abs(near - cups) <= Math.abs(third - cups) ? near : third;
        if (Math.abs(pick - cups) / cups <= 0.05) { const n = frac(pick); return n + (SMALL.has(n) ? ' cup' : ' cups'); }
        if (tsp < 48) return frac(Math.round(tsp / 3 * 2) / 2) + ' tbsp';
        const w = Math.floor(cups + 1e-9), rest = Math.round((tsp - w * 48) / 3 * 2) / 2;
        return w + (w === 1 ? ' cup' : ' cups') + (rest ? ' + ' + frac(rest) + ' tbsp' : '');
      }
      if (tsp >= 3) {
        let tb = Math.floor(tsp / 3 + 1e-9), rest = Math.round((tsp - tb * 3) * 4) / 4;
        if (rest >= 3) { tb++; rest = 0; }
        return tb + ' tbsp' + (rest ? ' + ' + frac(rest) + ' tsp' : '');
      }
      return frac(Math.round(tsp * 8) / 8 || 0.125) + ' tsp';
    }
    if (t === 'wt') {
      let oz = q * WT[u];
      if (oz >= 16) {
        if (oz >= 48) oz = Math.round(oz / 4) * 4;
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

  // ---------- nutrition ----------
  const nutFor = item => { const s = item.toLowerCase(); return NUT.find(n => n.re.test(s)) || null; };
  function sizeOf(item, e) {
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
  function macrosOf(r) {
    const T = { kcal: 0, protein: 0, carbs: 0, fat: 0 }, miss = []; let any = false;
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

  // ---------- recipe helpers ----------
  const HARD = /^(fry|braise|smoke|pan-sear|griddle|stir-fry|spatchcock|grill|oven-fry)$/;
  const isEasy = r => !HARD.test(r.method) && (r.time || 0) <= 120;
  const byId = id => R.find(r => r.id === id);

  // ---------- shopping ----------
  const AISLE = [
    ['Spices', /(garlic|onion|chili|ginger|curry|mustard) powder|paprika|cumin|cayenne|cinnamon|turmeric|garam|coriander|allspice|seasoning|\brub\b|bay leaf|bay leaves|peppercorn|vanilla|masala|oregano|^kosher salt|^salt|black pepper|^pepper|dried thyme|baking powder|za'atar|red pepper flakes/i],
    ['Pantry and Canned', /peanut butter|almond butter|coconut milk|whey|protein powder|broth|stock/i],
    ['Meat and Fish', /chicken|beef|pork|turkey|sausage|bacon|steak|salmon|cod|shrimp|tuna|fillet|thigh|drumstick|wing|tenderloin|lamb|chuck|flank|breast/i],
    ['Dairy and Eggs', /egg|milk|yogurt|cheese|butter|cream|feta|parmesan|mozzarella|cottage/i],
    ['Produce', /onion|garlic|carrot|celery|bell pepper|potato|broccoli|spinach|kale|lemon|lime|banana|cucumber|zucchini|mushroom|asparagus|cabbage|ginger|cilantro|parsley|thyme|scallion|jalapeno|berries|herb|vegetable|green bean|avocado|tomato(?!es, crushed)|apple|pineapple|pepper/i],
    ['Pantry and Canned', /rice|oat|lentil|bean|chickpea|pasta|spaghetti|noodle|flour|panko|tortilla|pita|bun|bread|couscous|quinoa|tomato|salsa|marinara|sauce|oil|vinegar|soy|honey|sugar|syrup|mustard|peanut|hummus|tofu|wine|beer|granola|cornstarch|baking|corn|almond|raisin|chocolate|cocoa|olive|caper/i]
  ];
  const aisleOf = n => (AISLE.find(a => a[1].test(n)) || ['Other'])[0];
  const AISLE_ORDER = ['Produce', 'Meat and Fish', 'Dairy and Eggs', 'Pantry and Canned', 'Spices', 'Other'];
  const isMade = n => /^(cooked|poached|roasted|leftover|shredded|sliced|cold cooked)\b/i.test(n);
  const norm = n => n.toLowerCase().replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(/\b(optional|to taste|of choice|fresh|large|small|diced|sliced|chopped|minced|peeled)\b/g, '').replace(/\s+/g, ' ').trim().replace(/^cans?\s+/, '');
  function needIn(x, unit) {
    if (unit === 'cup') return x.t === 'vol' ? x.base / 48 : null;
    if (unit === 'tbsp') return x.t === 'vol' ? x.base / 3 : null;
    if (unit === 'oz') return x.t === 'wt' ? x.base : null;
    if (unit === 'scoop') return x.t === 'other' && x.unit === 'scoop' ? x.base : null;
    if (unit === 'count') return x.t === 'count' || (x.t === 'other' && (x.unit === 'can' || x.unit === 'jar')) ? x.base : null;
    return null;
  }
  function bestPack(need, pk) {
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
  // entries: [{ r: recipeId, s: servings }]; returns { list, made, free }
  function shopping(entries) {
    const M = new Map(), made = new Map(), free = new Set();
    for (const { r: id, s } of entries) {
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
      return { name: x.name, txt, pkg: buy ? packagesFor(x) : null, aisle: aisleOf(x.name) };
    });
    const list = out(M, true);
    return { list, made: out(made), free: [...free].filter(n => !list.some(x => x.name === n)) };
  }

  // ---------- diary math ----------
  const ZERO = () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  function entryMac(e) {
    if (e.q) return { kcal: (e.q.kcal || 0) * e.s, protein: (e.q.protein || 0) * e.s, carbs: (e.q.carbs || 0) * e.s, fat: (e.q.fat || 0) * e.s };
    const r = byId(e.r); if (!r || !r.mac) return ZERO();
    return { kcal: r.mac.kcal * e.s, protein: r.mac.protein * e.s, carbs: r.mac.carbs * e.s, fat: r.mac.fat * e.s };
  }
  const MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks']];
  const eaten = e => e.done !== false;
  function sumMeal(list, eatenOnly) { const T = ZERO(); (list || []).forEach(e => { if (eatenOnly && !eaten(e)) return; const m = entryMac(e); T.kcal += m.kcal; T.protein += m.protein; T.carbs += m.carbs; T.fat += m.fat; }); return T; }
  function dayTotals(day, eatenOnly) { const T = ZERO(); MEALS.forEach(([k]) => { const m = sumMeal(day && day[k], eatenOnly); T.kcal += m.kcal; T.protein += m.protein; T.carbs += m.carbs; T.fat += m.fat; }); return T; }

  // ---------- dates ----------
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };

  // ---------- goals calculator (Mifflin-St Jeor) ----------
  function calcGoals({ sex, age, ft, inch, lb, activity, goal }) {
    const kg = lb * 0.45359237, cm = (ft * 12 + inch) * 2.54;
    const bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === 'male' ? 5 : -161);
    const tdee = bmr * activity;
    const adj = { lose1: -500, lose05: -250, keep: 0, gain05: 250 }[goal] || 0;
    const kcal = Math.round((tdee + adj) / 25) * 25;
    const protein = Math.round(lb * 0.9 / 5) * 5, fat = Math.round(kcal * 0.27 / 9 / 5) * 5, carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4 / 5) * 5);
    return { kcal, protein, carbs, fat, tdee: Math.round(tdee) };
  }

  async function init() {
    NUT = (await (await fetch('data/nutrition.json')).json()).items.map(n => ({ ...n, re: new RegExp(n.m, 'i') }));
    SHOP = (await (await fetch('data/shopping.json')).json()).rules.map(r => ({ ...r, re: new RegExp(r.match, 'i') }));
    R = [];
    for (const f of FILES) { const r = await fetch(`data/recipes/${f}.json`); if (!r.ok) throw new Error(f + ' ' + r.status); (await r.json()).recipes.forEach(x => R.push(x)); }
    R.forEach(r => { r.mac = macrosOf(r); r.name = title(r.name); r.easy = isEasy(r); });
    return R;
  }
  return { init, get recipes() { return R; }, byId, esc, cap, title, catLabel, num, fmt, ingText, normUnit, unitType, scaleFactor, VOL, WT, macrosOf, shopping, packagesFor, aisleOf, AISLE_ORDER, isMade, norm, entryMac, eaten, sumMeal, dayTotals, MEALS, ymd, parseYmd, addDays, calcGoals, isEasy };
})();
