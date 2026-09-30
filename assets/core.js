/* Core logic: units and scaling, nutrition, shopping list, store packages. No DOM here. */
const Core = (() => {
  const FILES = ['basics', 'chicken', 'beef-pork-turkey', 'fish-eggs-plant', 'meal-prep', 'meals', 'snacks'];
  let R = [], NUT = [], SHOP = [], FIXED = [], LOOSE = [], FALLBACK = [];

  // ---------- text ----------
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SMALLW = new Set(['and', 'or', 'with', 'in', 'of', 'the', 'a', 'an', 'to', 'for', 'on', 'over', 'from', 'no', 'vs']);
  const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const title = s => String(s || '').split(' ').map((w, i) => { const m = w.match(/^(\W*)([a-z][\w'-]*)(\W*)$/); if (!m || (i > 0 && SMALLW.has(m[2]))) return w; return m[1] + m[2].charAt(0).toUpperCase() + m[2].slice(1) + m[3]; }).join(' ');
  const CATS = { 'meal prep': 'Batch Prep', basics: 'Basic Foods', plant: 'Beans and Plant Protein', fish: 'Fish and Seafood', 'soups and stews': 'Soups and Stews', dinner: 'Dinners', bowls: 'Bowls' };
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
    const T = { kcal: 0, protein: 0, carbs: 0, fat: 0 }, miss = [], G = { g: 0 }; let any = false;
    for (const i of r.ing) {
      const q = num(i[0]); if (q == null) continue;
      const e = nutFor(i[2]); if (e && e.k === 0) continue; const g = e ? grams(q, normUnit(i[1]), e, i[2]) : null;
      if (g == null) { miss.push(i[2]); continue; }
      any = true; G.g += g; T.kcal += e.k * g / 100; T.protein += e.p * g / 100; T.carbs += e.c * g / 100; T.fat += e.f * g / 100;
    }
    if (!any) return null;
    const s = r.servings || 1;
    return { kcal: Math.round(T.kcal / s), protein: Math.round(T.protein / s), carbs: Math.round(T.carbs / s), fat: Math.round(T.fat / s), g: Math.round(G.g / s), miss };
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
  const isMade = n => /^(cooked|poached|leftover|cold cooked)\b|^(roasted|shredded|sliced) (cooked |leftover )?(chicken|beef|pork|turkey|vegetables|potatoes)\b/i.test(n);
  const norm0 = n => n.toLowerCase().replace(/\(.*?\)/g, '').replace(/,.*$/, '').replace(/\b(optional|to taste|of choice|fresh|large|small|diced|sliced|chopped|minced|peeled)\b/g, '').replace(/\s+/g, ' ').trim().replace(/^cans?\s+/, '');
  // Same thing written different ways ("banana", "ripe bananas"; thighs with or without skin) should be one line on the list.
  const ALIAS = [[/^(ripe )?bananas?$/, 'banana'], [/^(bone-in )?(skin-on )?(chicken )?(thighs|pieces|drumsticks|leg quarters)( (and|or) (thighs|drumsticks))?$|^bone-in (skin-on )?(chicken )?thighs( or drumsticks| and drumsticks)?$|^thighs and drumsticks$|^drumsticks and thighs$/, 'bone-in chicken thighs'],
    [/^boneless (skinless )?(chicken )?thighs?$/, 'boneless chicken thighs'], [/^(boneless )?(skinless )?(chicken )?breasts?$|^boneless (skinless )?(chicken )?breasts?( or thighs)?$/, 'boneless chicken breasts'],
    [/^(onions?|white onions?|yellow onions?)$/, 'onion'], [/^carrots?$/, 'carrots'], [/^lemons?$/, 'lemon'], [/^limes?$/, 'lime'], [/^(russet )?potatoes$|^potato$/, 'potatoes'], [/^bell peppers?$/, 'bell pepper'], [/^apples?$/, 'apple'], [/^celery stalks?$/, 'celery'], [/^ground or finely( chopped)? chicken$|^ground chicken$/, 'ground chicken'], [/^cucumbers?$/, 'cucumber'], [/^garlic cloves?$/, 'garlic']];
  const norm = n => { const b = norm0(n), a = ALIAS.find(x => x[0].test(b)); return a ? a[1] : b; };
  function needIn(x, rule) {
    const unit = rule.unit;
    if (unit === 'cup') return x.t === 'vol' ? x.base / 48 : null;
    if (unit === 'tbsp') return x.t === 'vol' ? x.base / 3 : null;
    if (unit === 'oz') return x.t === 'wt' ? x.base : null;
    if (unit === 'scoop') return x.t === 'other' && x.unit === 'scoop' ? x.base : null;
    if (unit === 'count') {
      if (x.t === 'count' || (x.t === 'other' && (x.unit === 'can' || x.unit === 'jar'))) return x.base;
      return x.t === 'vol' && rule.cupPer ? x.base / 48 / rule.cupPer : null;
    }
    return null;
  }
  const plural = (n, p) => n + ' ' + (n === 1 ? p[0] : p[1]);
  // One kind of package per item: fewest packages, then least left over. Pantry staples get the biggest
  // package that is still used up within about six weeks at this plan's pace.
  function choosePackage(rule, need, days, stock) {
    const pk = [...rule.packages].sort((a, b) => a[2] - b[2]), perWeek = need / Math.max(1, days / 7);
    let best = null;
    for (const p of pk) { const n = Math.ceil(need / p[2] - 1e-9), total = n * p[2]; if (!best || n < best.n || (n === best.n && total < best.total)) best = { p, n, total }; }
    if (stock) { const big = pk.filter(p => p[2] <= perWeek * 6).pop(); if (big && big[2] > best.p[2]) { const n = Math.ceil(need / big[2] - 1e-9); best = { p: big, n, total: n * big[2] }; } }
    const wk = best.total / perWeek;
    return { pkg: plural(best.n, best.p), cost: best.n * best.p[3], stock, share: stock ? Math.min(1, need / best.total) : 1, weeks: stock && wk >= 2 ? Math.floor(wk) : 0 };
  }
  function priceItem(x, days) {
    const rule = SHOP.find(r => r.re.test(x.name));
    if (rule) { const need = needIn(x, rule); if (need > 0) return choosePackage(rule, need, days, !!rule.stock); }
    const fx = FIXED.find(r => r.re.test(x.name)); if (fx) return { pkg: fx.pkg, cost: fx.price, stock: !!fx.stock, share: fx.stock ? 0.08 : 1, weeks: 0 };
    const lo = LOOSE.find(r => r.re.test(x.name));
    if (lo) {
      if (x.t === 'wt' && lo.lb) { const lb = Math.max(0.5, Math.ceil(x.base / 8 - 1e-9) / 2); return { pkg: 'about ' + lb + ' lb', cost: lb * lo.lb, stock: false, share: 1, weeks: 0, loose: true }; }
      if (x.t === 'count' && lo.eachLb) { const lb = Math.max(1, Math.ceil(x.base * lo.eachLb * 2 - 1e-9) / 2); return { pkg: 'about ' + lb + ' lb (' + Math.ceil(x.base) + ' pieces)', cost: lb * lo.lb, stock: false, share: 1, weeks: 0, loose: true }; }
      if (x.t === 'count' && lo.each) { const n = Math.ceil(x.base - 1e-9); return { pkg: String(n), cost: n * lo.each, stock: false, share: 1, weeks: 0, loose: true }; }
    }
    const fb = FALLBACK.find(r => r.re.test(x.name)); if (fb) return { pkg: fb.pkg, cost: fb.price, stock: !!fb.stock, share: fb.stock ? 0.2 : 1, weeks: 0 };
    return null;
  }
  // entries: [{ r: recipeId, s: servings }], days: length of the shopping range.
  // returns { list, made, free }; list items carry pkg, cost (or null), stock, weeks
  function shopping(entries, days = 7) {
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
    // Vegetables are bought as one frozen mix: cheaper, no waste, and it covers the peppers, carrots, broccoli and so on.
    const VEG = /bell pepper|carrot|broccoli|cauliflower|zucchini|squash|green beans|\bpeas\b|^corn$|^frozen corn|mixed vegetables|^vegetables|raw vegetables|asparagus|brussels/, NOTVEG = /sauce|powder|soup|stock|broth|cream|tortilla|chip|bread|sweet potato|starch|pickle|relish|seed/;
    const EACH_OZ = [[/bell pepper/, 6], [/carrot/, 2.5], [/broccoli/, 10], [/cauliflower/, 18], [/zucchini|squash/, 8]], veg = { name: 'frozen vegetable mix', t: 'wt', base: 0, unit: '', covers: new Set() };
    for (const [k, x] of [...M]) {
      if (!VEG.test(x.name) || NOTVEG.test(x.name)) continue;
      const each = (EACH_OZ.find(e => e[0].test(x.name)) || [0, 4])[1];
      veg.base += x.t === 'wt' ? x.base : x.t === 'vol' ? x.base / 48 * 4.5 : x.base * each; veg.covers.add(x.name); M.delete(k);
    }
    if (veg.base > 0) M.set('frozen vegetable mix|wt', veg);
    const out = (m, buy) => [...m.values()].map(x => {
      let txt;
      if (x.t === 'vol') { const u = x.base >= 12 ? 'cup' : x.base >= 3 ? 'tbsp' : 'tsp'; txt = fmt(x.base / VOL[u], u); }
      else if (x.t === 'wt') txt = fmt(x.base, 'oz'); else if (x.t === 'other') txt = fmt(x.base, x.unit); else txt = fmt(x.base, '');
      const info = buy ? priceItem(x, days) : null, aisle = aisleOf(x.name);
      return { name: x.name, txt, pkg: info && info.pkg, cost: info ? Math.max(1, Math.round(info.cost)) : null, covers: x.covers ? [...x.covers] : null, loose: !!(info && info.loose), share: info ? info.share : 1, stock: info ? info.stock : aisle === 'Spices', weeks: info ? info.weeks : 0, aisle };
    });
    const list = out(M, true);
    return { list, made: out(made), free: [...free].filter(n => !list.some(x => x.name === n)) };
  }

  // ---------- diary math ----------
  const ZERO = () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  function entryMac(e) {
    if (e.q) return { kcal: (e.q.kcal || 0) * e.s, protein: (e.q.protein || 0) * e.s, carbs: (e.q.carbs || 0) * e.s, fat: (e.q.fat || 0) * e.s };
    if (e.p) { const T = ZERO(); e.p.forEach(id => { const m = entryMac({ r: id, s: e.s }); T.kcal += m.kcal; T.protein += m.protein; T.carbs += m.carbs; T.fat += m.fat; }); return T; }
    const r = byId(e.r); if (!r || !r.mac) return ZERO();
    return { kcal: r.mac.kcal * e.s, protein: r.mac.protein * e.s, carbs: r.mac.carbs * e.s, fat: r.mac.fat * e.s };
  }
  const MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks']];
  const eaten = e => e.done !== false;
  function sumMeal(list, eatenOnly) { const T = ZERO(); (list || []).forEach(e => { if (eatenOnly && !eaten(e)) return; const m = entryMac(e); T.kcal += m.kcal; T.protein += m.protein; T.carbs += m.carbs; T.fat += m.fat; }); return T; }
  function dayTotals(day, eatenOnly) { const T = ZERO(); MEALS.forEach(([k]) => { const m = sumMeal(day && day[k], eatenOnly); T.kcal += m.kcal; T.protein += m.protein; T.carbs += m.carbs; T.fat += m.fat; }); return T; }

  // ---------- batch week builder ----------
  // Everything is cooked in batches and packed into containers: a container is one serving of a
  // complete batch dish, or one serving each of a protein dish, a carb side and a vegetable side.
  function planCost(entries) {
    const S = shopping(entries, 7); let groceries = 0, pantry = 0, weekly = 0, unknown = 0;
    for (const x of S.list) { if (x.cost == null) { unknown++; continue; } if (x.stock) { pantry += x.cost; weekly += x.cost * x.share; } else { groceries += x.cost; weekly += x.cost; } }
    return { groceries, pantry, weekly, unknown };
  }
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const CAP = { 16: 420, 22: 560 };   // grams of mixed cooked food a deli container holds
  const PROT_RE = /chicken|beef|pork|turkey|salmon|tuna|shrimp|fish|cod|egg|tofu|beans?|lentil|chickpea|sausage|yogurt|cottage|whey|bacon|ham\b/i;
  const CARB_RE = /\b(rice|potatoes|potato|pasta|noodles?|oats|tortillas?|bread|quinoa|couscous|orzo|beans?|lentils?|chickpeas|pitas?|granola|spaghetti|hash browns)\b/i;
  const isComplete = r => { const t = r.ing.map(i => i[2]).join(' | ').replace(/green beans?/gi, ''); return PROT_RE.test(t) && CARB_RE.test(t); };
  const NOT_BATCH = new Set(['buttermilk-fried-chicken', 'smash-burgers', 'turkey-burgers', 'fish-tacos', 'chicken-quesadilla', 'chicken-stock', 'tuna-salad', 'pan-seared-steak', 'greek-yogurt-chicken-salad', 'scrambled-eggs', 'hard-boiled-eggs', 'egg-fried-rice', 'red-lentil-dal', 'three-bean-salad', 'crispy-tofu', 'smoked-chicken-thighs']);
  const BREAKFASTS = ['overnight-oats'];
  const SNACKS = ['hummus-veggie-box', 'roasted-chickpeas', 'protein-trail-mix', 'chocolate-protein-pudding', 'banana-oat-bites', 'trail-mix-energy-bites', 'salsa-bean-cups', 'egg-snack-box', 'cottage-cheese-pineapple', 'turkey-cheese-rollups', 'edamame-cup'];
  const madeOtherThanRice = r => r.ing.some(i => isMade(i[2]) && !/rice/i.test(i[2]));
  const riceCups = (r, c) => { let cups = 0; r.ing.forEach(i => { if (isMade(i[2]) && /rice/i.test(i[2])) { const q = num(i[0]); if (q != null && normUnit(i[1]) === 'cup') cups += q * c / r.servings; } }); return cups; };
  const item = parts => ({ parts, kcal: parts.reduce((a, r) => a + r.mac.kcal, 0), protein: parts.reduce((a, r) => a + r.mac.protein, 0), g: parts.reduce((a, r) => a + (r.mac.g || 0), 0), key: parts.map(r => r.id).join('+') });
  function pools(container) {
    const cap = CAP[container] || CAP[22], has = r => r && r.mac && r.mac.kcal > 0, carbs = ['batch-rice', 'batch-roasted-potatoes'].map(byId), veg = byId('batch-roasted-vegetables');
    const prot = R.filter(r => has(r) && ['chicken', 'beef', 'pork', 'turkey', 'fish'].includes(r.category) && !isComplete(r) && !NOT_BATCH.has(r.id) && r.servings >= 2 && !r.ing.some(i => isMade(i[2])));
    const composed = [];
    prot.forEach(p => carbs.forEach(c => { if (has(c) && has(veg)) { const it = item([p, c, veg]); if (it.g <= cap && it.kcal >= 380) composed.push(it); } }));
    const complete = R.filter(r => has(r) && !['meal prep', 'basics', 'snacks', 'breakfast'].includes(r.category) && isComplete(r) && !NOT_BATCH.has(r.id) && r.servings >= 2 && !madeOtherThanRice(r) && r.mac.g <= cap && r.mac.kcal >= 350).map(r => item([r]));
    const ids = l => l.map(byId).filter(r => has(r) && r.mac.g <= cap).map(r => item([r]));
    return { m: [...composed, ...complete], b: ids(BREAKFASTS), s: ids(SNACKS) };
  }
  // One week of batch cooking: one breakfast, one lunch, one dinner and one snack, cooked once and packed into containers.
  function assemble(st, goals) {
    const parts = new Map(), add = (id, s, counted = true) => { const p = parts.get(id) || { s: 0, c: 0 }; p.s += s; if (counted) p.c += s; parts.set(id, p); }, sc = goals.kcal - (st.b.kcal + st.l.kcal + st.d.kcal + st.s.kcal) > st.s.kcal * 0.6 ? 2 : 1;
    [[st.b, 1], [st.l, 1], [st.d, 1], [st.s, sc]].forEach(([it, cnt]) => it.parts.forEach(r => { add(r.id, 7 * cnt); const rc = riceCups(r, 7 * cnt); if (rc) add('batch-rice', Math.ceil(rc), false); }));
    return { items: [...parts].map(([r, p]) => { const s = Math.max(1, Math.ceil(p.s)); return p.c >= p.s ? { r, s } : { r, s, c: Math.ceil(p.c) }; }), sc };
  }
  function evalPlan(st, goals, budget) {
    const { items, sc } = assemble(st, goals), c = planCost(items), kcal = st.b.kcal + st.l.kcal + st.d.kcal + sc * st.s.kcal, protein = st.b.protein + st.l.protein + st.d.protein + sc * st.s.protein;
    const same = (x, y) => x.parts.some(p => y.parts.some(q => p.id === q.id));
    const score = (same(st.l, st.d) ? 12 : 0) + Math.max(0, c.weekly - budget) * 8 + Math.max(0, budget - c.weekly) * 0.1 + Math.abs(kcal - goals.kcal) / goals.kcal * 60 + Math.max(0, goals.protein * 0.9 - protein) / Math.max(1, goals.protein) * 60 + c.unknown * 5;
    const name = it => it.parts.map(r => r.id);
    return { items, cost: c, kcal, protein, score, fits: c.weekly <= budget, containers: 7 * (3 + sc), meals: { breakfast: name(st.b), lunch: name(st.l), dinner: name(st.d), snacks: name(st.s) } };
  }
  // Finds a one-week batch plan near the weekly budget and the calorie/protein goals. Different seeds give different plans.
  function buildPlan(budget, goals, seed = Date.now(), container = 22) {
    const rnd = mulberry(seed), pick = a => a[Math.floor(rnd() * a.length)], P = pools(container), pl = { b: P.b, l: P.m, d: P.m, s: P.s };
    let best = null;
    for (let r = 0; r < 20; r++) {
      let st = { b: pick(P.b), l: pick(P.m), d: pick(P.m), s: pick(P.s) }, cur = evalPlan(st, goals, budget);
      for (let i = 0; i < 40; i++) { const key = pick(['b', 'l', 'd', 's']), cand = { ...st, [key]: pick(pl[key]) }, e = evalPlan(cand, goals, budget); if (e.score < cur.score) { st = cand; cur = e; } }
      if (!best || cur.score < best.score) best = cur;
    }
    return best;
  }

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
    const sj = await (await fetch('data/shopping.json')).json(), rx = r => ({ ...r, re: new RegExp(r.match, 'i') });
    SHOP = sj.rules.map(rx); FIXED = sj.fixed.map(rx); LOOSE = sj.loose.map(rx); FALLBACK = sj.fallback.map(rx);
    R = [];
    for (const f of FILES) { const r = await fetch(`data/recipes/${f}.json`); if (!r.ok) throw new Error(f + ' ' + r.status); (await r.json()).recipes.forEach(x => R.push(x)); }
    R.forEach(r => { r.mac = macrosOf(r); r.name = title(r.name); r.easy = isEasy(r); });
    return R;
  }
  return { init, get recipes() { return R; }, byId, esc, cap, title, catLabel, num, fmt, ingText, normUnit, unitType, scaleFactor, VOL, WT, macrosOf, shopping, priceItem, CAP, aisleOf, AISLE_ORDER, isMade, norm, entryMac, eaten, planCost, buildPlan, sumMeal, dayTotals, MEALS, ymd, parseYmd, addDays, calcGoals, isEasy };
})();
