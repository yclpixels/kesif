// Damga service worker: keeps the app shell available offline.
// Live data (weather, prayer times, places) is cached separately in localStorage by js/api.js.
const VERSION = 'kesif-v11';
const SHELL = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/apple-touch-icon.png',
  './js/app.js', './js/api.js', './js/data.js', './js/i18n.js', './js/game.js', './js/mascot.js', './js/stops-info.js', './js/photos.js', './js/album.js', './js/icons.js'
];
// Place snapshots are large and may be missing in a fresh checkout; cache them when they exist.
const OPTIONAL = ['./data/places-istanbul.json', './data/places-ankara.json', './data/places-izmir.json', './data/places-antalya.json', './data/places-kapadokya.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).then(() => Promise.all(OPTIONAL.map((f) => c.add(f).catch(() => {})))).then(() => self.skipWaiting())));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network first for our own files so updates show up; fall back to cache when offline.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
