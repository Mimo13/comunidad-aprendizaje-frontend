/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

// Activar inmediatamente el nuevo SW y tomar control de los clientes
self.skipWaiting()
clientsClaim()

// Workbox injecta el manifest en build (injectManifest)
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
)

// Cache para fuentes de Google (si se usan)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// Cache para API de Actividades (NetworkFirst para tener datos frescos, pero offline fallback)
registerRoute(
  ({ url }) => url.pathname.includes('/api/activities'),
  new NetworkFirst({
    cacheName: 'api-activities',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache para Mis Inscripciones
registerRoute(
  ({ url }) => url.pathname.includes('/api/enrollments/my-enrollments'),
  new NetworkFirst({
    cacheName: 'api-enrollments',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache para Perfil de Usuario (para mantener sesión visualmente)
registerRoute(
  ({ url }) => url.pathname.includes('/api/auth/me') || url.pathname.includes('/api/auth/profile'),
  new NetworkFirst({
    cacheName: 'api-user',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  let data: any = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = {};
    }
  }
  if (!data || typeof data !== 'object') data = {};

  const { title, body, icon, badge, tag, url } = data;

  const options = {
    body: body || 'Tienes una nueva notificacion',
    icon: icon || '/icon-192x192.png',
    badge: badge || '/icon-72x72.png',
    tag: tag || 'push-generic',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: tag || 'push-generic',
      url: url || '/notifications'
    },
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title || 'Nueva notificacion', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    (async function() {
      // Intentar encontrar una ventana ya abierta
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      // Si hay una ventana abierta con esa URL (o la app en general), enfocarla
      for (const client of allClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no, abrir una nueva si es posible
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Manejar actualizaciones del service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano para notificaciones
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Intentar sincronizar notificaciones pendientes
    const cache = await caches.open('notifications-sync');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Error sincronizando notificación:', error);
      }
    }
  } catch (error) {
    console.error('Error en sincronización de notificaciones:', error);
  }
}
