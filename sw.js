/* VOID service worker v4. App shell only. Notes live in localStorage and are never touched here. */
const CACHE = 'void-shell-v6';
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
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('void-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Stale-while-revalidate: answer from cache at once, refresh in the background so the next launch is current. */
const swr = (e, req, key) => e.respondWith(caches.open(CACHE).then(async c => {
  const hit = await c.match(key || req, { ignoreSearch: true });
  const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(key || req, r.clone()); return r; }).catch(() => null);
  if (hit) { e.waitUntil(net); return hit; }
  return (await net) || new Response('VOID is not cached yet. Open it once while online.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (FONT_HOSTS.includes(url.hostname)) return swr(e, req);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') return swr(e, new Request('index.html', { cache: 'reload' }), 'index.html');
  swr(e, req);
});
