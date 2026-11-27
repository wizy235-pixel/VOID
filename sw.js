/* VOID service worker v3. App shell only. Notes live in localStorage and are never touched here. */
const CACHE = 'void-shell-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    try { await c.add(new Request('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap', { mode: 'no-cors' })); } catch {}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const withTimeout = (p, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); }); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (FONT_HOSTS.includes(url.hostname)) {   // fonts: cache first, refresh in background
    e.respondWith(caches.open(CACHE).then(async c => { const hit = await c.match(req); const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {   // pages: network first (3s), then the cached shell, ignoring ?query
    e.respondWith(withTimeout(fetch(req), 3000).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); } return r; })
      .catch(async () => (await caches.match('index.html')) || (await caches.match('./')) || new Response('VOID is offline and not cached yet. Open it once while online.', { status: 503, headers: { 'Content-Type': 'text/plain' } })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
