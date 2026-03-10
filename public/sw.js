// AdvaySnapTik Service Worker v1.0
// ✅ Offline  ✅ Background Sync  ✅ Periodic Sync  ✅ Push  ✅ Share Target
const CACHE = 'ast-v1';
const SHELL = ['/', '/index.html', '/wait.html', '/offline.html', '/manifest.json', '/style.css', '/app.js'];

self.addEventListener('install',  e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(Promise.all([
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))),
  self.clients.claim(),
])));

// Never intercept ad scripts or third-party resources
const BYPASS = ['millionairelucidlytransmitted.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Let ad CDN and external requests pass through untouched
  if (BYPASS.some(d => u.hostname.includes(d))) return;
  if (u.origin !== self.location.origin) return;
  if (u.pathname === '/share-target') { e.respondWith(shareHandler(u)); return; }
  if (u.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'Offline.' }), { status:503, headers:{'Content-Type':'application/json'} })));
    return;
  }
  // Navigation: always network-first, never serve stale HTML (breaks ad injection)
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request)
      .catch(async () => await caches.match(e.request) || caches.match('/offline.html')));
    return;
  }
  // Static assets: cache-first
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(r => {
    if (r.ok && r.type === 'basic') caches.open(CACHE).then(ch => ch.put(e.request, r.clone()));
    return r;
  })));
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', e => { if (e.tag === 'sync-pending') e.waitUntil(runSync()); });
async function runSync() {
  const db = await openDB(), all = await dbAll(db);
  for (const item of all) {
    try {
      const r = await fetch(`/api/info?url=${encodeURIComponent(item.url)}`);
      if (r.ok) { await dbDel(db, item.id); broadcast({ type:'SYNC_DONE', url:item.url }); }
    } catch {}
  }
}

// ── Periodic Sync ─────────────────────────────────────────────────────────────
self.addEventListener('periodicsync', e => { if (e.tag === 'refresh-cache') e.waitUntil(refreshCache()); });
async function refreshCache() {
  const c = await caches.open(CACHE);
  await Promise.allSettled(SHELL.map(u => fetch(u, { cache:'no-cache' }).then(r => { if (r.ok) c.put(u, r); })));
}

// ── Push ──────────────────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  let p; try { p = e.data.json(); } catch { p = { body: e.data.text() }; }
  e.waitUntil(self.registration.showNotification(p.title || 'AdvaySnapTik', {
    body: p.body || 'Your download is ready.', icon: '/icons/icon-192.png', badge: '/icons/icon-96.png',
    tag: 'ast', renotify: true, data: { url: p.url || '/' },
    actions: [{ action:'open', title:'▶ Open' }, { action:'dismiss', title:'✕ Dismiss' }],
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); if (e.action === 'dismiss') return;
  const t = e.notification.data?.url || '/';
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
    const ex = cs.find(c => c.url.includes(self.location.origin));
    ex ? (ex.focus(), ex.navigate(t)) : self.clients.openWindow(t);
  }));
});

// ── Share target ──────────────────────────────────────────────────────────────
async function shareHandler(url) {
  const su = url.searchParams.get('url')||'', st = url.searchParams.get('text')||'';
  const tt = su || (st.match(/https?:\/\/(?:(?:www\.|vm\.|vt\.|m\.)?tiktok\.com)\S+/i)?.[0]||'');
  return Response.redirect(tt ? `/?url=${encodeURIComponent(tt)}&source=share` : '/', 303);
}

// ── Messages ──────────────────────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'QUEUE_SYNC' && e.data.url)
    openDB().then(db => db.transaction('q','readwrite').objectStore('q').add({ url:e.data.url, ts:Date.now() }));
});

// ── IDB helpers ───────────────────────────────────────────────────────────────
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('ast-sync', 1);
    r.onupgradeneeded = e => e.target.result.createObjectStore('q', { keyPath:'id', autoIncrement:true });
    r.onsuccess = e => res(e.target.result); r.onerror = e => rej(e.target.error);
  });
}
function dbAll(db) { return new Promise((res,rej) => { const r=db.transaction('q','readonly').objectStore('q').getAll(); r.onsuccess=e=>res(e.target.result); r.onerror=e=>rej(e.target.error); }); }
function dbDel(db,id){ return new Promise((res,rej) => { const r=db.transaction('q','readwrite').objectStore('q').delete(id); r.onsuccess=()=>res(); r.onerror=e=>rej(e.target.error); }); }
async function broadcast(msg) { (await self.clients.matchAll({ type:'window' })).forEach(c => c.postMessage(msg)); }
