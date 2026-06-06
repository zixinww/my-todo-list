// ─── Service Worker for My To-Do List ────────────────────────────
// A service worker is a background script that sits between the browser
// and the network. It intercepts requests and can serve files from a
// local cache — that's how the app works offline.

const CACHE_NAME = 'todo-pwa-v1';

// The list of files that make up the app.
// These get downloaded and saved the first time the user opens the app.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
];

// ─── Install ─────────────────────────────────────────────────────
// Fires once when the service worker is first registered.
// We open our cache and save all the app files into it.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())   // activate immediately, don't wait
  );
});

// ─── Activate ────────────────────────────────────────────────────
// Fires after install. We use this to delete old caches from previous
// versions of the app so the user always gets fresh files.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)   // find caches with old names
          .map((key) => caches.delete(key))       // delete each one
      )
    ).then(() => self.clients.claim())   // take control of open tabs right away
  );
});

// ─── Fetch ───────────────────────────────────────────────────────
// Fires every time the app requests anything (a file, an API call, etc.).
// Strategy: "cache first" — if we have it cached, return that instantly.
// If not (e.g. the weather API), go to the network normally.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;   // only cache GET requests

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;          // serve from cache (works offline)
      return fetch(event.request);        // fall back to network (e.g. weather)
    })
  );
});
