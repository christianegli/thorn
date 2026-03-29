const CACHE = 'thorn-v2';
const ASSETS = [
  '/',
  '/thorn.html',
  '/manifest.json',
  '/guide.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls: network only, never cache
  if (url.hostname === 'api.github.com' ||
      url.hostname.includes('openai') ||
      url.hostname.includes('anthropic') ||
      url.hostname.includes('groq') ||
      url.hostname.includes('openrouter') ||
      url.hostname.includes('fonts.googleapis') ||
      url.hostname.includes('fonts.gstatic')) {
    return;
  }

  // App files: cache-first, update in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached); // If fetch fails and we have cache, use cache

      return cached || fetchPromise;
    })
  );
});
