const CACHE_NAME = 'geology-v2.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кэширование основных ресурсов');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] ✅ Service Worker установлен');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] ❌ Ошибка установки:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] ✅ Service Worker активирован');
      return self.clients.claim();
    })
  );
});

// Fetch обработка (Network First)
self.addEventListener('fetch', (event) => {
  // Пропустить non-GET запросы
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кэшировать успешные ответы
        if (response.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        // Если нет интернета, вернуть из кэша
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Если нет в кэше, вернуть оффлайн страницу
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Фоновая синхронизация (для будущих версий)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-records') {
    event.waitUntil(
      (async () => {
        try {
          console.log('[SW] Синхронизация записей...');
          // Реализовать в версии 3.0
        } catch (error) {
          console.error('[SW] Ошибка синхронизации:', error);
        }
      })()
    );
  }
});

console.log('[SW] Service Worker загружен');
