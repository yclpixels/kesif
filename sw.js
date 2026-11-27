// Damga service worker: keeps the app shell available offline.
// Live data (weather, prayer times, places) is cached separately in localStorage by js/api.js.
const VERSION = 'kesif-v38';
const SHELL = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/apple-touch-icon.png',
  './js/app.js', './js/api.js', './js/data.js', './js/i18n.js', './js/game.js', './js/mascot.js', './js/stops-info.js', './js/photos.js', './js/album.js', './js/icons.js', './js/phrases.js', './js/photocheck.js', './js/share.js', './assets/3d/manifest.json', './data/tr-admin.json', './data/grid/index.json', './data/tr-map.json'
];
// Place snapshots are large and may be missing in a fresh checkout; cache them when they exist.
const OPTIONAL = ['istanbul', 'ankara', 'izmir', 'antalya', 'kapadokya', 'bursa', 'eskisehir', 'trabzon', 'mardin', 'safranbolu', 'konya', 'gaziantep', 'sanliurfa', 'edirne', 'canakkale'].map((c) => `./data/places-${c}.json`);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).then(() => Promise.all(OPTIONAL.map((f) => c.add(f).catch(() => {})))).then(() => self.skipWaiting())));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && !k.startsWith('kesif-map') && !k.startsWith('kesif-img')).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Map files, the map library and stop photos: cache first, so places seen once also work offline.
const RUNTIME = [
  [/^https:\/\/tiles\.openfreemap\.org\//, 'kesif-map'],
  [/^https:\/\/s3\.amazonaws\.com\/elevation-tiles-prod\//, 'kesif-map'],
  [/^https:\/\/unpkg\.com\/(maplibre-gl|@google\/model-viewer)@/, 'kesif-map'],
  [/^https:\/\/cdn\.jsdelivr\.net\/npm\/@tensorflow/, 'kesif-map'],
  [/^https:\/\/(upload|thumb)\.wikimedia\.org\//, 'kesif-img']
];
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const rt = RUNTIME.find(([re]) => re.test(e.request.url));
  if (rt) {
    e.respondWith(caches.open(rt[1]).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Network first for our own files so updates show up; fall back to cache when offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
