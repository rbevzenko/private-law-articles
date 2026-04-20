// Kill-switch v3: очищает все кэши, отключает SW и перезагружает открытые вкладки.
// Версия меняется намеренно, чтобы браузер скачал обновление у установивших PWA.
const SW_VERSION = 'kill-switch-v3-2026-04-20';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});

// Перехватываем все fetch и идём в сеть, минуя кэш — чтобы выдавалась свежая заглушка.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => Response.error()));
});

// Метка версии, чтобы файл гарантированно отличался: ${SW_VERSION}
