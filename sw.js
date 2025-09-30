// Service Worker para Salem PWA
const CACHE_NAME = 'salem-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/js/simple-background-music.js',
  '/js/simple-web-speech.js',
  '/img/logo.png',
  '/audio/confession-time.mp3',
  '/audio/day-start.mp3',
  '/audio/night-start.mp3',
  '/audio/sheriff-phase.mp3',
  '/audio/time-warning.mp3',
  '/audio/villagers-win.mp3',
  '/audio/vote-time.mp3',
  '/audio/witch-phase.mp3',
  '/audio/witches-win.mp3',
  // Fuentes de Google Fonts
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Uncial+Antiqua&family=MedievalSharp&display=swap'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Cacheando archivos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Error durante la instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activación completada');
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si el archivo está en caché, devolverlo
        if (response) {
          return response;
        }

        // Si no está en caché, intentar obtenerlo de la red
        return fetch(event.request).then((response) => {
          // Verificar si la respuesta es válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta para poder usarla tanto para el caché como para devolver al navegador
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Si falla la red y no está en caché, devolver página offline si es una navegación
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificar al cliente cuando hay una nueva versión disponible
self.addEventListener('updatefound', () => {
  console.log('🔄 Service Worker: Nueva versión encontrada');
});