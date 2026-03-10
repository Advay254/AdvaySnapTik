// sw.js — AdvaySnapTik
// Exact same strategy as PinSaver (proven working):
//   HTML pages  → network-first (always fresh, cache only as offline fallback)
//   JS/CSS      → stale-while-revalidate (instant load + background updates)
//   API calls   → never cached, always network
//   Ad scripts  → never intercepted (external origin)
//   On deploy   → auto-activates and reloads all open tabs immediately

const CACHE  = 'ast-v6';
const ASSETS = ['/app.js', '/style.css', '/manifest.json'];

// ── Install: cache static assets only — NOT index.html ───────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate: wipe ALL old caches, claim all open tabs instantly ──────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. Never intercept API calls
  if (url.pathname.startsWith('/api/')) return;

  // 2. Never intercept external origins (fonts, CDN, ad networks)
  if (url.origin !== self.location.origin) return;

  // 3. HTML / navigation → NETWORK FIRST
  //    Always loads fresh HTML so ad scripts always execute on every visit.
  if (e.request.mode === 'navigate' ||
      (e.request.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 4. JS / CSS → stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        });
        return cached || network;
      })
    )
  );
});

// ── Listen for manual skip message from page ──────────────────────────────────
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
