// BLOCKVERSE Service Worker v2
const CACHE_NAME = 'blockverse-v2';
// Base path (works for GitHub Pages subpaths and root)
const BASE = new URL('./', self.location.href).pathname;

// Install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing... base =', BASE);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        BASE,
        BASE + 'index.html',
        BASE + 'manifest.json',
        BASE + 'icon-192.png',
        BASE + 'icon-512.png',
      ]).catch((err) => console.warn('[SW] Cache addAll failed:', err));
    })
  );
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch - Network First, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'BLOCKVERSE', {
      body: data.body || '친구가 초대했습니다!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'blockverse-invite',
      data: { url: data.url || '/' },
      actions: [
        { action: 'join', title: '🎮 입장하기' },
        { action: 'dismiss', title: '닫기' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'join' || event.action === '') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
  }
});
