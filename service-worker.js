// Service Worker для PWA
const CACHE_NAME = 'field-geology-pwa-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
]

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] 🔧 Установка Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] ✅ Кэш открыт')
      return cache.addAll(urlsToCache).catch((error) => {
        console.warn('[SW] ⚠️ Ошибка кэширования:', error)
      })
    })
  )
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service Worker активирован')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 🗑️ Удаление старого кэша:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Только GET запросы
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Если в кэше - вернуть из кэша
      if (response) {
        console.log('[SW] 📦 Из кэша:', event.request.url)
        return response
      }

      // Иначе - загрузить с сервера
      return fetch(event.request)
        .then((response) => {
          // Не кэшировать если not ok
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Клонировать и кэшировать
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch((error) => {
          console.error('[SW] ❌ Fetch ошибка:', error)
          // Вернуть из кэша если сеть недоступна
          return caches.match(event.request)
        })
    })
  )
})

// Синхронизация в фоне (для данных)
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background Sync:', event.tag)
  if (event.tag === 'sync-geology-data') {
    event.waitUntil(syncData())
  }
})

// Функция синхронизации (пустая заглушка)
async function syncData() {
  console.log('[SW] 📤 Синхронизация данных...')
  return Promise.resolve()
}
