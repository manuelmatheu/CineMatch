// CineMatch service worker.
//
//   Shell (cache-first):       index.html, app.js, modules/*.js, css, icons,
//                              manifest, Google Fonts CSS + woff2.
//   TMDB images (SWR):         image.tmdb.org/t/p/* — keep them when offline,
//                              refresh in the background when online.
//   TMDB API + /api/* (live):  bypassed entirely. Recommendations and history
//                              already persist in localStorage; we never want
//                              a stale 24h-old TMDB response served as fresh.

const VERSION = 'cm-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const IMG_CACHE   = `${VERSION}-img`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/tokens.css',
  '/style.css',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/modules/data.js',
  '/modules/letterboxd.js',
  '/modules/notify.js',
  '/modules/recommendations.js',
  '/modules/resolver.js',
  '/modules/screens.js',
  '/modules/storage.js',
  '/modules/sync.js',
  '/modules/taste.js',
  '/modules/tmdb.js',
  '/modules/ui.js',
  '/modules/upcoming.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch { return; }

  // Bypass live data — these must always hit the network so the user
  // never sees yesterday's recommendations as today's.
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname === 'api.themoviedb.org') return;

  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(staleWhileRevalidate(request, IMG_CACHE));
    return;
  }

  if (
    url.origin === self.location.origin ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const resp = await fetch(request);
    if (resp.ok || resp.type === 'opaque') cache.put(request, resp.clone());
    return resp;
  } catch (err) {
    // Offline + uncached — let the browser's normal failure surface.
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then((resp) => {
    if (resp.ok || resp.type === 'opaque') cache.put(request, resp.clone());
    return resp;
  }).catch(() => cached);
  return cached || network;
}
