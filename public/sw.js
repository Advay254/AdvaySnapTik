// sw.js — AdvaySnapTik
// Strategy (mirrors PinSaver — proven reliable):
//   HTML / navigation → NETWORK FIRST, always fresh, cache only as offline fallback
//   JS / CSS / images → STALE WHILE REVALIDATE (instant load + updates in background)
//   API calls         → NEVER cached, always live network
//   Ad scripts        → NEVER intercepted, pass straight through
//   On new deploy     → auto-activates and reloads all open tabs immediately

const CACHE = 'ast-v4';                          // bumped — wipes all old caches on deploy
const ASSETS = ['/app.js', '/style.css', '/manifest.json', '/notification.wav'];

// ── Install: cache static assets only (NOT index.html) ───────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting(); // activate immediately, don't wait for tabs to close
});

// ── Activate: wipe ALL old caches, claim all open tabs instantly ──────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[ast-sw] deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim()) // take control of ALL open tabs right now
  );
});

// ── Fetch: smart strategy per request type ────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. Never intercept external origins (fonts, ad networks, CDN)
  if (url.origin !== self.location.origin) return;

  // 2. Share target — redirect TikTok URL to homepage
  if (url.pathname === '/share-target') {
    e.respondWith((async () => {
      const su = url.searchParams.get('url') || '';
      const st = url.searchParams.get('text') || '';
      const tt = su || (st.match(/https?:\/\/(?:(?:www\.|vm\.|vt\.|m\.)?tiktok\.com)\S+/i)?.[0] || '');
      return Response.redirect(tt ? `/?url=${encodeURIComponent(tt)}&source=share` : '/', 303);
    })());
    return;
  }

  // 3. Never intercept API calls — always live network
  if (url.pathname.startsWith('/api/')) return;

  // 4. HTML / navigation → NETWORK FIRST
  //    Always loads fresh HTML so ads always appear on every visit.
  //    Cache used ONLY as offline fallback.
  if (e.request.mode === 'navigate' ||
      (e.request.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request) || caches.match('/offline.html'))
    );
    return;
  }

  // 5. Static assets (JS/CSS/images/audio) → STALE WHILE REVALIDATE
  //    Serve cached instantly, fetch fresh in background for next visit.
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  let p;
  try { p = e.data.json(); } catch { p = { body: e.data.text() }; }
  e.waitUntil(self.registration.showNotification(p.title || 'AdvaySnapTik', {
    body:    p.body  || 'Your download is ready ⬇',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-96.png',
    sound:   '/notification.wav',          // Android respects this field
    tag:     'ast',
    renotify: true,
    data:    { url: p.url || '/' },
    actions: [
      { action: 'open',    title: '▶ Open' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const target = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const existing = cs.find(c => c.url.includes(self.location.origin));
      existing ? (existing.focus(), existing.navigate(target))
               : self.clients.openWindow(target);
    })
  );
});

// ── Background Sync — retry failed downloads when connection restores ─────────
self.addEventListener('sync', e => {
  if (e.tag === 'ast-sync') {
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SYNC_READY' }));
      })
    );
  }
});

// ── Periodic Background Sync — keep assets fresh silently ────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'ast-refresh') {
    e.waitUntil(
      caches.open(CACHE).then(cache =>
        Promise.allSettled(
          ASSETS.map(url =>
            fetch(url, { cache: 'no-cache' })
              .then(res => { if (res.ok) cache.put(url, res); })
              .catch(() => {})
          )
        )
      )
    );
  }
});

// ── Messages from page (manual skipWaiting) ───────────────────────────────────
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
