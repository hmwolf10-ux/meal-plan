/* Offline support: network first (so updates arrive), cache as fallback. */
const CACHE = 'meal-plan-v6';
const CORE = ['./', 'index.html', 'assets/style.css', 'assets/core.js', 'assets/app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'data/nutrition.json', 'data/shopping.json', 'data/plans/templates.json',
  'data/recipes/basics.json', 'data/recipes/chicken.json', 'data/recipes/beef-pork-turkey.json', 'data/recipes/fish-eggs-plant.json', 'data/recipes/meal-prep.json', 'data/recipes/meals.json', 'data/recipes/snacks.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; }).catch(() => caches.match(e.request)));
});
