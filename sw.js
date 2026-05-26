const CACHE = 'netmon-v6';
// Resolve paths relative to SW location (works for both local / and GitHub Pages /network-monitor/)
const BASE = new URL('.', self.location).pathname;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([
    BASE,
    BASE + 'index.html',
    BASE + 'manifest.json',
    BASE + 'icon-192.png',
    BASE + 'icon-512.png'
  ])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for HTML, cache-first for static assets
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});

// Notify clients when new SW is available
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
